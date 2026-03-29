from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import Issue, IssueTimeline
from .serializers import IssueSerializer, IssueCreateSerializer, IssueAssignSerializer
from llm.llm_service import LLMService
from apps.authentication.models import User
from apps.authentication.permissions import IsAdmin
from apps.notifications.utils import create_notification


class IssueListCreateView(generics.ListCreateAPIView):
    """List issues or create a new one."""
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location', 'category']
    ordering_fields = ['created_at', 'priority', 'status']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return IssueCreateSerializer
        return IssueSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Issue.objects.select_related('created_by', 'assigned_supervisor').prefetch_related('timeline')

        # Check SLAs lazily (Option A)
        now = timezone.now()
        escalated_issues = Issue.objects.filter(
            status__in=['Open', 'Assigned', 'In Progress'],
            deadline_time__lt=now,
            is_escalated=False
        )
        
        if escalated_issues.exists():
            admins = User.objects.filter(role='admin')
            for issue in escalated_issues:
                issue.is_escalated = True
                issue.escalated_at = now
                issue.status = 'Escalated'
                issue.save(update_fields=['is_escalated', 'escalated_at', 'status'])
                
                IssueTimeline.objects.create(
                    issue=issue, status='Escalated',
                    note='SLA Deadline missed. Auto-escalated.',
                    created_by=None
                )
                
                for admin in admins:
                    create_notification(
                        user=admin,
                        message=f'SLA VIOLATION: Issue "{issue.title}" has been escalated.'
                    )

        if user.role == 'student':
            queryset = queryset.filter(created_by=user)
        elif user.role == 'supervisor':
            queryset = queryset.filter(assigned_supervisor=user)
        # admin sees all

        # Optional status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        issue = serializer.save(created_by=self.request.user)

        # 1. Duplicate Detection
        recent_issues = list(Issue.objects.exclude(id=issue.id).order_by('-created_at')[:10].values('id', 'title', 'description'))
        
        llm = LLMService()
        
        duplicate_result = llm.detect_duplicate(issue.description, recent_issues)
        issue.duplicate_score = duplicate_result.get('duplicate_score', 0.0)
        if issue.duplicate_score > 0.7:
             # Just note it, we don't drop the issue based on requirements.
             pass
        
        # 2. Analyze Issue
        analysis = llm.analyze_issue(issue.description)
        issue.category = analysis.get('category', 'General')
        issue.llm_category = issue.category
        issue.priority = analysis.get('priority', 'Medium')
        issue.llm_priority = issue.priority
        issue.ai_summary = analysis.get('summary', '')
        department = analysis.get('department', 'General')
        
        # 3. SLA Assignment
        from .models import SLA
        
        try:
            sla = SLA.objects.get(category=issue.category)
            issue.deadline_time = timezone.now() + timedelta(hours=sla.resolution_time)
            issue.sla_response_deadline = timezone.now() + timedelta(hours=sla.response_time)
            issue.sla_resolution_deadline = issue.deadline_time
        except SLA.DoesNotExist:
            # fallback
            issue.deadline_time = timezone.now() + timedelta(hours=48)
            
        # 4. Supervisor Assignment
        print(f"[DEBUG] Attempting auto-assignment for department: {department}")
        supervisors = User.objects.filter(role='supervisor', department__iexact=department)
        if supervisors.exists():
            issue.assigned_supervisor = supervisors.first()
            issue.status = 'Assigned'
            print(f"[DEBUG] Assigned to: {issue.assigned_supervisor.username}")
        else:
            print(f"[DEBUG] No supervisor found for department: {department}")
            
        issue.save()

        # Create timeline entry
        IssueTimeline.objects.create(
            issue=issue, status=issue.status,
            note='Issue reported', created_by=self.request.user
        )
        
        if issue.assigned_supervisor:
            IssueTimeline.objects.create(
                issue=issue, status='Assigned',
                note=f'Auto-assigned by LLM to {issue.assigned_supervisor.name}',
                created_by=None
            )
            create_notification(
                user=issue.assigned_supervisor,
                message=f'New issue auto-assigned to you: "{issue.title}"'
            )


class IssueDetailView(generics.RetrieveUpdateAPIView):
    """Get or update an issue."""
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]
    queryset = Issue.objects.select_related('created_by', 'assigned_supervisor').prefetch_related('timeline')

    def perform_update(self, serializer):
        old_issue = self.get_object()
        old_status = old_issue.status
        old_priority = old_issue.priority
        old_category = old_issue.category
        old_supervisor = old_issue.assigned_supervisor
        
        issue = serializer.save()
        
        # Check for admin overrides
        if getattr(self.request.user, 'role', '') == 'admin':
            if (issue.priority != old_priority or 
                issue.category != old_category or 
                issue.assigned_supervisor != old_supervisor):
                issue.override_llm = True
                issue.save(update_fields=['override_llm'])

        new_status = issue.status

        if old_status != new_status:
            IssueTimeline.objects.create(
                issue=issue, status=new_status,
                note=f'Status changed from {old_status} to {new_status}',
                created_by=self.request.user
            )

            if new_status == 'Resolved':
                issue.resolved_at = timezone.now()
                issue.save()

            # Notify the issue creator
            create_notification(
                user=issue.created_by,
                message=f'Your issue "{issue.title}" status changed to {new_status}'
            )


class IssueAssignView(APIView):
    """Assign an issue to a supervisor (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            issue = Issue.objects.get(pk=pk)
        except Issue.DoesNotExist:
            return Response({'error': 'Issue not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = IssueAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            supervisor = User.objects.get(pk=serializer.validated_data['supervisor_id'], role='supervisor')
        except User.DoesNotExist:
            return Response({'error': 'Supervisor not found'}, status=status.HTTP_404_NOT_FOUND)

        issue.assigned_supervisor = supervisor
        issue.status = 'Assigned'
        issue.save()

        IssueTimeline.objects.create(
            issue=issue, status='Assigned',
            note=f'Assigned to {supervisor.name}',
            created_by=request.user
        )

        # Notify supervisor
        create_notification(
            user=supervisor,
            message=f'New issue assigned to you: "{issue.title}"'
        )

        # Notify student
        create_notification(
            user=issue.created_by,
            message=f'Your issue "{issue.title}" has been assigned to {supervisor.name}'
        )

        return Response(IssueSerializer(issue).data)


class IssueAnalyticsView(APIView):
    """Analytics data for admin dashboard (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        issues = Issue.objects.all()

        # Category distribution
        categories = {}
        for issue in issues:
            cat = issue.category or 'Uncategorized'
            categories[cat] = categories.get(cat, 0) + 1

        # Status distribution
        statuses = {}
        for issue in issues:
            statuses[issue.status] = statuses.get(issue.status, 0) + 1

        # SLA violations
        now = timezone.now()
        sla_violated = issues.filter(
            sla_resolution_deadline__lt=now
        ).exclude(status='Resolved').count()

        # Average resolution time (for resolved issues)
        resolved = issues.filter(status='Resolved', resolved_at__isnull=False)
        avg_resolution_hours = 0
        if resolved.exists():
            total_hours = sum(
                (i.resolved_at - i.created_at).total_seconds() / 3600
                for i in resolved
            )
            avg_resolution_hours = round(total_hours / resolved.count(), 1)

        return Response({
            'total': issues.count(),
            'categories': [{'name': k, 'count': v} for k, v in categories.items()],
            'statuses': [{'name': k, 'count': v} for k, v in statuses.items()],
            'sla_violations': sla_violated,
            'avg_resolution_hours': avg_resolution_hours,
            'priority_distribution': {
                'High': issues.filter(priority='High').count(),
                'Medium': issues.filter(priority='Medium').count(),
                'Low': issues.filter(priority='Low').count(),
                'Critical': issues.filter(priority='Critical').count(),
            }
        })

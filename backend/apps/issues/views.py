from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import Issue, IssueTimeline
from .serializers import IssueSerializer, IssueCreateSerializer, IssueAssignSerializer
from .llm_service import classify_issue
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

        # LLM classification
        llm_result = classify_issue(issue.description)
        issue.category = llm_result['category']
        issue.llm_category = llm_result['category']
        issue.priority = llm_result['priority']
        issue.llm_priority = llm_result['priority']
        issue.llm_duplicate_score = llm_result['duplicate_score']

        # SLA deadlines based on priority
        sla_hours = {'Critical': 2, 'High': 8, 'Medium': 24, 'Low': 72}
        hours = sla_hours.get(issue.priority, 24)
        issue.sla_response_deadline = timezone.now() + timedelta(hours=hours)
        issue.sla_resolution_deadline = timezone.now() + timedelta(hours=hours * 3)

        issue.save()

        # Create timeline entry
        IssueTimeline.objects.create(
            issue=issue, status='Open',
            note='Issue reported', created_by=self.request.user
        )


class IssueDetailView(generics.RetrieveUpdateAPIView):
    """Get or update an issue."""
    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]
    queryset = Issue.objects.select_related('created_by', 'assigned_supervisor').prefetch_related('timeline')

    def perform_update(self, serializer):
        old_status = self.get_object().status
        issue = serializer.save()
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

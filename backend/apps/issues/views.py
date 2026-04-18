from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
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

        # Annotate duplicates for the aggregated score and ensure descending order
        queryset = queryset.annotate(duplicate_count=Count('duplicates')).order_by('-created_at')

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
            queryset = queryset.filter(assigned_supervisor=user, is_duplicate=False)
        else:
            # admin sees all issues
            pass

        # Optional status filter
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        issue = serializer.save(created_by=self.request.user)

        # ──────────────────────────────────────────────────────
        # STEP 1: Embedding-based duplicate detection
        # ──────────────────────────────────────────────────────
        combined_text = f"{issue.title}. {issue.description}"
        
        try:
            from llm.embedding_service import find_duplicate, generate_embedding, embedding_to_bytes
            
            dup_result = find_duplicate(combined_text)
            issue.duplicate_score = dup_result["score"]
            
            # Store embedding for future comparisons
            embedding = generate_embedding(combined_text)
            issue.embedding = embedding_to_bytes(embedding)
            
            print(f"[DUPLICATE CHECK] Score: {dup_result['score']:.4f}, Is Duplicate: {dup_result['is_duplicate']}")
            
            if dup_result["is_duplicate"] and dup_result["original_issue_id"]:
                # Mark as duplicate and link to original
                original = Issue.objects.get(id=dup_result["original_issue_id"])
                issue.is_duplicate = True
                issue.duplicate_of = original
                issue.llm_duplicate_score = dup_result["score"]
                
                # Inherit classification from original
                issue.category = original.category
                issue.llm_category = original.llm_category
                issue.priority = original.priority
                issue.llm_priority = original.llm_priority
                issue.ai_summary = f"[DUPLICATE of #{original.id}] {original.ai_summary}"
                
                # Same supervisor handles all duplicates
                issue.assigned_supervisor = original.assigned_supervisor
                issue.status = 'Assigned' if original.assigned_supervisor else 'Open'
                
                # Copy SLA from original
                issue.deadline_time = original.deadline_time
                issue.sla_response_deadline = original.sla_response_deadline
                issue.sla_resolution_deadline = original.sla_resolution_deadline
                
                issue.save()
                
                # Timeline entry
                IssueTimeline.objects.create(
                    issue=issue, status=issue.status,
                    note=f'Detected as duplicate of Issue #{original.id} (similarity: {dup_result["score"]:.0%}). Assigned to same supervisor.',
                    created_by=None
                )
                
                # Notify the original supervisor about the duplicate
                if original.assigned_supervisor:
                    create_notification(
                        user=original.assigned_supervisor,
                        message=f'Duplicate complaint detected: "{issue.title}" is similar to Issue #{original.id}'
                    )
                
                print(f"[DUPLICATE] Linked to Issue #{original.id}, same supervisor: {original.assigned_supervisor}")
                return  # Skip normal assignment flow
                
        except Exception as e:
            print(f"[EMBEDDING WARNING] Embedding service failed: {e} — continuing with normal flow")
            import traceback
            traceback.print_exc()

        # ──────────────────────────────────────────────────────
        # STEP 2: LLM Classification (with keyword fallback)
        # ──────────────────────────────────────────────────────
        llm = LLMService()
        analysis = llm.analyze_issue(issue.description)
        
        issue.category = analysis.get('category', 'General')
        issue.llm_category = issue.category
        issue.priority = analysis.get('priority', 'Medium')
        issue.llm_priority = issue.priority
        issue.ai_summary = analysis.get('summary', '')
        department = analysis.get('department', 'General')
        
        # ──────────────────────────────────────────────────────
        # STEP 3: SLA Assignment
        # ──────────────────────────────────────────────────────
        from .models import SLA
        
        try:
            sla = SLA.objects.get(category=issue.category)
            issue.deadline_time = timezone.now() + timedelta(hours=sla.resolution_time)
            issue.sla_response_deadline = timezone.now() + timedelta(hours=sla.response_time)
            issue.sla_resolution_deadline = issue.deadline_time
        except SLA.DoesNotExist:
            # fallback
            issue.deadline_time = timezone.now() + timedelta(hours=48)
            
        # ──────────────────────────────────────────────────────
        # STEP 4: Load-Balanced Supervisor Assignment
        # ──────────────────────────────────────────────────────
        print(f"[DEBUG] Attempting auto-assignment for department: {department}")
        
        # Find supervisors in the matching department, sorted by fewest active issues
        supervisors = User.objects.filter(
            role='supervisor',
            department__iexact=department
        ).annotate(
            active_count=Count(
                'assigned_issues',
                filter=Q(assigned_issues__status__in=['Open', 'Assigned', 'In Progress'])
            )
        ).order_by('active_count')
        
        if supervisors.exists():
            # Assign to supervisor with fewest active issues (load balancing)
            issue.assigned_supervisor = supervisors.first()
            issue.status = 'Assigned'
            print(f"[DEBUG] Assigned to: {issue.assigned_supervisor.username} (active issues: {supervisors.first().active_count})")
        else:
            # Fallback: try any supervisor if department match fails
            all_supervisors = User.objects.filter(role='supervisor').annotate(
                active_count=Count(
                    'assigned_issues',
                    filter=Q(assigned_issues__status__in=['Open', 'Assigned', 'In Progress'])
                )
            ).order_by('active_count')
            
            if all_supervisors.exists():
                issue.assigned_supervisor = all_supervisors.first()
                issue.status = 'Assigned'
                print(f"[DEBUG] No dept match — fallback assigned to: {issue.assigned_supervisor.username}")
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
                note=f'Auto-assigned by LLM to {issue.assigned_supervisor.name} (Category: {issue.category})',
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
        issue.override_llm = True  # Mark as admin override
        issue.save()

        IssueTimeline.objects.create(
            issue=issue, status='Assigned',
            note=f'Manually assigned to {supervisor.name} by admin',
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


class SupervisorTaskAssignView(APIView):
    """Assign an issue to a specific staff member (Supervisor only)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'supervisor':
            return Response({'error': 'Only supervisors can assign tasks to members.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            issue = Issue.objects.get(pk=pk, assigned_supervisor=request.user)
        except Issue.DoesNotExist:
            return Response({'error': 'Issue not found or not assigned to you.'}, status=status.HTTP_404_NOT_FOUND)

        worker_id = request.data.get('worker_id')
        member_id = request.data.get('member_id') # backward compatibility
        
        if worker_id:
            from apps.authentication.models import Worker
            try:
                worker = Worker.objects.get(pk=worker_id, supervisor=request.user)
                issue.assigned_worker = worker
                issue.status = 'Assigned'
                issue.save()
                
                IssueTimeline.objects.create(
                    issue=issue, status='Assigned',
                    note=f'Task assigned to worker {worker.name} by supervisor {request.user.name}',
                    created_by=request.user
                )
                
                return Response(IssueSerializer(issue).data)
            except Worker.DoesNotExist:
                return Response({'error': 'Worker not found or not under your supervision.'}, status=status.HTTP_404_NOT_FOUND)

        # Legacy assignment to staff (User)
        if member_id:
            try:
                member = User.objects.get(pk=member_id, supervisor=request.user)
                issue.completed_by = member
                issue.status = 'Assigned'
                issue.save()

                IssueTimeline.objects.create(
                    issue=issue, status='Assigned',
                    note=f'Task assigned to staff member {member.name} by supervisor {request.user.name}',
                    created_by=request.user
                )
                return Response(IssueSerializer(issue).data)
            except User.DoesNotExist:
                return Response({'error': 'Member not found or not under your supervision.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'error': 'worker_id or member_id required.'}, status=status.HTTP_400_BAD_REQUEST)


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

        # Duplicate stats
        duplicate_count = issues.filter(is_duplicate=True).count()

        return Response({
            'total': issues.count(),
            'categories': [{'name': k, 'count': v} for k, v in categories.items()],
            'statuses': [{'name': k, 'count': v} for k, v in statuses.items()],
            'sla_violations': sla_violated,
            'avg_resolution_hours': avg_resolution_hours,
            'duplicate_count': duplicate_count,
            'priority_distribution': {
                'High': issues.filter(priority='High').count(),
                'Medium': issues.filter(priority='Medium').count(),
                'Low': issues.filter(priority='Low').count(),
                'Critical': issues.filter(priority='Critical').count(),
            }
        })

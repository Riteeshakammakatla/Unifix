from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CustomTokenObtainPairSerializer, UserSerializer, UserCreateSerializer,
    WorkerSerializer, WorkerAddRequestSerializer, WorkerAuditLogSerializer
)
from .permissions import IsAdmin
from .models import User, MemberAdditionLog, Worker, WorkerAddRequest, WorkerAuditLog


from .otp_service import OTPService
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken


class LoginView(TokenObtainPairView):
    """
    JWT login endpoint. 
    If user is Admin, triggers OTP and returns PENDING_OTP status.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(getattr(e, 'detail', str(e)), status=status.HTTP_401_UNAUTHORIZED)
            
        user = serializer.user
        
        # 1. Check if account is locked
        if user.locked_until and user.locked_until > timezone.now():
            diff = user.locked_until - timezone.now()
            minutes = int(diff.total_seconds() // 60) + 1
            return Response(
                {'detail': f'Account locked due to multiple failed OTP attempts. Try again in {minutes} minutes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. If Admin, enforce OTP
        if user.role == 'admin':
            success = OTPService.create_and_send_otp(user)
            if success:
                return Response({
                    'otp_required': True,
                    'email': user.email,
                    'detail': 'OTP sent to your registered email.'
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'detail': 'Failed to send OTP email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # 3. For others, return standard tokens
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """Verify 6-digit OTP and return JWT tokens if successful."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        
        if not email or not otp_code:
            return Response({'detail': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        is_valid, error_msg = OTPService.verify_otp(user, otp_code)
        
        if is_valid:
            # Generate tokens manually on success
            refresh = RefreshToken.for_user(user)
            
            # Custom claims to match TokenObtainPairSerializer
            refresh['role'] = user.role
            refresh['name'] = user.name
            refresh['email'] = user.email
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'role': user.role,
                'name': user.name,
                'email': user.email
            }, status=status.HTTP_200_OK)
        else:
            # Handle specific lockout status code
            status_code = status.HTTP_403_FORBIDDEN if "locked" in error_msg.lower() else status.HTTP_401_UNAUTHORIZED
            return Response({'detail': error_msg}, status=status_code)


class ResendOTPView(APIView):
    """Resend a new OTP to the admin user."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if user.role != 'admin':
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Check lockout
        if user.locked_until and user.locked_until > timezone.now():
            return Response({'detail': 'Account is locked.'}, status=status.HTTP_403_FORBIDDEN)

        # Basic cooldown check (latest OTP created < 30s ago)
        latest_otp = user.otps.first()
        if latest_otp and (timezone.now() - latest_otp.created_at).total_seconds() < 30:
            return Response({'detail': 'Please wait 30 seconds before requesting a new OTP.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        success = OTPService.create_and_send_otp(user)
        if success:
            return Response({'detail': 'New OTP sent.'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Failed to send OTP.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SupervisorMemberListView(generics.ListAPIView):
    """List users supervised by the current supervisor."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'supervisor':
            return User.objects.none()
        return User.objects.filter(supervisor=self.request.user).order_by('first_name')


class SupervisorAddMemberView(APIView):
    """Supervisor adds a member to their team. Creates user if not exists."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'supervisor':
            return Response({'detail': 'Only supervisors can add members.'}, status=status.HTTP_403_FORBIDDEN)
            
        email = request.data.get('email')
        name = request.data.get('name', '')
        department = request.data.get('department') or request.user.department

        if not name:
            return Response({'detail': 'Name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle missing email by generating a placeholder
        if not email:
            import uuid
            # sanitized name for slug
            slug = name.lower().replace(' ', '_')
            email = f"{slug}_{uuid.uuid4().hex[:6]}@unifix.local"

        user_to_add = User.objects.filter(email=email).first()
        
        if not user_to_add:
            # Create new staff member
            first_name = name.split(' ')[0] if ' ' in name else name
            last_name = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            
            user_to_add = User.objects.create(
                email=email,
                username=email,
                first_name=first_name,
                last_name=last_name,
                role='staff',
                department=department,
                supervisor=request.user
            )
            user_to_add.set_password('UniFix123')
            user_to_add.save()
            is_new = True
        else:
            if user_to_add.supervisor and user_to_add.supervisor != request.user:
                return Response({'detail': f'User is already assigned to another supervisor ({user_to_add.supervisor.name}).'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Link to this supervisor
            user_to_add.supervisor = request.user
            if user_to_add.role == 'student':
                user_to_add.role = 'staff'
            if department:
                user_to_add.department = department
            user_to_add.save()
            is_new = False
        
        # Log the addition
        MemberAdditionLog.objects.create(supervisor=request.user, user=user_to_add)
        
        # Notify Admin
        from apps.notifications.utils import create_notification
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                message=f'MEMBER ADDED: {request.user.name} added {user_to_add.name} ({"New" if is_new else "Existing"}) to department {user_to_add.department}'
            )
            
        return Response(UserSerializer(user_to_add).data, status=status.HTTP_200_OK if not is_new else status.HTTP_201_CREATED)


class AdminMemberAdditionLogView(generics.ListAPIView):
    """Admin view for member addition logs."""
    from .serializers import MemberAdditionLogSerializer
    serializer_class = MemberAdditionLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = MemberAdditionLog.objects.all()


class WorkerAddRequestListCreateView(generics.ListCreateAPIView):
    """Supervisors request to add workers, Admins see pending requests."""
    serializer_class = WorkerAddRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return WorkerAddRequest.objects.all().order_by('-timestamp')
        return WorkerAddRequest.objects.filter(supervisor=user).order_by('-timestamp')

    def perform_create(self, serializer):
        req = serializer.save(supervisor=self.request.user)
        # Notify Admins
        from apps.notifications.utils import create_notification
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                message=f"New worker add request from {self.request.user.name}: {req.name} ({req.role})"
            )


class WorkerAddRequestApprovalView(APIView):
    """Admin approves or rejects a worker request."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        from .models import Worker, WorkerAuditLog
        from apps.notifications.utils import create_notification
        
        try:
            worker_request = WorkerAddRequest.objects.get(pk=pk)
        except WorkerAddRequest.DoesNotExist:
            return Response({'detail': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action') # approve or reject
        reason = request.data.get('reason', '')

        if action == 'approve':
            worker_request.status = 'approved'
            worker_request.save()
            
            # Create the worker
            worker = Worker.objects.create(
                name=worker_request.name,
                role_type=worker_request.role,
                supervisor=worker_request.supervisor,
                created_by=request.user
            )

            # Audit log
            WorkerAuditLog.objects.create(
                action='Approved worker request',
                performed_by=request.user,
                target_request=worker_request,
                target_worker=worker,
                details=f"Approved {worker_request.name}"
            )

            # Notify supervisor
            create_notification(
                user=worker_request.supervisor,
                message=f"Worker request for {worker_request.name} was approved."
            )
            
            return Response({'detail': 'Request approved and worker created.'}, status=status.HTTP_200_OK)

        elif action == 'reject':
            worker_request.status = 'rejected'
            worker_request.rejection_reason = reason
            worker_request.save()

            # Audit log
            WorkerAuditLog.objects.create(
                action='Rejected worker request',
                performed_by=request.user,
                target_request=worker_request,
                details=f"Rejected {worker_request.name}. Reason: {reason}"
            )

            # Notify supervisor
            create_notification(
                user=worker_request.supervisor,
                message=f"Worker request for {worker_request.name} was rejected. Reason: {reason}"
            )

            return Response({'detail': 'Request rejected.'}, status=status.HTTP_200_OK)

        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class WorkerListView(generics.ListAPIView):
    """List workers for the current supervisor."""
    serializer_class = WorkerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Worker.objects.all().order_by('name')
        return Worker.objects.filter(supervisor=user, is_active=True).order_by('name')

class WorkerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin only: can reassign or deactivate workers."""
    serializer_class = WorkerSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Worker.objects.all()

    def perform_update(self, serializer):
        old_worker = self.get_object()
        new_worker = serializer.save()
        
        # Log if reassigned
        if old_worker.supervisor != new_worker.supervisor:
            WorkerAuditLog.objects.create(
                action='Reassigned worker',
                performed_by=self.request.user,
                target_worker=new_worker,
                details=f"Reassigned from {old_worker.supervisor.name} to {new_worker.supervisor.name}"
            )
        
        # Log if status changed
        if old_worker.is_active != new_worker.is_active:
            WorkerAuditLog.objects.create(
                action='Worker status changed',
                performed_by=self.request.user,
                target_worker=new_worker,
                details=f"Active status changed from {old_worker.is_active} to {new_worker.is_active}"
            )


class WorkerAuditLogListView(generics.ListAPIView):
    """List audit logs (admin only)."""
    serializer_class = WorkerAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = WorkerAuditLog.objects.all().order_by('-timestamp')


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class SupervisorListView(generics.ListAPIView):
    """List all supervisors with their team counts (admin only)."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        from django.db.models import Count
        return User.objects.filter(role='supervisor').annotate(
            team_count=Count('supervised_users')
        ).order_by('first_name')


class AdminUserListView(generics.ListAPIView):
    """List all users (admin only)."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        # Optional role filter
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AdminUserCreateView(generics.CreateAPIView):
    """Create a new user (admin only). Passwords are properly hashed."""
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class AdminUserDeleteView(generics.DestroyAPIView):
    """Delete a user (admin only). Cannot delete yourself."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserPasswordResetView(APIView):
    """Reset a user's password (admin only)."""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk, *args, **kwargs):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
        new_password = request.data.get('password')
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)

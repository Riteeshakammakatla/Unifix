from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access control."""
    
    class Role(models.TextChoices):
        STUDENT = 'student', 'Student/Faculty'
        ADMIN = 'admin', 'Admin'
        SUPERVISOR = 'supervisor', 'Supervisor'
        STAFF = 'staff', 'Maintenance Staff'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    department = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    
    # Hierarchy: User -> Supervisor
    supervisor = models.ForeignKey(
        'self', on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='supervised_users'
    )
    
    # 2FA Security Fields (Used for Admins)
    otp_fail_count = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def name(self):
        return self.get_full_name() or self.username


class MemberAdditionLog(models.Model):
    """Logs when a supervisor adds a new member to their team."""
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addition_logs_as_supervisor')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addition_logs_as_member')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.supervisor.name} added {self.user.name} at {self.timestamp}"


class AdminOTP(models.Model):
    """Stores hashed OTP codes for Admin MFA."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    otp_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email} (Expires: {self.expires_at})"

class Worker(models.Model):
    """Worker entity managed by supervisors."""
    
    class Status(models.TextChoices):
        FREE = 'free', 'Free'
        BUSY = 'busy', 'Busy'

    name = models.CharField(max_length=255)
    role_type = models.CharField(max_length=100)  # electrician, plumber, etc.
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.FREE)
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workers')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_workers')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.role_type})"


class WorkerAddRequest(models.Model):
    """Request from supervisor to add a new worker."""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    name = models.CharField(max_length=255)
    role = models.CharField(max_length=100)
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='worker_requests')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Request for {self.name} by {self.supervisor.name}"


class WorkerAuditLog(models.Model):
    """Audit log for worker management actions."""
    
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='worker_audit_logs')
    target_request = models.ForeignKey(WorkerAddRequest, on_delete=models.SET_NULL, null=True, blank=True)
    target_worker = models.ForeignKey(Worker, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.action} by {self.performed_by.name} at {self.timestamp}"

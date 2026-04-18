from django.db import models
from django.conf import settings


class SLA(models.Model):
    """Service Level Agreement for issue categories."""
    category = models.CharField(max_length=100, unique=True)
    response_time = models.IntegerField(help_text="Response time in hours")
    resolution_time = models.IntegerField(help_text="Resolution time in hours")

    class Meta:
        verbose_name_plural = "SLAs"

    def __str__(self):
        return f"{self.category} ({self.resolution_time}h)"

class Issue(models.Model):
    """Campus maintenance issue reported by a student."""

    class Status(models.TextChoices):
        OPEN = 'Open', 'Open'
        ASSIGNED = 'Assigned', 'Assigned'
        IN_PROGRESS = 'In Progress', 'In Progress'
        RESOLVED = 'Resolved', 'Resolved'
        ESCALATED = 'Escalated', 'Escalated'

    class Priority(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'
        CRITICAL = 'Critical', 'Critical'

    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, default='')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    image = models.ImageField(upload_to='issues/', blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='reported_issues'
    )
    assigned_supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_issues'
    )
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='completed_issues'
    )
    assigned_worker = models.ForeignKey(
        'authentication.Worker', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_issues'
    )

    # LLM classification results
    llm_category = models.CharField(max_length=100, blank=True, default='')
    llm_priority = models.CharField(max_length=20, blank=True, default='')
    llm_duplicate_score = models.FloatField(default=0.0)
    ai_summary = models.TextField(blank=True, default='')
    duplicate_score = models.FloatField(default=0.0)
    override_llm = models.BooleanField(default=False)

    # Duplicate detection (embedding-based)
    embedding = models.BinaryField(null=True, blank=True, help_text="Sentence-transformer embedding stored as bytes")
    is_duplicate = models.BooleanField(default=False)
    duplicate_of = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='duplicates',
        help_text="Original issue this is a duplicate of"
    )

    # SLA tracking
    sla_response_deadline = models.DateTimeField(null=True, blank=True)
    sla_resolution_deadline = models.DateTimeField(null=True, blank=True)
    deadline_time = models.DateTimeField(null=True, blank=True)
    is_escalated = models.BooleanField(default=False)
    escalated_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Resolution
    resolution_notes = models.TextField(blank=True, default='')
    resolution_proof = models.ImageField(upload_to='resolutions/', blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.title}"


class IssueTimeline(models.Model):
    """Timeline entry for tracking issue status changes."""
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='timeline')
    status = models.CharField(max_length=20)
    note = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.issue.title} → {self.status}"

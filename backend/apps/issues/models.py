from django.db import models
from django.conf import settings


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

    # LLM classification results
    llm_category = models.CharField(max_length=100, blank=True, default='')
    llm_priority = models.CharField(max_length=20, blank=True, default='')
    llm_duplicate_score = models.FloatField(default=0.0)

    # SLA tracking
    sla_response_deadline = models.DateTimeField(null=True, blank=True)
    sla_resolution_deadline = models.DateTimeField(null=True, blank=True)

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

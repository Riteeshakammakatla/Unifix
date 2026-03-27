from django.db import models
from django.conf import settings


class Material(models.Model):
    """Inventory material item."""

    class MaterialType(models.TextChoices):
        CONSUMABLE = 'Consumable', 'Consumable'
        REUSABLE = 'Reusable', 'Reusable'

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, default='')
    available_quantity = models.PositiveIntegerField(default=0)
    material_type = models.CharField(max_length=20, choices=MaterialType.choices, default=MaterialType.CONSUMABLE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.available_quantity})"


class IssueMaterialUsage(models.Model):
    """Materials used for resolving an issue."""

    class UsageStatus(models.TextChoices):
        CONSUMED = 'Consumed', 'Consumed'
        RETURNED = 'Returned', 'Returned'

    issue = models.ForeignKey('issues.Issue', on_delete=models.CASCADE, related_name='material_usage')
    item_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    material_type = models.CharField(max_length=20, choices=Material.MaterialType.choices, default='Consumable')
    status = models.CharField(max_length=20, choices=UsageStatus.choices, default=UsageStatus.CONSUMED)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item_name} x{self.quantity} for Issue #{self.issue_id}"


class MaterialRequest(models.Model):
    """Material request submitted by supervisor."""

    class RequestStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        REJECTED = 'Rejected', 'Rejected'

    class Urgency(models.TextChoices):
        LOW = 'Low', 'Low'
        MEDIUM = 'Medium', 'Medium'
        HIGH = 'High', 'High'
        CRITICAL = 'Critical', 'Critical'

    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='material_requests')
    item_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    reason = models.TextField()
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.MEDIUM)
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING)
    admin_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.item_name} x{self.quantity} [{self.status}]"

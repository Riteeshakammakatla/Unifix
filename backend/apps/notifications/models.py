from django.db import models
from django.conf import settings


class Notification(models.Model):
    """User notification for system events."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{'[Read]' if self.is_read else '[Unread]'} {self.message[:50]}"

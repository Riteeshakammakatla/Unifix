"""Utility function to create notifications."""
from .models import Notification


def create_notification(user, message):
    """Create a notification for a user."""
    return Notification.objects.create(user=user, message=message)

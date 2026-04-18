from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-read'),
    path('notifications/mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification-mark-all'),
]

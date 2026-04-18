from django.urls import path
from . import views

urlpatterns = [
    path('issues/', views.IssueListCreateView.as_view(), name='issue-list-create'),
    path('issues/<int:pk>/', views.IssueDetailView.as_view(), name='issue-detail'),
    path('issues/<int:pk>/assign/', views.IssueAssignView.as_view(), name='issue-assign'),
    path('issues/<int:pk>/assign-member/', views.SupervisorTaskAssignView.as_view(), name='supervisor-task-assign'),
    path('issues/analytics/', views.IssueAnalyticsView.as_view(), name='issue-analytics'),
]

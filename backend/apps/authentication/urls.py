from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('supervisors/', views.SupervisorListView.as_view(), name='supervisor-list'),
    # Admin user management
    path('users/', views.AdminUserListView.as_view(), name='user-list'),
    path('users/create/', views.AdminUserCreateView.as_view(), name='user-create'),
    path('users/<int:pk>/delete/', views.AdminUserDeleteView.as_view(), name='user-delete'),
    path('users/<int:pk>/reset-password/', views.AdminUserPasswordResetView.as_view(), name='user-reset-password'),
    
    # 2FA / OTP
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    
    # Hierarchy / Member Management
    path('members/', views.SupervisorMemberListView.as_view(), name='member-list'),
    path('members/add/', views.SupervisorAddMemberView.as_view(), name='member-add'),
    path('members/addition-logs/', views.AdminMemberAdditionLogView.as_view(), name='member-addition-logs'),
    # Worker Management
    path('workers/', views.WorkerListView.as_view(), name='worker-list'),
    path('workers/<int:pk>/', views.WorkerRetrieveUpdateDestroyView.as_view(), name='worker-detail'),
    path('workers/requests/', views.WorkerAddRequestListCreateView.as_view(), name='worker-request-list'),
    path('workers/requests/<int:pk>/approve/', views.WorkerAddRequestApprovalView.as_view(), name='worker-request-approve'),
    path('workers/audit-logs/', views.WorkerAuditLogListView.as_view(), name='worker-audit-logs'),
]

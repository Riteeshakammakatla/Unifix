from django.urls import path
from . import views

urlpatterns = [
    path('materials/', views.MaterialListCreateView.as_view(), name='material-list'),
    path('material-usage/', views.MaterialUsageCreateView.as_view(), name='material-usage'),
    path('material-requests/', views.MaterialRequestListCreateView.as_view(), name='material-request-list'),
    path('material-requests/<int:pk>/', views.MaterialRequestUpdateView.as_view(), name='material-request-update'),
]

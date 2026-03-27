from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Material, IssueMaterialUsage, MaterialRequest
from .serializers import MaterialSerializer, IssueMaterialUsageSerializer, MaterialRequestSerializer
from apps.notifications.utils import create_notification
from apps.authentication.models import User


class MaterialListCreateView(generics.ListCreateAPIView):
    """List or create materials."""
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    queryset = Material.objects.all()


class MaterialUsageCreateView(generics.ListCreateAPIView):
    """Record material usage for an issue."""
    serializer_class = IssueMaterialUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        issue_id = self.request.query_params.get('issue_id')
        qs = IssueMaterialUsage.objects.all()
        if issue_id:
            qs = qs.filter(issue_id=issue_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class MaterialRequestListCreateView(generics.ListCreateAPIView):
    """List or create material requests."""
    serializer_class = MaterialRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'supervisor':
            return MaterialRequest.objects.filter(supervisor=user)
        return MaterialRequest.objects.all()

    def perform_create(self, serializer):
        request_obj = serializer.save(supervisor=self.request.user)
        # Notify all admins
        admins = User.objects.filter(role='admin')
        for admin in admins:
            create_notification(
                user=admin,
                message=f'New material request from {self.request.user.name}: {request_obj.item_name} x{request_obj.quantity}'
            )


class MaterialRequestUpdateView(generics.UpdateAPIView):
    """Admin approves or rejects a material request."""
    serializer_class = MaterialRequestSerializer
    permission_classes = [IsAuthenticated]
    queryset = MaterialRequest.objects.all()

    def perform_update(self, serializer):
        request_obj = serializer.save()
        # Notify supervisor
        create_notification(
            user=request_obj.supervisor,
            message=f'Your material request for {request_obj.item_name} has been {request_obj.status.lower()}'
        )

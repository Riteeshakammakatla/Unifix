from rest_framework import generics, status, views
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Material, IssueMaterialUsage, MaterialRequest
from .serializers import MaterialSerializer, IssueMaterialUsageSerializer, MaterialRequestSerializer, InventoryTransactionSerializer
from apps.notifications.utils import create_notification
from apps.authentication.models import User


class MaterialListCreateView(generics.ListCreateAPIView):
    """List or create materials (Supervisor-Bound)."""
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Material.objects.all()
        # Supervisors only see their own inventory
        return Material.objects.filter(supervisor=user)

    def perform_create(self, serializer):
        # Automatically assign to supervisor if not admin
        supervisor = self.request.user if self.request.user.role == 'supervisor' else None
        # If admin provides a supervisor_id in data, it will be used
        material = serializer.save(supervisor=supervisor)
        
        # Log initial creation if quantity > 0
        if material.total_quantity > 0:
            from .models import InventoryTransaction
            InventoryTransaction.objects.create(
                material=material,
                action='add',
                quantity=material.total_quantity,
                performed_by=self.request.user
            )

class MaterialRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """Admin or supervisor can update/delete materials."""
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    queryset = Material.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Material.objects.all()
        return Material.objects.filter(supervisor=user)

    def perform_update(self, serializer):
        old_material = self.get_object()
        new_material = serializer.save()
        
        # If total quantity was updated manually, log it
        if old_material.total_quantity != new_material.total_quantity:
            diff = new_material.total_quantity - old_material.total_quantity
            action = 'add' if diff > 0 else 'use' # Simple logic for manual adjustment
            from .models import InventoryTransaction
            InventoryTransaction.objects.create(
                material=new_material,
                action=action,
                quantity=abs(diff),
                performed_by=self.request.user
            )


class MaterialActionView(APIView):
    """Sync logic: Add or Use materials."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from .models import InventoryTransaction
        try:
            material = Material.objects.get(pk=pk)
        except Material.DoesNotExist:
            return Response({'detail': 'Material not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Permission check: Only supervisor or admin
        if request.user.role != 'admin' and material.supervisor != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action') # add or use
        quantity = int(request.data.get('quantity', 0))

        if quantity <= 0:
            return Response({'detail': 'Quantity must be positive.'}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'add':
            material.total_quantity += quantity
            material.available_quantity += quantity
            material.save()
            
            InventoryTransaction.objects.create(
                material=material,
                action='add',
                quantity=quantity,
                performed_by=request.user
            )
            return Response({'detail': f'Added {quantity} to total.'}, status=status.HTTP_200_OK)

        elif action == 'use':
            if material.available_quantity < quantity:
                return Response({'detail': 'Insufficient available quantity.'}, status=status.HTTP_400_BAD_REQUEST)
            
            material.available_quantity -= quantity
            material.used_quantity += quantity
            material.save()

            InventoryTransaction.objects.create(
                material=material,
                action='use',
                quantity=quantity,
                performed_by=request.user
            )
            return Response({'detail': f'Used {quantity} units.'}, status=status.HTTP_200_OK)

        return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        material = serializer.validated_data.get('material')
        req_qty = serializer.validated_data.get('quantity', 1)

        if material.available_quantity < req_qty:
            return Response(
                {'detail': f'Insufficient stock. Requested: {req_qty}, Available: {material.available_quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Deduct stock
        material.available_quantity -= req_qty
        material.used_quantity += req_qty
        material.save()

        # Log transaction
        from .models import InventoryTransaction
        InventoryTransaction.objects.create(
            material=material,
            action='use',
            quantity=req_qty,
            performed_by=request.user
        )

        response = super().create(request, *args, **kwargs)
        return response

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
        item_name = serializer.validated_data.get('item_name')
        requested_quantity = serializer.validated_data.get('quantity', 1)
        
        # REQUEST LOGIC: Allow material request only if available_quantity insufficient
        # Look for the material in supervisor's inventory
        material = Material.objects.filter(supervisor=self.request.user, material_name__iexact=item_name).first()
        
        if material and material.available_quantity >= requested_quantity:
            return Response(
                {'detail': f'Material {item_name} is already available in sufficient quantity ({material.available_quantity}).'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
class MaterialTransactionListView(generics.ListAPIView):
    """List transaction logs."""
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from .models import InventoryTransaction
        user = self.request.user
        if user.role == 'admin':
            return InventoryTransaction.objects.all().order_by('-timestamp')
        return InventoryTransaction.objects.filter(material__supervisor=user).order_by('-timestamp')

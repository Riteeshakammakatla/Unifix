from rest_framework import serializers
from .models import Material, IssueMaterialUsage, MaterialRequest, InventoryTransaction


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class IssueMaterialUsageSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.material_name', read_only=True)
    material_type = serializers.CharField(source='material.material_type', read_only=True)

    class Meta:
        model = IssueMaterialUsage
        fields = '__all__'
        read_only_fields = ['id', 'recorded_by', 'created_at']


class MaterialRequestSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)

    class Meta:
        model = MaterialRequest
        fields = [
            'id', 'supervisor', 'supervisor_name', 'item_name', 'quantity',
            'reason', 'urgency', 'status', 'admin_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'supervisor', 'created_at', 'updated_at']

class InventoryTransactionSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.name', read_only=True)
    material_name = serializers.CharField(source='material.material_name', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = '__all__'

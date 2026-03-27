from rest_framework import serializers
from .models import Material, IssueMaterialUsage, MaterialRequest


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'


class IssueMaterialUsageSerializer(serializers.ModelSerializer):
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

from rest_framework import serializers
from .models import Issue, IssueTimeline
from apps.authentication.serializers import UserSerializer


class IssueTimelineSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, default='')

    class Meta:
        model = IssueTimeline
        fields = ['id', 'status', 'note', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class IssueSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    assigned_supervisor_name = serializers.CharField(
        source='assigned_supervisor.name', read_only=True, default=''
    )
    completed_by_name = serializers.CharField(
        source='completed_by.name', read_only=True, default=''
    )
    assigned_worker_name = serializers.CharField(
        source='assigned_worker.name', read_only=True, default=''
    )
    timeline = IssueTimelineSerializer(many=True, read_only=True)
    material_usage = serializers.SerializerMethodField()
    duplicate_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'location', 'category', 'priority',
            'status', 'image', 'created_by', 'created_by_name',
            'assigned_supervisor', 'assigned_supervisor_name',
            'completed_by', 'completed_by_name',
            'assigned_worker', 'assigned_worker_name',
            'llm_category', 'llm_priority', 'llm_duplicate_score',
            'ai_summary', 'duplicate_score', 'override_llm',
            'is_duplicate', 'duplicate_of', 'duplicate_count',
            'sla_response_deadline', 'sla_resolution_deadline',
            'deadline_time', 'is_escalated', 'escalated_at',
            'created_at', 'updated_at', 'resolved_at',
            'resolution_notes', 'resolution_proof', 'timeline', 'material_usage',
        ]
    
    def get_material_usage(self, obj):
        from apps.inventory.serializers import IssueMaterialUsageSerializer
        return IssueMaterialUsageSerializer(obj.material_usage.all(), many=True).data
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'llm_category', 'llm_priority', 'llm_duplicate_score',
            'duplicate_score', 'deadline_time', 'escalated_at',
            'ai_summary', 'is_duplicate', 'duplicate_of', 'duplicate_count',
        ]


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['title', 'description', 'location', 'category', 'image']


class IssueAssignSerializer(serializers.Serializer):
    supervisor_id = serializers.IntegerField()

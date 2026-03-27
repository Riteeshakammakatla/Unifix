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
    timeline = IssueTimelineSerializer(many=True, read_only=True)

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'location', 'category', 'priority',
            'status', 'image', 'created_by', 'created_by_name',
            'assigned_supervisor', 'assigned_supervisor_name',
            'llm_category', 'llm_priority', 'llm_duplicate_score',
            'sla_response_deadline', 'sla_resolution_deadline',
            'created_at', 'updated_at', 'resolved_at',
            'resolution_notes', 'resolution_proof', 'timeline',
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'llm_category', 'llm_priority', 'llm_duplicate_score',
        ]


class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['title', 'description', 'location', 'image']


class IssueAssignSerializer(serializers.Serializer):
    supervisor_id = serializers.IntegerField()

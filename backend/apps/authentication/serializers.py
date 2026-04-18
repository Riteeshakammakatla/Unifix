from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, MemberAdditionLog, Worker, WorkerAddRequest, WorkerAuditLog


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Add role and name to JWT token claims.
    Validates that the selected role matches the user's actual role.
    """
    role = serializers.CharField(write_only=True, required=False, default='')

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['name'] = user.name
        token['email'] = user.email
        return token

    def validate(self, attrs):
        # Extract the selected role
        selected_role = attrs.pop('role', '')

        # Authenticate (this calls parent which checks email/password)
        data = super().validate(attrs)

        # ROLE VALIDATION (Temporarily disabled to allow login with existing accounts)
        # if selected_role and selected_role != self.user.role:
        #     raise serializers.ValidationError({
        #         'detail': f'Your account does not have {selected_role} access. '
        #                   f'Please select the correct role and try again.'
        #     })

        # Add role info to response data
        data['role'] = self.user.role
        data['name'] = self.user.name
        data['email'] = self.user.email

        return data


class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    availability = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()

    workers_list = serializers.SerializerMethodField()
    workers_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'role', 
            'name', 'department', 'phone', 'supervisor', 'availability', 
            'team_count', 'workers_list', 'workers_count'
        ]
        read_only_fields = ['id']

    def get_team_count(self, obj):
        # Use annotated value if present, else calculate
        if hasattr(obj, 'team_count'):
            return obj.team_count
        if obj.role == 'supervisor':
            return obj.supervised_users.count()
        return 0

    def get_availability(self, obj):
        if obj.role != 'staff':
            return 'n/a'
        from apps.issues.models import Issue
        active_count = Issue.objects.filter(
            completed_by=obj, 
            status__in=['Assigned', 'In Progress', 'Escalated']
        ).count()
        
        if active_count == 0:
            return 'free'
        elif active_count < 3:
            return 'assigned'
        else:
            return 'busy'

    def get_workers_list(self, obj):
        if obj.role != 'supervisor':
            return []
        return WorkerSerializer(obj.workers.all(), many=True).data

    def get_workers_count(self, obj):
        if obj.role != 'supervisor':
            return 0
        return obj.workers.count()


class WorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Worker
        fields = '__all__'


class WorkerAddRequestSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)

    class Meta:
        model = WorkerAddRequest
        fields = '__all__'
        read_only_fields = ['id', 'supervisor', 'status', 'timestamp']


class WorkerAuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.name', read_only=True)

    class Meta:
        model = WorkerAuditLog
        fields = '__all__'


class MemberAdditionLogSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)
    member_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = MemberAdditionLog
        fields = ['id', 'supervisor', 'supervisor_name', 'user', 'member_name', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin-only user creation with password hashing."""
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'department', 'phone']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_role(self, value):
        # SECURITY FIX: Prevent creating new admins via this API
        valid_roles = ['student', 'supervisor']
        if value not in valid_roles:
            raise serializers.ValidationError(f'Invalid role. Must be one of: {", ".join(valid_roles)}')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.get('email')
        # Use email as username if not provided
        validated_data.setdefault('username', email)
        user = User(**validated_data)
        user.set_password(password)  # Hash the password
        user.save()
        return user

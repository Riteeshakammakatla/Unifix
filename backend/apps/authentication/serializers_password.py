from rest_framework import serializers

class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=6)

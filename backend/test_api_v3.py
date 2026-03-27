
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.serializers import CustomTokenObtainPairSerializer
from apps.authentication.models import User

print("--- Serializer Inspection ---")
serializer = CustomTokenObtainPairSerializer()
print(f"Serializer fields: {list(serializer.fields.keys())}")
print(f"User USERNAME_FIELD: {User.USERNAME_FIELD}")

from django.test import Client
client = Client()

def test_login_api(payload, label):
    print(f"\n--- {label} ---")
    print(f"Payload: {payload}")
    response = client.post('/api/auth/login/', data=json.dumps(payload), content_type='application/json')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.content.decode()}")

# Test 1: Using 'email'
test_login_api({"email": "admin@campus.edu", "password": "admin123"}, "Test with EMAIL key")

# Test 2: Using 'username'
test_login_api({"username": "admin@campus.edu", "password": "admin123"}, "Test with USERNAME key")

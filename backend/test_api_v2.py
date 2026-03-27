
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from apps.authentication.models import User

client = Client()

def test_login_api(payload, label):
    print(f"--- {label} ---")
    print(f"Payload: {payload}")
    response = client.post('/api/auth/login/', data=json.dumps(payload), content_type='application/json')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print("-" * 20)

# Verify user exists
try:
    user = User.objects.get(email='admin@campus.edu')
    print(f"Verified: User {user.email} exists. Role: {user.role}")
except User.DoesNotExist:
    print("CRITICAL: User admin@campus.edu does NOT exist!")

# Test 1: Using 'email'
test_login_api({"email": "admin@campus.edu", "password": "admin123"}, "Test with EMAIL key")

# Test 2: Using 'username'
test_login_api({"username": "admin@campus.edu", "password": "admin123"}, "Test with USERNAME key")

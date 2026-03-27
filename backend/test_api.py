
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

def test_login_api(payload):
    print(f"Testing API with payload: {payload}")
    response = client.post('/api/auth/login/', data=json.dumps(payload), content_type='application/json')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print("-" * 20)

# Test 1: Using 'email' (what frontend sends)
test_login_api({"email": "admin@campus.edu", "password": "admin123"})

# Test 2: Using 'username' (what SimpleJWT might expect)
test_login_api({"username": "admin@campus.edu", "password": "admin123"})

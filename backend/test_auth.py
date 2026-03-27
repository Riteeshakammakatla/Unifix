
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from apps.authentication.models import User

def test_auth(email, password):
    print(f"Testing auth for {email} / {password}...")
    user = authenticate(email=email, password=password)
    if user:
        print(f"SUCCESS: Authenticated as {user.username} (Role: {user.role})")
    else:
        print("FAILED: Authentication failed")
        # Check if user exists
        try:
            u = User.objects.get(email=email)
            print(f"User exists with email {email}")
            print(f"Hashed password in DB: {u.password[:20]}...")
        except User.DoesNotExist:
            print(f"User does NOT exist with email {email}")

test_auth('admin@campus.edu', 'admin123')
test_auth('student@campus.edu', 'student123')
test_auth('supervisor@campus.edu', 'supervisor123')

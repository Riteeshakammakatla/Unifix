import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User
from django.contrib.auth.hashers import identify_hasher

print("--- User Audit ---")
for user in User.objects.all():
    hasher = "None"
    try:
        hasher = identify_hasher(user.password).algorithm
    except:
        hasher = "Plain/Unknown"
    
    print(f"Email: {user.email}")
    print(f"  Role: {user.role}")
    print(f"  Active: {user.is_active}")
    print(f"  Hasher: {hasher}")
    print(f"  Pwd Preview: {user.password[:15]}...")
    print("-" * 20)

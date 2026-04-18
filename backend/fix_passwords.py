import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.authentication.models import User

user_passwords = {
    'admin@unifix.edu': 'admin123',
    'student@campus.edu': 'student123',
    'student2@campus.edu': 'student123',
    'supervisor@campus.edu': 'supervisor123',
    'greeshma@unifix.edu': 'student123',
    'riya@gmail.com': 'supervisor123',
}

for email, password in user_passwords.items():
    user = User.objects.filter(email=email).first()
    if user:
        user.set_password(password)
        user.save()
        print(f"Password reset for {email}")
    else:
        print(f"User not found: {email}")

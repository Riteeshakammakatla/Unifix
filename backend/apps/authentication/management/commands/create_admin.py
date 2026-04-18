"""
Management command to bootstrap the admin account.
Usage: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from apps.authentication.models import User


class Command(BaseCommand):
    help = 'Create the initial admin account if it does not exist'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='adminunifix@gmail.com', help='Admin email')
        parser.add_argument('--password', type=str, default='admin123', help='Admin password')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(password)
            user.is_superuser = True
            user.is_staff = True
            user.role = 'admin'
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Admin account "{email}" updated with new password.'))
            return

        User.objects.create_superuser(
            email=email,
            username=email,
            first_name='Admin',
            last_name='User',
            password=password,
            role='admin',
        )

        self.stdout.write(self.style.SUCCESS(f'Admin account created: {email}'))

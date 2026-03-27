from django.core.management.base import BaseCommand
from apps.authentication.models import User
from django.contrib.auth.hashers import is_password_usable, make_password
import re

class Command(BaseCommand):
    help = 'Identifies and hashes plain-text passwords for legacy users.'

    def handle(self, *args, **options):
        users = User.objects.all()
        updated_count = 0
        
        # Standard Django password hashes start with one of these
        # algorithms followed by $
        hash_pattern = re.compile(r'^(pbkdf2_sha256|argon2|bcrypt)\$')

        for user in users:
            # If password is empty or already looks like a hash, skip it
            if not user.password or hash_pattern.match(user.password):
                continue
            
            # If we reach here, the password is likely plain text
            self.stdout.write(self.style.WARNING(f'Hashing plain-text password for: {user.email}'))
            user.set_password(user.password)
            user.save()
            updated_count += 1

        if updated_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Successfully hashed {updated_count} legacy passwords.'))
        else:
            self.stdout.write(self.style.SUCCESS('No legacy plain-text passwords found.'))

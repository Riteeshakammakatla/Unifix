import random
import string
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password, check_password
from datetime import timedelta
from django.conf import settings
from .models import AdminOTP

class OTPService:
    @staticmethod
    def generate_otp():
        """Generate a 6-digit random number as a string."""
        return ''.join(random.choices(string.digits, k=6))

    @staticmethod
    def create_and_send_otp(user):
        """
        Creates a new OTP for the admin user, hashes it,
        stores it in DB, and sends it via email.
        """
        otp = OTPService.generate_otp()
        otp_hash = make_password(otp)
        
        # Expire in 5 minutes
        expires_at = timezone.now() + timedelta(minutes=5)
        
        # Invalidate any previous unused OTPs for this user
        AdminOTP.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Store new OTP
        AdminOTP.objects.create(
            user=user,
            otp_hash=otp_hash,
            expires_at=expires_at
        )
        
        # Send Email
        subject = f"UniFix Admin Login OTP: {otp}"
        message = (
            f"Hello {user.name},\n\n"
            f"Your one-time password for UniFix Admin login is: {otp}\n\n"
            f"This code will expire in 5 minutes.\n\n"
            f"If you did not request this code, please ignore this email and contact security."
        )
        
        try:
            # Fallback for development: show OTP in console
            if settings.DEBUG:
                print(f"\n[OTP DEBUG] Sent to {user.email}: {otp}\n")

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"CRITICAL: Failed to send OTP email: {e}")
            # If in debug mode, allow login using the console-logged OTP
            return settings.DEBUG

    @staticmethod
    def verify_otp(user, otp_code):
        """
        Verifies the provided OTP against the latest active OTP for the user.
        Returns (is_valid, error_message).
        """
        # Check if account is locked
        if user.locked_until and user.locked_until > timezone.now():
            diff = user.locked_until - timezone.now()
            minutes = int(diff.total_seconds() // 60) + 1
            return False, f"Account locked. Try again in {minutes} minutes."

        now = timezone.now()
        active_otp = AdminOTP.objects.filter(
            user=user,
            is_used=False,
            expires_at__gt=now
        ).first()
        
        if not active_otp:
            return False, "OTP has expired or is invalid."
            
        if check_password(otp_code, active_otp.otp_hash):
            active_otp.is_used = True
            active_otp.save()
            
            # Reset failure count on success
            user.otp_fail_count = 0
            user.locked_until = None
            user.save()
            return True, None
        else:
            # Increment failure count
            user.otp_fail_count += 1
            if user.otp_fail_count >= 5:
                user.locked_until = now + timedelta(minutes=15)
                user.save()
                return False, "Maximum attempts reached. Account locked for 15 minutes."
            
            user.save()
            remaining = 5 - user.otp_fail_count
            return False, f"Invalid OTP. {remaining} attempts remaining."

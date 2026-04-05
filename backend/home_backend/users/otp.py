import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import CustomUser, OtpChallenge

OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5


def _digest(email: str, code: str) -> str:
    msg = f"{email.strip().lower()}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def issue_otp(*, email: str, purpose: str) -> bool:
    """
    Create a new OTP for the email/purpose. Returns False if no account exists
    for purposes that require an existing user.
    """
    email_norm = email.strip().lower()
    if purpose == OtpChallenge.Purpose.PASSWORD_RESET:
        if not CustomUser.objects.filter(email__iexact=email_norm).exists():
            return False
    elif purpose == OtpChallenge.Purpose.VERIFY_EMAIL:
        if not CustomUser.objects.filter(email__iexact=email_norm).exists():
            return False

    OtpChallenge.objects.filter(
        email__iexact=email_norm,
        purpose=purpose,
        consumed_at__isnull=True,
    ).delete()

    code = _generate_code()
    now = timezone.now()
    OtpChallenge.objects.create(
        email=email_norm,
        purpose=purpose,
        code_hash=_digest(email_norm, code),
        expires_at=now + timedelta(minutes=OTP_TTL_MINUTES),
    )

    subject = "Your verification code"
    body = (
        f"Your code is {code}. It expires in {OTP_TTL_MINUTES} minutes.\n"
        f"If you did not request this, you can ignore this message."
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [email_norm], fail_silently=True)
    return True


def verify_otp(*, email: str, code: str, purpose: str):
    """
    Validate OTP. On success, marks challenge consumed and returns (True, user or None).
    """
    email_norm = email.strip().lower()
    challenge = (
        OtpChallenge.objects.filter(
            email__iexact=email_norm,
            purpose=purpose,
            consumed_at__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )
    if not challenge:
        return False, None
    if challenge.expires_at < timezone.now():
        return False, None
    if challenge.attempt_count >= OTP_MAX_ATTEMPTS:
        return False, None

    if challenge.code_hash != _digest(email_norm, code.strip()):
        challenge.attempt_count += 1
        challenge.save(update_fields=["attempt_count"])
        return False, None

    challenge.consumed_at = timezone.now()
    challenge.save(update_fields=["consumed_at"])

    user = CustomUser.objects.filter(email__iexact=email_norm).first()
    return True, user

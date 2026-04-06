import hashlib
import hmac
import logging
import secrets
from datetime import timedelta
from typing import Literal

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import CustomUser, OtpChallenge

logger = logging.getLogger(__name__)

OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
OTP_MAX_ATTEMPTS = 5

IssueOtpResult = Literal["sent", "no_user", "send_failed"]


def _digest(email: str, code: str) -> str:
    msg = f"{email.strip().lower()}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def issue_otp(*, email: str, purpose: str) -> IssueOtpResult:
    """
    Create a new OTP for the email/purpose.
    Returns no_user if the purpose requires an account and none exists.
    Returns send_failed if the message could not be delivered (SMTP error, etc.).
    """
    email_norm = email.strip().lower()
    if purpose == OtpChallenge.Purpose.PASSWORD_RESET:
        if not CustomUser.objects.filter(email__iexact=email_norm).exists():
            return "no_user"
    elif purpose == OtpChallenge.Purpose.VERIFY_EMAIL:
        if not CustomUser.objects.filter(email__iexact=email_norm).exists():
            return "no_user"

    OtpChallenge.objects.filter(
        email__iexact=email_norm,
        purpose=purpose,
        consumed_at__isnull=True,
    ).delete()

    code = _generate_code()
    now = timezone.now()
    challenge = OtpChallenge.objects.create(
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
    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [email_norm],
            fail_silently=False,
        )
    except Exception:
        challenge.delete()
        logger.exception("Failed to send OTP email to %s", email_norm)
        return "send_failed"
    return "sent"


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
    if user is not None and purpose == OtpChallenge.Purpose.VERIFY_EMAIL:
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=["email_verified"])
    return True, user

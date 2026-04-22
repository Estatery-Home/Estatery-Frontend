from django.db import models
from django.contrib.auth.models import AbstractUser
## This is for internationalization (i18n) - making your app multilingual
from django.utils.translation import gettext_lazy as _


#user model
class CustomUser(AbstractUser):
    # Add extra fields to Django's default User model
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True, default="Ghana")
    email = models.EmailField(_('email address'), unique=True, error_messages={
        'unique': _("A user with that email already exists."),
    })
    
    USER_TYPE_CHOICES = (
        ('customer', _('Customer')),
        ('owner', _('Property Owner')),
        ('admin', _('Admin')),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='customer')
    email_verified = models.BooleanField(default=False)

    # Public contact links for property owners — shown on listings (same for all properties they own)
    instagram_url = models.CharField(blank=True, default="", max_length=500)
    facebook_url = models.CharField(blank=True, default="", max_length=500)
    twitter_url = models.CharField(blank=True, default="", max_length=500)
    youtube_url = models.CharField(blank=True, default="", max_length=500)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class OtpChallenge(models.Model):
    class Purpose(models.TextChoices):
        PASSWORD_RESET = "password_reset", "Password reset"
        VERIFY_EMAIL = "verify_email", "Verify email"

    email = models.EmailField(db_index=True)
    purpose = models.CharField(max_length=32, choices=Purpose.choices)
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=["email", "purpose", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.purpose})"


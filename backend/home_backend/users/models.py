from django.db import models
from django.contrib.auth.models import AbstractUser
## This is for internationalization (i18n) - making your app multilingual
from django.utils.translation import gettext_lazy as _


#user model
class CustomUser(AbstractUser):
    # Add extra fields to Django's default User model
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(_('email address'), unique=True, error_messages={
        'unique': _("A user with that email already exists."),
    })
    
    USER_TYPE_CHOICES = (
        ('customer', _('Customer')),
        ('owner', _('Property Owner')),
        ('admin', _('Admin')),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='customer')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


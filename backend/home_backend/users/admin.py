from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, OtpChallenge


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('user_type', 'phone', 'country', 'email_verified')
    list_filter = UserAdmin.list_filter + ('user_type', 'country', 'email_verified')
    search_fields = UserAdmin.search_fields + ('phone', 'country')
    fieldsets = UserAdmin.fieldsets + (
        (
            _('Estatery profile'),
            {'fields': ('phone', 'country', 'avatar', 'user_type', 'email_verified', 'instagram_url', 'facebook_url', 'twitter_url', 'youtube_url')},
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (_('Estatery profile'), {'fields': ('email', 'phone', 'country', 'user_type')}),
    )


@admin.register(OtpChallenge)
class OtpChallengeAdmin(admin.ModelAdmin):
    list_display = (
        'email',
        'purpose',
        'created_at',
        'expires_at',
        'consumed_at',
        'attempt_count',
    )
    list_filter = ('purpose',)
    search_fields = ('email',)
    readonly_fields = (
        'email',
        'purpose',
        'code_hash',
        'created_at',
        'expires_at',
        'consumed_at',
        'attempt_count',
    )
    ordering = ('-created_at',)

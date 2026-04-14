from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, OtpChallenge


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('user_type', 'phone')
    list_filter = UserAdmin.list_filter + ('user_type',)
    fieldsets = UserAdmin.fieldsets + (
        (
            _('Estatery profile'),
            {'fields': ('phone', 'avatar', 'user_type', 'instagram_url', 'facebook_url', 'twitter_url', 'youtube_url')},
        ),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (_('Estatery profile'), {'fields': ('email', 'phone', 'user_type')}),
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

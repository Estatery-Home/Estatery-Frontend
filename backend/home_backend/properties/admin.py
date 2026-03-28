from django.contrib import admin

from .models import PromoCode


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'times_redeemed', 'valid_until')
    list_filter = ('is_active', 'discount_type')
    search_fields = ('code', 'description')

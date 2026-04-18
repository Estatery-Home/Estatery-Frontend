from django.contrib import admin

from .models import (
    Property,
    PropertyImage,
    Booking,
    BookingPayment,
    PropertyReview,
    PromoCode,
)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0


class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'city', 'country', 'status', 'listing_type', 'created_at')
    list_filter = ('status', 'property_type', 'listing_type', 'currency')
    search_fields = ('title', 'address', 'city', 'country', 'owner__username', 'owner__email')
    raw_id_fields = ('owner',)
    inlines = (PropertyImageInline,)


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'is_primary', 'uploaded_at')
    list_filter = ('is_primary',)
    search_fields = ('property__title',)
    raw_id_fields = ('property',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'rented_property',
        'user',
        'check_in',
        'check_out',
        'status',
        'total_price',
        'created_at',
    )
    list_filter = ('status', 'booking_type')
    search_fields = (
        'user__username',
        'user__email',
        'rented_property__title',
    )
    raw_id_fields = ('rented_property', 'user', 'promo')
    date_hierarchy = 'check_in'
    inlines = (BookingPaymentInline,)


@admin.register(BookingPayment)
class BookingPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'booking',
        'payment_type',
        'month_number',
        'amount',
        'due_date',
        'status',
        'payment_method',
        'transaction_id',
    )
    list_filter = ('status', 'payment_type', 'payment_method')
    raw_id_fields = ('booking',)
    date_hierarchy = 'due_date'


@admin.register(PropertyReview)
class PropertyReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'property', 'user', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('comment', 'user__username', 'property__title')
    raw_id_fields = ('booking', 'property', 'user')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'times_redeemed', 'valid_until')
    list_filter = ('is_active', 'discount_type')
    search_fields = ('code', 'description')

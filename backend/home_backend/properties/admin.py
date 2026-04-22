from django.contrib import admin

from .models import (
    Property,
    PropertyImage,
    PropertyWishlist,
    Booking,
    BookingPayment,
    PropertyReview,
    PromoCode,
    ScheduleEvent,
)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    fields = ("image", "is_primary", "uploaded_at")
    readonly_fields = ("uploaded_at",)


class BookingPaymentInline(admin.TabularInline):
    model = BookingPayment
    extra = 0
    fields = (
        "payment_type",
        "month_number",
        "amount",
        "due_date",
        "status",
        "payment_method",
        "transaction_id",
    )


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'owner',
        'city',
        'country',
        'status',
        'listing_type',
        'monthly_price',
        'created_at',
    )
    list_filter = ('status', 'property_type', 'listing_type', 'currency', 'country', 'city')
    search_fields = ('title', 'address', 'city', 'country', 'owner__username', 'owner__email')
    raw_id_fields = ('owner',)
    inlines = (PropertyImageInline,)
    date_hierarchy = "created_at"


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
    list_filter = ('status', 'booking_type', 'tenant_payment_channel')
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
    list_display = ('id', 'property', 'user', 'rating', 'host_responded_at', 'created_at')
    list_filter = ('rating', 'created_at', 'host_responded_at')
    search_fields = ('comment', 'user__username', 'property__title')
    raw_id_fields = ('booking', 'property', 'user')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'is_active', 'times_redeemed', 'valid_until')
    list_filter = ('is_active', 'discount_type')
    search_fields = ('code', 'description')


@admin.register(PropertyWishlist)
class PropertyWishlistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "property", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "property__title")
    raw_id_fields = ("user", "property")
    date_hierarchy = "created_at"


@admin.register(ScheduleEvent)
class ScheduleEventAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "created_by", "starts_at", "ends_at", "updated_at")
    list_filter = ("starts_at", "ends_at")
    search_fields = ("title", "description", "created_by__username", "created_by__email")
    raw_id_fields = ("created_by",)
    filter_horizontal = ("participants",)
    date_hierarchy = "starts_at"

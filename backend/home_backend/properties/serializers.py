from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Avg, F
from .models import Property, PropertyImage, Booking, BookingPayment, PropertyReview, PromoCode
from users.serializers import UserSerializer
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from .promo import (
    active_promos_for_property,
    combined_discount_percent,
    final_total_with_promo,
    get_promo_by_code,
    validate_promo_for_booking,
)

# ============ PROPERTY IMAGE SERIALIZER ============
class PropertyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ('id', 'image', 'image_url', 'is_primary', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    
    def validate(self, attrs):
        # Ensure only one primary image per property
        if attrs.get('is_primary'):
            property_id = self.context.get('property_id')
            if property_id:
                existing_primary = PropertyImage.objects.filter(
                    property_id=property_id,
                    is_primary=True
                ).exists()
                if existing_primary:
                    raise serializers.ValidationError(
                        "This property already has a primary image. Please unset that one first."
                    )
        return attrs


# ============ PROPERTY SERIALIZER ============
class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    monthly_price_display = serializers.SerializerMethodField()
    security_deposit_display = serializers.SerializerMethodField()
    amenities = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = (
            'id', 'title', 'address', 'city', 'state', 'country', 'zip_code',
            'description', 'daily_price', 'monthly_price', 'currency', 
            'bedrooms', 'bathrooms', 'area',  
            'property_type', 'listing_type', 'status',  
            'has_wifi', 'has_parking', 'has_pool', 'has_gym', 'is_furnished', 'has_kitchen',
            'min_stay_months', 'max_stay_months', 'monthly_cycle_start', 'security_deposit_months',
            'latitude', 'longitude',
            'images', 'owner', 'primary_image', 
            'monthly_price_display', 'security_deposit_display',
            'amenities', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('owner', 'created_at', 'updated_at')
    
    def get_primary_image(self, obj):
        primary = obj.primary_image
        if primary:
            return PropertyImageSerializer(primary).data
        return None
    
    def get_monthly_price_display(self, obj):
        return f"GHS{obj.effective_monthly_price:,.2f}/month"
    
    def get_security_deposit_display(self, obj):
        deposit = obj.security_deposit_amount
        return {
            'amount': deposit,
            'months': obj.security_deposit_months,
            'display': f"GHS{deposit:,.2f} ({obj.security_deposit_months} months rent)"
        }
    
    def get_amenities(self, obj):
        """Collect all amenities into a list"""
        amenities = []
        if obj.has_wifi:
            amenities.append("WiFi")
        if obj.has_parking:
            amenities.append("Parking")
        if obj.has_pool:
            amenities.append("Pool")
        if obj.has_gym:
            amenities.append("Gym")
        if obj.is_furnished:
            amenities.append("Furnished")
        if obj.has_kitchen:
            amenities.append("Kitchen")
        return amenities
    
    def create(self, validated_data):
        # Set owner to logged in user
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, attrs):
        # Validate monthly_cycle_start is between 1-28
        if attrs.get('monthly_cycle_start'):
            if attrs['monthly_cycle_start'] < 1 or attrs['monthly_cycle_start'] > 28:
                raise serializers.ValidationError({
                    'monthly_cycle_start': 'Monthly cycle start must be between 1 and 28'
                })
        
        # Validate min_stay_months is at least 1
        if attrs.get('min_stay_months', 12) < 1:
            raise serializers.ValidationError({
                'min_stay_months': 'Minimum stay must be at least 1 month'
            })
        
        # Validate max_stay_months > min_stay_months if provided
        if attrs.get('max_stay_months') and attrs.get('min_stay_months'):
            if attrs['max_stay_months'] < attrs['min_stay_months']:
                raise serializers.ValidationError({
                    'max_stay_months': 'Maximum stay must be greater than minimum stay'
                })
        
        return attrs


# ============ PROPERTY DETAIL SERIALIZER (with bookings) ============
class PropertyDetailSerializer(PropertySerializer):
    """Extended property serializer with bookings and reviews"""
    bookings = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    active_discounts = serializers.SerializerMethodField()
    
    class Meta(PropertySerializer.Meta):
        fields = PropertySerializer.Meta.fields + (
            'bookings', 'reviews', 'average_rating', 'review_count', 'active_discounts',
        )
    
    def get_bookings(self, obj):
        # Only show future bookings for availability
        future_bookings = obj.bookings.filter(
            status__in=['confirmed', 'active'],
            check_out__gte=timezone.now().date()
        ).order_by('check_in')[:10]  # Limit to next 10 bookings
        
        return BookingCalendarSerializer(future_bookings, many=True).data
    
    def get_reviews(self, obj):
        reviews = obj.reviews.all().order_by('-created_at')[:5]
        return PropertyReviewSerializer(reviews, many=True).data
    
    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_active_discounts(self, obj):
        qs = active_promos_for_property(obj)
        return PromoCodePublicSerializer(qs, many=True).data


# ============ PROMO CODE (admin + validate) ============
class PromoCodePublicSerializer(serializers.ModelSerializer):
    """Public promo listing for a property (no redemption stats)."""

    class Meta:
        model = PromoCode
        fields = (
            'id',
            'code',
            'description',
            'discount_type',
            'discount_value',
            'valid_from',
            'valid_until',
            'min_booking_months',
            'applies_to_property',
        )
        read_only_fields = fields


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = (
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'valid_from', 'valid_until', 'max_redemptions', 'times_redeemed',
            'is_active', 'min_booking_months', 'applies_to_property',
            'created_at', 'updated_at',
        )
        read_only_fields = ('times_redeemed', 'created_at', 'updated_at')

    def validate_code(self, value):
        return value.strip().upper()

    def validate(self, attrs):
        if attrs.get('discount_type', getattr(self.instance, 'discount_type', None)) == 'percent':
            v = attrs.get('discount_value', getattr(self.instance, 'discount_value', None))
            if v is not None and (v < 0 or v > 100):
                raise serializers.ValidationError({
                    'discount_value': 'Percentage must be between 0 and 100.'
                })
        return attrs


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    property_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()

    def validate(self, attrs):
        prop = Property.objects.filter(pk=attrs['property_id']).first()
        if not prop:
            raise serializers.ValidationError({'property_id': 'Property not found.'})
        if attrs['check_out'] <= attrs['check_in']:
            raise serializers.ValidationError({'check_out': 'Must be after check-in.'})
        months = prop.calculate_total_months(attrs['check_in'], attrs['check_out'])
        promo = get_promo_by_code(attrs['code'])
        validate_promo_for_booking(promo, prop, months, attrs['check_in'], field='code')
        attrs['_property'] = prop
        attrs['_promo'] = promo
        attrs['_months'] = months
        return attrs


# ============ BOOKING SERIALIZER ============
class BookingSerializer(serializers.ModelSerializer):
    # Read-only fields for display
    property_title = serializers.CharField(source='rented_property.title', read_only=True)
    property_address = serializers.CharField(source='rented_property.address', read_only=True)
    property_image = serializers.SerializerMethodField()
    review_id = serializers.SerializerMethodField(read_only=True)
    can_review = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    promo_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    applied_promo_code = serializers.CharField(source='promo.code', read_only=True, allow_null=True)

    # API field `property` maps to model FK `rented_property`
    property = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.filter(status='available'),
        source='rented_property',
    )

    class Meta:
        model = Booking
        fields = (
            'id',
            'property',
            'user',
            'check_in',
            'check_out',
            'guests',
            'booking_type',
            'promo_code',
            'applied_promo_code',
            'status',
            'rejection_reason',
            'confirmed_at',
            'cancelled_at',
            'completed_at',
            'agreed_monthly_rate',
            'months_booked',
            'total_price',
            'security_deposit',
            'discount_applied',
            'emergency_contact',
            'occupation',
            'special_requests',
            'created_at',
            'updated_at',
            'deposit_paid',
            'deposit_paid_at',
            'deposit_refunded',
            'deposit_refunded_at',
            'property_title',
            'property_address',
            'property_image',
            'review_id',
            'can_review',
            'user_name',
            'user_email',
        )
        read_only_fields = (
            'user',
            'booking_type',
            'total_price',
            'agreed_monthly_rate',
            'months_booked',
            'security_deposit',
            'discount_applied',
            'status',
            'rejection_reason',
            'confirmed_at',
            'cancelled_at',
            'completed_at',
            'created_at',
            'updated_at',
            'deposit_paid',
            'deposit_paid_at',
            'deposit_refunded',
            'deposit_refunded_at',
            'property_title',
            'property_address',
            'property_image',
            'review_id',
            'can_review',
            'user_name',
            'user_email',
            'applied_promo_code',
        )

    def get_property_image(self, obj):
        primary = obj.rented_property.primary_image
        if primary:
            if hasattr(primary, 'image') and primary.image:
                return primary.image.url
        return None

    def get_review_id(self, obj):
        try:
            return obj.review.pk
        except ObjectDoesNotExist:
            return None

    def get_can_review(self, obj):
        if obj.status != 'completed':
            return False
        return self.get_review_id(obj) is None

    def validate(self, attrs):
        request = self.context.get('request')
        
        # For CREATE operations
        if request and request.method == 'POST':
            property_obj = attrs.get('rented_property')
            check_in = attrs.get('check_in')
            check_out = attrs.get('check_out')
            user = request.user
            
            # 1. Prevent self-booking
            if property_obj.owner == user:
                raise serializers.ValidationError({
                    "property": "You cannot book your own property."
                })
            
            # 2. Validate dates
            if check_in < timezone.now().date():
                raise serializers.ValidationError({
                    "check_in": "Check-in date cannot be in the past."
                })
            
            if check_out <= check_in:
                raise serializers.ValidationError({
                    "check_out": "Check-out must be after check-in date."
                })
            
            # 3. Validate monthly cycle start
            if check_in.day != property_obj.monthly_cycle_start:
                raise serializers.ValidationError({
                    "check_in": f"Monthly bookings must start on day {property_obj.monthly_cycle_start} of the month."
                })
            
            # 4. Calculate months and validate min/max stay
            total_months = property_obj.calculate_total_months(check_in, check_out)
            
            if total_months < property_obj.min_stay_months:
                raise serializers.ValidationError({
                    "check_out": f"Minimum stay is {property_obj.min_stay_months} months."
                })
            
            if property_obj.max_stay_months and total_months > property_obj.max_stay_months:
                raise serializers.ValidationError({
                    "check_out": f"Maximum stay is {property_obj.max_stay_months} months."
                })
            
            # 5. Check availability
            if not property_obj.check_availability(check_in, check_out):
                raise serializers.ValidationError({
                    "property": "Property is not available for the selected dates."
                })

            promo = None
            raw_promo = (attrs.get('promo_code') or '').strip()
            if raw_promo:
                promo = get_promo_by_code(raw_promo)
                validate_promo_for_booking(promo, property_obj, total_months, check_in)

            self.context['promo_instance'] = promo
            self.context['calculated_months'] = total_months
            self.context['calculated_monthly_rate'] = property_obj.effective_monthly_price
            self.context['calculated_total'], self.context['calculated_discount'] = self._calculate_pricing(
                property_obj, total_months, promo
            )
            self.context['calculated_deposit'] = property_obj.security_deposit_amount
        
        return attrs
    
    def _calculate_pricing(self, property_obj, months, promo=None):
        """Long-stay tiers, then optional promo; returns (final_total, combined_discount_percent)."""
        final_total = final_total_with_promo(property_obj, months, promo)
        combined_pct = combined_discount_percent(property_obj, months, promo)
        return final_total, combined_pct
    
    def create(self, validated_data):
        """Create booking with calculated pricing"""
        request = self.context.get('request')
        validated_data.pop('promo_code', None)
        promo = self.context.get('promo_instance')

        months = self.context.get('calculated_months', 12)
        monthly_rate = self.context.get('calculated_monthly_rate')
        total_price = self.context.get('calculated_total')
        discount = self.context.get('calculated_discount', 0)
        deposit = self.context.get('calculated_deposit', monthly_rate * 2)

        # Match DB DecimalField(scale=2) before model full_clean() runs.
        def _money(v):
            return Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        monthly_rate = _money(monthly_rate)
        total_price = _money(total_price)
        deposit = _money(deposit)

        booking = Booking.objects.create(
            rented_property=validated_data['rented_property'],
            user=request.user,
            check_in=validated_data['check_in'],
            check_out=validated_data['check_out'],
            guests=validated_data.get('guests', 1),
            booking_type='monthly',
            agreed_monthly_rate=monthly_rate,
            months_booked=months,
            total_price=total_price,
            security_deposit=deposit,
            discount_applied=discount,
            promo=promo,
            emergency_contact=validated_data.get('emergency_contact', ''),
            occupation=validated_data.get('occupation', ''),
            special_requests=validated_data.get('special_requests', ''),
            status='pending'
        )
        if promo:
            PromoCode.objects.filter(pk=promo.pk).update(times_redeemed=F('times_redeemed') + 1)

        return booking
    
    def update(self, instance, validated_data):
        """Only allow updating specific fields"""
        allowed_fields = ['emergency_contact', 'occupation', 'special_requests', 'guests']
        
        for field in allowed_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        instance.save()
        return instance


class BookingRescheduleSerializer(serializers.Serializer):
    """PATCH body for host/admin booking reschedule."""

    check_in = serializers.DateField()
    check_out = serializers.DateField()
    guests = serializers.IntegerField(required=False, min_value=1, max_value=50)


# ============ BOOKING CALENDAR SERIALIZER ============
class BookingCalendarSerializer(serializers.ModelSerializer):
    """Minimal booking info for calendar display"""
    
    class Meta:
        model = Booking
        fields = ('id', 'check_in', 'check_out', 'status')
        read_only_fields = fields


# ============ HOST BOOKING SERIALIZER (hosts see more details) ============
class HostBookingSerializer(BookingSerializer):
    """Extended booking serializer for property owners"""

    property = serializers.PrimaryKeyRelatedField(
        source='rented_property',
        read_only=True,
    )
    property_title = serializers.CharField(source='rented_property.title', read_only=True)
    property_address = serializers.CharField(source='rented_property.address', read_only=True)
    property_image = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    tenant_name = serializers.CharField(source='user.get_full_name', read_only=True)
    tenant_email = serializers.EmailField(source='user.email', read_only=True)
    tenant_phone = serializers.CharField(source='user.phone', read_only=True)
    payments = serializers.SerializerMethodField()

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + (
            'tenant_name', 'tenant_email', 'tenant_phone', 'payments',
        )

    def get_property_image(self, obj):
        primary = obj.rented_property.primary_image
        if primary:
            if hasattr(primary, 'image') and primary.image:
                return primary.image.url
        return None

    def get_payments(self, obj):
        payments = obj.payments.all().order_by('due_date')
        return BookingPaymentSerializer(payments, many=True).data


class AdminBookingListSerializer(BookingSerializer):
    """Platform-wide booking row for staff / admin dashboard (no nested payments)."""

    property = serializers.PrimaryKeyRelatedField(source='rented_property', read_only=True)
    host_name = serializers.SerializerMethodField()
    host_email = serializers.EmailField(source='rented_property.owner.email', read_only=True)
    property_city = serializers.CharField(source='rented_property.city', read_only=True)

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ('host_name', 'host_email', 'property_city')

    def get_host_name(self, obj):
        owner = obj.rented_property.owner
        return (owner.get_full_name() or '').strip() or owner.username


# ============ BOOKING PAYMENT SERIALIZER ============
class BookingPaymentSerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = BookingPayment
        fields = '__all__'
        read_only_fields = ('booking', 'created_at', 'updated_at')
    
    def validate(self, attrs):
        # Ensure payment amount is positive
        if attrs.get('amount', 0) <= 0:
            raise serializers.ValidationError({
                'amount': 'Payment amount must be greater than 0'
            })
        
        return attrs


# ============ PROPERTY REVIEW SERIALIZER ============
class PropertyReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = PropertyReview
        fields = (
            'id',
            'rating',
            'comment',
            'user_name',
            'user_avatar',
            'host_response',
            'host_responded_at',
            'created_at',
            'updated_at',
            'user',
            'property',
            'booking',
        )
        read_only_fields = (
            'id',
            'user_name',
            'user_avatar',
            'host_response',
            'host_responded_at',
            'created_at',
            'updated_at',
            'user',
            'property',
            'booking',
        )

    def get_user_avatar(self, obj):
        user = obj.user
        if user.avatar:
            return user.avatar.url
        return None

    def create(self, validated_data):
        request = self.context.get('request')
        booking_id = self.context.get('booking_id')
        if not booking_id:
            raise serializers.ValidationError({"detail": "Booking ID is required"})
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            raise serializers.ValidationError({"detail": "Booking not found"})
        if booking.user != request.user:
            raise serializers.ValidationError({"detail": "You can only review your own bookings"})
        if booking.status != 'completed':
            raise serializers.ValidationError({"detail": "You can only review completed stays"})
        if PropertyReview.objects.filter(booking=booking).exists():
            raise serializers.ValidationError({"detail": "This booking has already been reviewed"})
        validated_data['user'] = request.user
        validated_data['property'] = booking.rented_property
        validated_data['booking'] = booking
        return super().create(validated_data)


# ============ HOST RESPONSE SERIALIZER ============
class HostResponseSerializer(serializers.ModelSerializer):
    """Serializer for host to respond to reviews"""
    
    class Meta:
        model = PropertyReview
        fields = ('host_response',)
    
    def validate_host_response(self, value):
        if not value.strip():
            raise serializers.ValidationError("Response cannot be empty")
        return value
    
    def update(self, instance, validated_data):
        instance.host_response = validated_data.get('host_response', instance.host_response)
        instance.host_responded_at = timezone.now()
        instance.save()
        return instance


# ============ PROPERTY AVAILABILITY SERIALIZER ============
class PropertyAvailabilitySerializer(serializers.Serializer):
    """Serializer for checking property availability"""
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    
    def validate(self, attrs):
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        
        if check_in < timezone.now().date():
            raise serializers.ValidationError({
                "check_in": "Check-in date cannot be in the past"
            })
        
        if check_out <= check_in:
            raise serializers.ValidationError({
                "check_out": "Check-out must be after check-in"
            })
        
        return attrs
    
    def validate_availability(self, property_obj):
        """Custom validation method called from view"""
        if not property_obj.check_availability(
            self.validated_data['check_in'],
            self.validated_data['check_out']
        ):
            raise serializers.ValidationError("Property not available for these dates")
        
        # Calculate pricing for display
        months = property_obj.calculate_total_months(
            self.validated_data['check_in'],
            self.validated_data['check_out']
        )
        total_price, discount = self._calculate_pricing(property_obj, months)
        
        return {
            'available': True,
            'months': months,
            'monthly_rate': property_obj.effective_monthly_price,
            'total_price': total_price,
            'discount': discount,
            'security_deposit': property_obj.security_deposit_amount
        }
    
    def _calculate_pricing(self, property_obj, months):
        """Calculate total price and combined discount % (no promo on availability check)."""
        return (
            final_total_with_promo(property_obj, months, None),
            combined_discount_percent(property_obj, months, None),
        )


# ============ drf-spectacular (OpenAPI) shape hints for APIView responses ============
class CountryRowSerializer(serializers.Serializer):
    name = serializers.CharField()


class LocaleChoiceSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class PromoValidateNestedSerializer(serializers.Serializer):
    discount_type = serializers.CharField()
    discount_value = serializers.CharField()


class PromoValidateResponseSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    code = serializers.CharField()
    months = serializers.IntegerField()
    currency = serializers.CharField()
    monthly_rate = serializers.CharField()
    base_subtotal = serializers.CharField()
    subtotal_after_long_stay = serializers.CharField()
    long_stay_discount_percent = serializers.CharField()
    promo = PromoValidateNestedSerializer()
    total_price = serializers.CharField()
    combined_discount_percent = serializers.CharField()


class HostDashboardSerializer(serializers.Serializer):
    properties = serializers.JSONField()
    bookings = serializers.JSONField()
    revenue = serializers.JSONField()
    recent_bookings = serializers.JSONField()
    recent_payments = serializers.JSONField()
    listings_chart = serializers.JSONField()
    activity_chart = serializers.JSONField()
    comparison = serializers.JSONField()
    currency = serializers.CharField()


class TenantDashboardSerializer(serializers.Serializer):
    bookings = serializers.JSONField()
    upcoming_payments = serializers.JSONField()
    next_booking = serializers.JSONField(allow_null=True)
    recent_bookings = serializers.JSONField()


class CurrencyChoiceSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()
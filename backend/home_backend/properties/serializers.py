from rest_framework import serializers
from .models import Property, PropertyImage, Booking, BookingPayment, PropertyReview
from users.serializers import UserSerializer
from django.utils import timezone
from decimal import Decimal
from datetime import datetime

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
            'property_type', 'status',  
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
    
    class Meta(PropertySerializer.Meta):
        fields = PropertySerializer.Meta.fields + ('bookings', 'reviews', 'average_rating')
    
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
        avg = obj.reviews.aggregate(avg=models.Avg('rating'))['avg']
        return round(avg, 1) if avg else None


# ============ BOOKING SERIALIZER ============
class BookingSerializer(serializers.ModelSerializer):
    # Read-only fields for display
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_address = serializers.CharField(source='property.address', read_only=True)
    property_image = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    # Writeable fields for creation
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.filter(status='available'))
    
    class Meta:
        model = Booking
        fields = ('id', 'property', 'user',
        'check_in', 'check_out', 'guests', 
        'status', 'created_at', 'updated_at',
        'deposit_paid', 'deposit_paid_at',
        'deposit_refunded', 'deposit_refunded_at')
        read_only_fields = (
            'user', 'total_price', 'agreed_monthly_rate', 'months_booked',
            'security_deposit', 'discount_applied', 'status', 'confirmed_at',
            'cancelled_at', 'completed_at', 'created_at', 'updated_at',
            'deposit_paid', 'deposit_paid_at', 'deposit_refunded', 'deposit_refunded_at'
        )
    
    def get_property_image(self, obj):
        primary = obj.property.primary_image  # This returns PropertyImage object
        if primary:
            if hasattr(primary, 'image') and primary.image:
                return primary.image.url
        return None
    
    def validate(self, attrs):
        request = self.context.get('request')
        
        # For CREATE operations
        if request and request.method == 'POST':
            property_obj = attrs.get('property')
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
            
            # Store calculated values for create method
            self.context['calculated_months'] = total_months
            self.context['calculated_monthly_rate'] = property_obj.effective_monthly_price
            self.context['calculated_total'], self.context['calculated_discount'] = self._calculate_pricing(
                property_obj, total_months
            )
            self.context['calculated_deposit'] = property_obj.security_deposit_amount
        
        return attrs
    
    def _calculate_pricing(self, property_obj, months):
        """Calculate total price and discount"""
        monthly_rate = property_obj.effective_monthly_price
        base_total = monthly_rate * months
        discount = 0
        
        # Apply discounts
        if months >= 12:
            discount = Decimal('0.15')  # 15% off
        elif months >= 6:
            discount = Decimal('0.10')  # 10% off
        elif months >= 3:
            discount = Decimal('0.05')  # 5% off
        
        total = base_total * (1 - discount)
        return total, discount * 100  # Return as percentage
    
    def create(self, validated_data):
        """Create booking with calculated pricing"""
        request = self.context.get('request')
        
        # Get calculated values from validation
        months = self.context.get('calculated_months', 12)
        monthly_rate = self.context.get('calculated_monthly_rate')
        total_price = self.context.get('calculated_total')
        discount = self.context.get('calculated_discount', 0)
        deposit = self.context.get('calculated_deposit', monthly_rate * 2)
        
        # Create booking
        booking = Booking.objects.create(
            property=validated_data['property'],
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
            emergency_contact=validated_data.get('emergency_contact', ''),
            occupation=validated_data.get('occupation', ''),
            special_requests=validated_data.get('special_requests', ''),
            status='pending'
        )
        
        return booking
    
    def update(self, instance, validated_data):
        """Only allow updating specific fields"""
        allowed_fields = ['emergency_contact', 'occupation', 'special_requests', 'guests']
        
        for field in allowed_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        instance.save()
        return instance


# ============ BOOKING CALENDAR SERIALIZER ============
class BookingCalendarSerializer(serializers.ModelSerializer):
    """Minimal booking info for calendar display"""
    
    class Meta:
        model = Booking
        fields = ('id', 'check_in', 'check_out', 'status')
        read_only_fields = fields


# ============ HOST BOOKING SERIALIZER (hosts see more details) ============
class HostBookingSerializer(serializers.ModelSerializer):
    """Extended booking serializer for property owners"""
    
    tenant_name = serializers.CharField(source='user.get_full_name', read_only=True)
    tenant_email = serializers.EmailField(source='user.email', read_only=True)
    tenant_phone = serializers.CharField(source='user.phone', read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)
    payments = serializers.SerializerMethodField()
    
    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + (
            'tenant_name', 'tenant_email', 'tenant_phone', 'payments',
            'rejection_reason', 'confirmed_at', 'cancelled_at'
        )
        read_only_fields = BookingSerializer.Meta.read_only_fields
    
    def get_payments(self, obj):
        payments = obj.payments.all().order_by('due_date')
        return BookingPaymentSerializer(payments, many=True).data


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
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    
    class Meta:
        model = PropertyReview
        fields = '__all__'
        read_only_fields = ('user', 'property', 'booking', 'created_at', 'updated_at', 'host_responded_at')
    
    def validate(self, attrs):
        request = self.context.get('request')
        
        # For CREATE operations
        if request and request.method == 'POST':
            booking_id = self.context.get('booking_id')
            
            if not booking_id:
                raise serializers.ValidationError("Booking ID is required")
            
            try:
                booking = Booking.objects.get(id=booking_id)
            except Booking.DoesNotExist:
                raise serializers.ValidationError("Booking not found")
            
            # Check if user is the tenant
            if booking.user != request.user:
                raise serializers.ValidationError("You can only review your own bookings")
            
            # Check if booking is completed
            if booking.status != 'completed':
                raise serializers.ValidationError("You can only review completed stays")
            
            # Check if already reviewed
            if hasattr(booking, 'review'):
                raise serializers.ValidationError("This booking has already been reviewed")
            
            attrs['user'] = request.user
            attrs['property'] = booking.property
            attrs['booking'] = booking
        
        return attrs
    
    def create(self, validated_data):
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
        """Calculate total price and discount"""
        monthly_rate = property_obj.effective_monthly_price
        base_total = monthly_rate * months
        discount = 0
        
        if months >= 12:
            discount = Decimal('0.15')
        elif months >= 6:
            discount = Decimal('0.10')
        elif months >= 3:
            discount = Decimal('0.05')
        
        total = base_total * (1 - discount)
        return total, discount * 100
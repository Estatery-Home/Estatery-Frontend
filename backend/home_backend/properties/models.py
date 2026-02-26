from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from users.models import CustomUser
from decimal import Decimal
import calendar


#=============== PROPERTY MANAGER ============

# This will help with common queries like available, city, price range
class PropertyManager(models.Manager):
    def available(self):
        """Get all available properties"""
        return self.filter(status='available')
    
    def in_city(self, city):
        """Filter by city"""
        return self.filter(city__iexact=city)
    
    def with_monthly_price(self, max_price=None):
        """Properties with monthly pricing"""
        qs = self.filter(monthly_price__isnull=False)
        if max_price:
            qs = qs.filter(monthly_price__lte=max_price)
        return qs





# ============ PROPERTY MODEL ============
class Property(models.Model):
    # Property types
    PROPERTY_TYPES = (
        ('apartment', _("Apartment")),
        ('house', _("House")),
        ('condo', _("Condo")),
        ('villa', _("Villa")),
        ('studio', _("Studio")),
    )
    
    STATUS_CHOICES = (
        ('available', _("Available")),
        ('rented', _("Rented")),
        ('maintenance', _("Under Maintenance")),
    )

    CURRENCY_CHOICES = (
        ('ghs', _("GHS")),
        ('usd', _("USD")),
        ('cfa', _("CFA")),  
    )
    
    # Owner & Basic Info
    owner = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    description = models.TextField(_("Description"))
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    objects = PropertyManager() # This will help with common queries 
    # PRICING
    daily_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name=_("Daily price"),
        help_text=_("Price per night")
    )
    monthly_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        verbose_name=_("Monthly price"),
        help_text=_("Price per month (optional - will auto-calculate from daily if blank)")
    )
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='ghs')
    
    # Location
    address = models.CharField(_("Address"), max_length=255)
    city = models.CharField(_("City"), max_length=100)
    state = models.CharField(_("state"), max_length=100, default="Optional")    
    country = models.CharField(_("Country"), max_length=100)
    zip_code = models.CharField(_("Zip Code"), max_length=20, blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Details
    bedrooms = models.IntegerField(_("Bedrooms"), default=1)
    bathrooms = models.IntegerField(_("Bathrooms"), default=1)
    area = models.IntegerField(_("Area (sq ft)"))
    
    # Amenities
    has_wifi = models.BooleanField(_("WiFi"), default=False)
    has_parking = models.BooleanField(_("Parking"), default=False)
    has_pool = models.BooleanField(_("Pool"), default=False)
    has_gym = models.BooleanField(_("Gym"), default=False)
    is_furnished = models.BooleanField(_("Furnished"), default=False)
    has_kitchen = models.BooleanField(_("Kitchen"), default=True)
    
    # MONTHLY RENTAL SETTINGS
    min_stay_months = models.PositiveIntegerField(
        _("Minimum stay (months)"),
        default=12,
        help_text=_("Minimum booking period in months")
    )
    max_stay_months = models.PositiveIntegerField(
        _("Maximum stay (months)"),
        null=True,
        blank=True,
        help_text=_("Maximum booking period in months (optional)")
    )
    monthly_cycle_start = models.PositiveIntegerField(
        _("Monthly cycle start day"),
        default=1,
        choices=[(i, i) for i in range(1, 29)],
        help_text=_("Day of month when rentals start (1-28)")
    )
    security_deposit_months = models.DecimalField(
        _("Security deposit (months)"),
        max_digits=3,
        decimal_places=1,
        default=2.0,
        help_text=_("Number of months rent required as deposit")
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'city', 'country']),
            models.Index(fields=['owner', 'status']),
        ]
        verbose_name = _("Property")
        verbose_name_plural = _("Properties")
    
    def __str__(self):
        return f"{self.title} - {self.get_monthly_price_display()}"
    
    @property
    def effective_monthly_price(self):
        """Get monthly price with fallback to daily rate"""
        if self.monthly_price:
            return self.monthly_price
        # Average days per month: 365.25/12 ≈ 30.44
        avg_days_per_month = Decimal('30.44')
        return self.daily_price * avg_days_per_month
    
    def get_monthly_price_display(self):
        """Formatted monthly price"""
        return f"GHS{self.effective_monthly_price:,.2f}/month"
    
    @property
    def primary_image(self):
        return self.images.filter(is_primary=True).first()
    
    @property
    def security_deposit_amount(self):
        """Calculate security deposit amount"""
        return self.effective_monthly_price * self.security_deposit_months
    
    def check_availability(self, check_in, check_out, exclude_booking_id=None):
        """Check if property is available for given dates"""
        from bookings.models import Booking   #this would avoid circular import
        
        qs = Booking.objects.filter(
            property=self,
            status__in=['confirmed', 'active'],
            check_out__gt=check_in,
            check_in__lt=check_out
        )
        
        if exclude_booking_id:
            qs = qs.exclude(id=exclude_booking_id)
            
        return not qs.exists()
    
    def calculate_total_months(self, check_in, check_out):
        """Calculate total months between dates"""
        months = (check_out.year - check_in.year) * 12 + (check_out.month - check_in.month)
        
        # Count partial month as full month
        if check_out.day > check_in.day:
            months += 1
            
        return max(months, self.min_stay_months)
    
    def calculate_total_price(self, check_in, check_out):
        """Calculate total price for stay"""
        months = self.calculate_total_months(check_in, check_out)
        monthly_rate = self.effective_monthly_price
        total = monthly_rate * months
        
        # Apply discounts for long stays
        if months >= 12:
            total *= Decimal('0.85')  # 15% off
        elif months >= 6:
            total *= Decimal('0.90')  # 10% off
        elif months >= 3:
            total *= Decimal('0.95')  # 5% off  
        return total, months, monthly_rate
     
    # Review methods
    @property
    def average_rating(self):
        """Calculate average rating from all reviews"""
        from django.db.models import Avg
        avg = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

    @property
    def review_count(self):
        """Total number of reviews"""
        return self.reviews.count()
    


# ============ PROPERTY IMAGE MODEL ============
class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/')
    is_primary = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-is_primary', 'uploaded_at']
    
    def __str__(self):
        return f"Image for {self.property.title}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary image per property
        if self.is_primary:
            PropertyImage.objects.filter(
                property=self.property, 
                is_primary=True
            ).exclude(id=self.id).update(is_primary=False)
        super().save(*args, **kwargs)


# ============ BOOKING MODEL ============
class Booking(models.Model):
    BOOKING_TYPES = (
        ('monthly', 'Monthly'),
        ('weekly', 'Weekly'),
        ('daily', 'Daily'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('active', 'Active'),  
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),  
    )
    
    # Relationships
    property_rented = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='bookings')
    
    # Dates
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.IntegerField(default=1)
    
    # Booking type
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPES, default='monthly')
    
    # Pricing (stored at time of booking)
    agreed_monthly_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name=_("Agreed monthly rate"),
        help_text=_("Monthly rate at time of booking")
    )
    months_booked = models.PositiveIntegerField(
        default=1,
        help_text=_("Number of months booked")
    )
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        help_text=_("Security deposit amount")
    )
    discount_applied = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        default=0,
        help_text=_("Discount percentage applied")
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional info for monthly rentals
    emergency_contact = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    special_requests = models.TextField(blank=True)
    
    # Deposit tracking
    deposit_paid = models.BooleanField(default=False)
    deposit_paid_at = models.DateTimeField(null=True, blank=True)
    deposit_refunded = models.BooleanField(default=False)
    deposit_refunded_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['property_rented', 'check_in', 'check_out', 'status']),
            models.Index(fields=['user', 'status', '-created_at']),
            models.Index(fields=['property_rented', 'status', 'check_in']),
        ]
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(check_out__gt=models.F('check_in')),
                name='check_out_after_check_in'
            )
        ]
    
    def __str__(self):
        return f"Booking #{self.id} - {self.property.title} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        """Check if booking is currently active"""
        today = timezone.now().date()
        return (
            self.status in ['confirmed', 'active'] and
            self.check_in <= today <= self.check_out
        )
    
    @property
    def nights(self):
        """Total nights booked"""
        return (self.check_out - self.check_in).days
    
    @property
    def months_remaining(self):
        """Months remaining for active booking"""
        if self.is_active:
            today = timezone.now().date()
            months = (self.check_out.year - today.year) * 12 + (self.check_out.month - today.month)
            return max(0, months)
        return 0
    
    @property
    def is_fully_paid(self):
        """Check if all payments are made"""
        # This would check against Payment model
        total_paid = self.payments.filter(status='paid').aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        return total_paid >= self.total_price + self.security_deposit
    
    def overlaps_with(self, check_in, check_out):
        """Check if this booking overlaps with given dates"""
        return (
            self.check_out > check_in and
            self.check_in < check_out and
            self.status in ['confirmed', 'active']
        )
    
    def confirm(self):
        """Confirm the booking"""
        from django.utils import timezone
        self.status = 'confirmed'
        self.confirmed_at = timezone.now()
        self.save()
    
    def cancel(self, reason=""):
        """Cancel the booking"""
        from django.utils import timezone
        self.status = 'cancelled'
        self.cancelled_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def activate(self):
        """Activate booking on check-in date"""
        from django.utils import timezone
        if timezone.now().date() >= self.check_in:
            self.status = 'active'
            self.save()
    
    def complete(self):
        """Complete booking on check-out date"""
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()
    
    # Add to Booking model:
    def clean(self):
        """Model validation"""
        from django.core.exceptions import ValidationError
        
        if self.check_in and self.check_out:
            if self.check_out <= self.check_in:
                raise ValidationError({
                    'check_out': 'Check-out must be after check-in'
                })
            
            if self.check_in < timezone.now().date():
                raise ValidationError({
                    'check_in': 'Check-in cannot be in the past'
                })
        
        # Validate months_booked for monthly bookings
        if self.booking_type == 'monthly' and self.months_booked < 12:
            raise ValidationError({
                'months_booked': 'Monthly rentals require minimum 12 months'
            })

    def save(self, *args, **kwargs):
        self.full_clean()  # This calls clean()
        super().save(*args, **kwargs)


    def generate_payment_schedule(self):
        """Create monthly payment schedule for the booking"""
        from django.utils import timezone
        from decimal import Decimal
        
        # Clear existing payments
        self.payments.all().delete()
        
        # 1. Security deposit (month 0)
        BookingPayment.objects.create(
            booking=self,
            payment_type='deposit',
            month_number=0,
            amount=self.security_deposit,
            due_date=timezone.now().date() + timezone.timedelta(days=3),
            status='pending'
        )
        
        # 2. Monthly rent payments
        current_date = self.check_in
        for month in range(1, self.months_booked + 1):
            due_date = current_date.replace(day=1)  # 1st of month
            if month > 1:
                # Add months safely
                if due_date.month == 12:
                    due_date = due_date.replace(year=due_date.year + 1, month=1)
                else:
                    due_date = due_date.replace(month=due_date.month + 1)
            
            BookingPayment.objects.create(
                booking=self,
                payment_type='rent',
                month_number=month,
                amount=self.agreed_monthly_rate,
                due_date=due_date,
                status='pending'
            )


# ============ MONTHLY PAYMENT MODEL ============
class BookingPayment(models.Model):
    """Monthly payment schedule for long-term bookings"""
    
    PAYMENT_TYPES = (
        ('deposit', 'Security Deposit'),
        ('rent', 'Monthly Rent'),
        ('late_fee', 'Late Fee'),
        ('utility', 'Utilities'),
        ('damage', 'Damage Fee'),
        ('refund', 'Refund'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    )
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, default='rent')
    month_number = models.PositiveIntegerField(
        help_text=_("Month number (0 for deposit, 1-12 for rent)")
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['due_date', 'month_number']
        unique_together = ['booking', 'month_number', 'payment_type']
        indexes = [
            models.Index(fields=['booking', 'status', 'due_date']),
            models.Index(fields=['due_date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_payment_type_display()} - Booking #{self.booking.id} - Month {self.month_number}"
    
    @property
    def is_overdue(self):
        """Check if payment is overdue"""
        return (
            self.status == 'pending' and
            timezone.now().date() > self.due_date
        )
    
    def mark_as_paid(self, transaction_id=""):
        """Mark payment as paid"""
        from django.utils import timezone
        self.status = 'paid'
        self.paid_date = timezone.now().date()
        if transaction_id:
            self.transaction_id = transaction_id
        self.save()


# ============ PROPERTY MODEL ============
class PropertyReview(models.Model):
    """Reviews left by tenants after stay"""
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text=_("Rating from 1-5")
    )
    comment = models.TextField()
    
    # Host response
    host_response = models.TextField(blank=True)
    host_responded_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['property', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"Review for {self.property.title} - {self.rating}★"
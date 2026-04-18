from rest_framework import generics, permissions, filters, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal

from .models import Property, PropertyImage, Booking, BookingPayment, PropertyReview, PromoCode
from .serializers import (
    PropertyImageSerializer,
    PropertySerializer, PropertyDetailSerializer, PropertyAvailabilitySerializer,
    BookingSerializer, AdminBookingListSerializer, HostBookingSerializer, BookingPaymentSerializer,
    BookingRescheduleSerializer,
    PropertyReviewSerializer, HostResponseSerializer,
    PromoCodeSerializer, PromoCodePublicSerializer, PromoCodeValidateSerializer,
    CountryRowSerializer, PromoValidateResponseSerializer,
    HostDashboardSerializer, TenantDashboardSerializer,
    LocaleChoiceSerializer,
)
from .locale_data import LANGUAGE_CHOICES, TIMEZONE_CHOICES
from .promo import (
    active_promos_for_property,
    amount_after_long_stay,
    combined_discount_percent,
    final_total_with_promo,
    long_stay_fraction_off,
    validate_promo_for_booking,
)
from .permissions import IsAdminUserType
from users.serializers import UserSerializer
import calendar
from datetime import date, datetime, timedelta
from typing import Optional
from dateutil.relativedelta import relativedelta
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from django.db import transaction, models
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, extend_schema_view
from collections import Counter
import logging

logger = logging.getLogger(__name__)

_HOST_PAYMENT_STATUS_CODES = frozenset(c[0] for c in BookingPayment.STATUS_CHOICES)

# ============ PROPERTY VIEWS ============

class PublicPropertyCatalogMixin:
    """Shared filters for public property listing (marketplace / customer app)."""
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'listing_type', 'bedrooms', 'bathrooms', 'city', 'country', 'status']
    search_fields = ['title', 'description', 'address', 'city']
    ordering_fields = ['daily_price', 'monthly_price', 'created_at', 'area', 'bedrooms']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Property.objects.all()
        status = self.request.query_params.get('status', 'available')
        if status == 'available':
            queryset = queryset.filter(status='available')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(monthly_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(monthly_price__lte=max_price)
        amenities = ['wifi', 'parking', 'pool', 'gym', 'furnished', 'kitchen']
        for amenity in amenities:
            if self.request.query_params.get(f'has_{amenity}'):
                queryset = queryset.filter(**{f'has_{amenity}': True})
        return queryset.prefetch_related("images")


@extend_schema(
    tags=["Properties"],
    summary="Upload a property image",
    description=(
        "Multipart form: field `image` (file). Optional `is_primary` (true/false). "
        "First image for a listing is always stored as primary if none exists yet."
    ),
    request={
        "multipart/form-data": {
            "type": "object",
            "properties": {
                "image": {"type": "string", "format": "binary"},
                "is_primary": {"type": "boolean"},
            },
            "required": ["image"],
        }
    },
    responses={201: PropertyImageSerializer},
)
class PropertyImageUploadView(APIView):
    """POST multipart image for a property (owner only)."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        if prop.owner_id != request.user.id:
            raise PermissionDenied("You can only add images to your own properties.")
        file_obj = request.FILES.get("image")
        if not file_obj:
            return Response(
                {"detail": 'Missing file field "image".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        raw_primary = request.data.get("is_primary", False)
        if isinstance(raw_primary, bool):
            is_primary = raw_primary
        else:
            is_primary = str(raw_primary).lower() in ("1", "true", "yes", "on")
        if not prop.images.exists():
            is_primary = True
        row = PropertyImage.objects.create(
            property=prop,
            image=file_obj,
            is_primary=is_primary,
        )
        ser = PropertyImageSerializer(row, context={"request": request})
        return Response(ser.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Customer catalog'], summary='List properties (customer)')
class CustomerPropertyListView(PublicPropertyCatalogMixin, generics.ListAPIView):
    """Customer-facing catalog: GET only (same data as public list, explicit route for the website app)."""
    permission_classes = [permissions.AllowAny]


@extend_schema(
    tags=['Geography'],
    summary='List countries',
    responses={200: CountryRowSerializer(many=True)},
)
class CountryListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        names = (
            Property.objects.filter(status='available')
            .values_list('country', flat=True)
            .distinct()
            .order_by('country')
        )
        return Response([{'name': n} for n in names if n])


@extend_schema(
    tags=['Discounts'],
    summary='Validate promo code',
    request=PromoCodeValidateSerializer,
    responses={200: PromoValidateResponseSerializer},
)
@extend_schema(
    tags=['Discounts'],
    summary='List active discounts for a property',
    description=(
        'Public promos that apply to this listing (or all listings): active, in date range, '
        'and not exhausted. Same data is embedded as `active_discounts` on GET /properties/<id>/.'
    ),
    responses={200: PromoCodePublicSerializer(many=True)},
)
class PropertyActiveDiscountsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        qs = active_promos_for_property(prop)
        return Response(PromoCodePublicSerializer(qs, many=True).data)


class PromoCodeValidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = PromoCodeValidateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        prop = ser.validated_data['_property']
        promo = ser.validated_data['_promo']
        months = ser.validated_data['_months']
        base_total = prop.effective_monthly_price * months
        after_long = amount_after_long_stay(prop, months)
        final_total = final_total_with_promo(prop, months, promo)
        return Response({
            'valid': True,
            'code': promo.code,
            'months': months,
            'currency': prop.currency,
            'monthly_rate': str(prop.effective_monthly_price),
            'base_subtotal': str(base_total),
            'subtotal_after_long_stay': str(after_long),
            'long_stay_discount_percent': str(long_stay_fraction_off(months) * Decimal('100')),
            'promo': {
                'discount_type': promo.discount_type,
                'discount_value': str(promo.discount_value),
            },
            'total_price': str(final_total),
            'combined_discount_percent': str(combined_discount_percent(prop, months, promo)),
        })


@extend_schema(tags=['Discounts'])
class AdminPromoCodeListCreateView(generics.ListCreateAPIView):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAdminUserType]


@extend_schema(tags=['Discounts'])
class AdminPromoCodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAdminUserType]


class AdminBookingPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@extend_schema(
    tags=["Bookings"],
    summary="List all bookings (admin)",
    description=(
        "Staff or `user_type=admin` only. All tenant bookings across properties with "
        "tenant, property, and host fields. Filter by `status`, search by guest email/name or property title."
    ),
)
class AdminAllBookingsListView(generics.ListAPIView):
    serializer_class = AdminBookingListSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserType]
    pagination_class = AdminBookingPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status"]
    search_fields = [
        "user__username",
        "user__email",
        "rented_property__title",
        "rented_property__city",
    ]
    ordering_fields = ["created_at", "check_in", "check_out", "total_price", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Booking.objects.none()
        return (
            Booking.objects.all()
            .select_related("user", "rented_property", "rented_property__owner", "promo")
            .order_by("-created_at")
        )


@extend_schema(
    tags=["Bookings"],
    summary="Confirm or reject a pending booking (admin)",
    description=(
        "Staff or `user_type=admin` only. PATCH/PUT body: `action` = `confirm` or `reject`; "
        "optional `reason` when rejecting (stored on the booking)."
    ),
)
class AdminBookingDecisionView(generics.UpdateAPIView):
    """Admin/staff confirms or rejects any pending booking (same rules as host confirm)."""

    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserType]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Booking.objects.none()
        return Booking.objects.filter(status="pending").select_related(
            "user", "rented_property", "rented_property__owner", "promo"
        )

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        action = request.data.get("action")

        with transaction.atomic():
            if action == "confirm":
                booking.status = "confirmed"
                booking.confirmed_at = timezone.now()
                booking.save()
                message = "Booking confirmed successfully"
                if not settings.DEBUG:
                    send_mail(
                        "Booking Confirmed",
                        f"Your booking for {booking.rented_property.title} has been confirmed!",
                        settings.DEFAULT_FROM_EMAIL,
                        [booking.user.email],
                        fail_silently=True,
                    )
            elif action == "reject":
                reason = request.data.get("reason", "No reason provided")
                booking.status = "rejected"
                booking.rejection_reason = reason
                booking.save()
                message = "Booking rejected"
                if not settings.DEBUG:
                    send_mail(
                        "Booking Update",
                        f"Your booking request for {booking.rented_property.title} has been rejected.\n"
                        f"Reason: {reason}",
                        settings.DEFAULT_FROM_EMAIL,
                        [booking.user.email],
                        fail_silently=True,
                    )
            else:
                raise ValidationError({"action": "Must be 'confirm' or 'reject'"})

        return Response(
            {
                "message": message,
                "booking": AdminBookingListSerializer(booking, context={"request": request}).data,
            }
        )


@extend_schema(tags=['Properties'], summary='List or create properties')
class PropertyListView(PublicPropertyCatalogMixin, generics.ListCreateAPIView):
    """List all available properties or create a new property"""
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        """Use different serializer for detail vs list"""
        if self.request.method == 'POST':
            return PropertySerializer
        return PropertySerializer  # Can swap with PropertyListSerializer for optimized version
    
    def perform_create(self, serializer):
        """Create property with owner"""
        serializer.save(owner=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Custom create response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        # Send notification to admin (optional)
        if settings.DEBUG is False:
            send_mail(
                'New Property Listed',
                f'A new property "{serializer.data.get("title")}" has been listed.',
                settings.DEFAULT_FROM_EMAIL,
                [settings.ADMIN_EMAIL],
                fail_silently=True,
            )
        
        return Response(
            {
                'message': 'Property created successfully',
                'property': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a property"""
    queryset = Property.objects.prefetch_related("images").all()
    
    def get_serializer_class(self):
        """Use detailed serializer for GET, regular for others"""
        if self.request.method == 'GET':
            return PropertyDetailSerializer
        return PropertySerializer
    
    def get_permissions(self):
        """Custom permissions based on action"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        """Only owner can update"""
        property_obj = self.get_object()
        if property_obj.owner != self.request.user:
            raise PermissionDenied("You can only edit your own properties.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only owner can delete - soft delete"""
        if instance.owner != self.request.user:
            raise PermissionDenied("You can only delete your own properties.")
        
        # Soft delete - just mark as unavailable
        instance.status = 'maintenance'
        instance.save()
        
        # Cancel all pending bookings
        instance.bookings.filter(status='pending').update(
            status='cancelled',
            rejection_reason='Property removed by host'
        )
        
        return Response(
            {'message': 'Property has been removed from listings'},
            status=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        """Custom update response"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Property updated successfully',
            'property': serializer.data
        })


@extend_schema(tags=['Properties'], summary='List my properties (host)')
class MyPropertiesView(generics.ListAPIView):
    """List all properties owned by current user"""
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Property.objects.none()
        return (
            Property.objects.filter(owner=self.request.user)
            .prefetch_related("images")
            .order_by("-created_at")
        )
    
    def get_serializer_class(self):
        """Use detail serializer for host view"""
        if self.request.query_params.get('detailed'):
            return PropertyDetailSerializer
        return PropertySerializer


# ============ AVAILABILITY & CALCULATION VIEWS ============

@extend_schema_view(
    get=extend_schema(
        tags=['Availability'],
        summary='Property availability snapshot',
        responses={200: OpenApiTypes.OBJECT},
    ),
    post=extend_schema(
        tags=['Availability'],
        summary='Check property availability for dates',
        request=PropertyAvailabilitySerializer,
        responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
    ),
)
class PropertyAvailabilityCheckView(APIView):
    """Check if property is available for specific dates"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)
        serializer = PropertyAvailabilitySerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                result = serializer.validate_availability(property_obj)
                return Response({
                    'property_id': property_obj.id,
                    'property_title': property_obj.title,
                    **result
                })
            except ValidationError as e:
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, pk):
        """Quick availability check for the next 12 months"""
        property_obj = get_object_or_404(Property, pk=pk)
        
        # Get current bookings for calendar display
        bookings = Booking.objects.filter(
            rented_property=property_obj,
            status__in=['confirmed', 'active'],
            check_out__gte=timezone.now().date()
        ).values('check_in', 'check_out', 'status')[:50]
        
        return Response({
            'property_id': property_obj.id,
            'property_title': property_obj.title,
            'monthly_price': property_obj.effective_monthly_price,
            'min_stay_months': property_obj.min_stay_months,
            'max_stay_months': property_obj.max_stay_months,
            'monthly_cycle_start': property_obj.monthly_cycle_start,
            'bookings': bookings
        })


@extend_schema(
    tags=['Availability'],
    summary='Monthly availability calendar',
    responses={200: OpenApiTypes.OBJECT},
)
class PropertyMonthlyCalendarView(APIView):
    """Get availability calendar for a property"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        property_obj = get_object_or_404(Property, pk=pk)
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        # Calculate month range
        start_date = datetime(year, month, 1).date()
        if month == 12:
            end_date = datetime(year + 1, 1, 1).date()
        else:
            end_date = datetime(year, month + 1, 1).date()
        
        # Get bookings for this month
        bookings = Booking.objects.filter(
            rented_property=property_obj,
            status__in=['confirmed', 'active'],
            check_out__gt=start_date,
            check_in__lt=end_date
        )
        
        # Mark days as available/unavailable
        calendar = []
        current_date = start_date
        while current_date < end_date:
            is_available = not bookings.filter(
                check_in__lte=current_date,
                check_out__gt=current_date
            ).exists()
            
            calendar.append({
                'date': current_date,
                'available': is_available,
                'day_of_month': current_date.day
            })
            current_date += timedelta(days=1)
        
        return Response({
            'property_id': property_obj.id,
            'year': year,
            'month': month,
            'month_name': start_date.strftime('%B'),
            'calendar': calendar,
            'booked_dates': [
                {
                    'check_in': b.check_in,
                    'check_out': b.check_out,
                    'status': b.status
                }
                for b in bookings
            ]
        })


# ============ BOOKING VIEWS ============

class BookingCreateView(generics.CreateAPIView):
    """Create a new booking"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create booking with atomic transaction"""
        with transaction.atomic():
            # LOCK the property to prevent race conditions
            property_obj = Property.objects.select_for_update().get(
                id=serializer.validated_data['rented_property'].id
            )
            
            # Check if property is available
            if property_obj.status != 'available':
                raise ValidationError({"property": "This property is not available for booking."})
            
            # Save the booking (validation happens in serializer)
            booking = serializer.save()

            # Update property status if this is the first booking
            # (Optional - depends on your business logic)
            # if property_obj.bookings.filter(status__in=['confirmed', 'active']).count() == 1:
            #     property_obj.status = 'rented'
            #     property_obj.save()

            return booking
    
    def create_payment_schedule(self, booking):
        """Create monthly payment schedule for the booking"""
        payments = []
        
        # 1. Security deposit (month 0)
        BookingPayment.objects.create(
            booking=booking,
            payment_type='deposit',
            month_number=0,
            amount=booking.security_deposit,
            due_date=timezone.now().date() + timedelta(days=3),
            status='pending'
        )
        
        # 2. Monthly rent payments
        current_date = booking.check_in
        for month in range(1, booking.months_booked + 1):
            due_date = current_date.replace(day=booking.rented_property.monthly_cycle_start)
            
            # If due date is in the past, set to next month
            if due_date < timezone.now().date():
                due_date = (due_date + relativedelta(months=1))
            
            BookingPayment.objects.create(
                booking=booking,
                payment_type='rent',
                month_number=month,
                amount=booking.agreed_monthly_rate,
                due_date=due_date,
                status='pending'
            )
            
            # Move to next month
            current_date += relativedelta(months=1)
    
    def send_booking_notification(self, booking):
        """Send email notifications to tenant and host"""
        if settings.DEBUG:
            return  # Skip in development
        
        # To tenant
        send_mail(
            'Booking Request Received',
            f'Your booking for {booking.rented_property.title} has been submitted and is pending confirmation.',
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
            fail_silently=True,
        )
        
        # To host
        send_mail(
            'New Booking Request',
            f'You have a new booking request for {booking.rented_property.title} from {booking.user.username}.',
            settings.DEFAULT_FROM_EMAIL,
            [booking.rented_property.owner.email],
            fail_silently=True,
        )
    
    def create(self, request, *args, **kwargs):
        """Custom create response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = self.perform_create(serializer)
        except ValidationError:
            raise
        except Exception:
            logger.exception("Booking creation failed")
            return Response(
                {"detail": "Booking could not be created due to a server error. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Non-critical side-effects should not block booking creation.
        try:
            self.create_payment_schedule(booking)
        except Exception:
            logger.exception("Failed creating payment schedule for booking_id=%s", booking.id)

        try:
            self.send_booking_notification(booking)
        except Exception:
            logger.exception("Failed sending booking notifications for booking_id=%s", booking.id)
        
        return Response({
            'message': 'Booking request submitted successfully',
            'booking': BookingSerializer(booking).data,
            'next_steps': 'Waiting for host confirmation'
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Bookings'])
class MyBookingsView(generics.ListAPIView):
    """List all bookings for current user"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        queryset = Booking.objects.filter(user=self.request.user)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by date range
        from_date = self.request.query_params.get('from')
        to_date = self.request.query_params.get('to')
        if from_date:
            queryset = queryset.filter(check_in__gte=from_date)
        if to_date:
            queryset = queryset.filter(check_out__lte=to_date)
        
        return (
            queryset.select_related('rented_property', 'user', 'review')
            .prefetch_related('rented_property__images')
            .order_by('-created_at')
        )


@extend_schema(tags=['Bookings'])
class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or cancel a booking"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users can only access their own bookings"""
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        return (
            Booking.objects.filter(user=self.request.user)
            .select_related('rented_property', 'user', 'review')
            .prefetch_related('rented_property__images')
        )
    
    def perform_update(self, serializer):
        """Only allow updates to specific fields"""
        booking = self.get_object()
        
        # Only pending bookings can be updated
        if booking.status != 'pending':
            raise ValidationError("Cannot modify a booking that is not pending.")
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """Cancel booking instead of deleting"""
        if instance.status in ['confirmed', 'active']:
            # Cancellation policy
            days_until_checkin = (instance.check_in - timezone.now().date()).days
            
            if days_until_checkin < 7:
                raise ValidationError(
                    "Cannot cancel booking within 7 days of check-in. Please contact support."
                )
        
        instance.status = 'cancelled'
        instance.cancelled_at = timezone.now()
        instance.save()
        
        # Send cancellation email
        if not settings.DEBUG:
            send_mail(
                'Booking Cancelled',
                f'Your booking for {instance.rented_property.title} has been cancelled.',
                settings.DEFAULT_FROM_EMAIL,
                [instance.user.email],
                fail_silently=True,
            )
        
        return Response({
            'message': 'Booking cancelled successfully'
        }, status=status.HTTP_200_OK)
    
    def retrieve(self, request, *args, **kwargs):
        """Add payment info to booking detail"""
        response = super().retrieve(request, *args, **kwargs)
        
        # Add payment schedule
        booking = self.get_object()
        payments = BookingPayment.objects.filter(booking=booking).order_by('due_date')
        response.data['payments'] = BookingPaymentSerializer(payments, many=True).data
        
        return response


# ============ HOST BOOKING MANAGEMENT VIEWS ============

@extend_schema(tags=['Host'])
class HostBookingsView(generics.ListAPIView):
    """List all bookings for host's properties"""
    serializer_class = HostBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        queryset = Booking.objects.filter(
            rented_property__owner=self.request.user
        ).select_related('user', 'rented_property').order_by('-created_at')
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by property
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(rented_property_id=property_id)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['host_view'] = True
        return context


@extend_schema(tags=['Host'])
class ConfirmBookingView(generics.UpdateAPIView):
    """Host confirms or rejects a booking"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Booking.objects.none()
        return Booking.objects.filter(
            rented_property__owner=self.request.user,
            status='pending',
        )

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        action = request.data.get('action')
        
        with transaction.atomic():
            if action == 'confirm':
                booking.status = 'confirmed'
                booking.confirmed_at = timezone.now()
                booking.save()
                
                message = 'Booking confirmed successfully'
                
                # Send confirmation email
                if not settings.DEBUG:
                    send_mail(
                        'Booking Confirmed',
                        f'Your booking for {booking.rented_property.title} has been confirmed!',
                        settings.DEFAULT_FROM_EMAIL,
                        [booking.user.email],
                        fail_silently=True,
                    )
                
            elif action == 'reject':
                reason = request.data.get('reason', 'No reason provided')
                booking.status = 'rejected'
                booking.rejection_reason = reason
                booking.save()
                
                message = 'Booking rejected'
                
                # Send rejection email
                if not settings.DEBUG:
                    send_mail(
                        'Booking Update',
                        f'Your booking request for {booking.rented_property.title} has been rejected.\nReason: {reason}',
                        settings.DEFAULT_FROM_EMAIL,
                        [booking.user.email],
                        fail_silently=True,
                    )
            else:
                raise ValidationError({"action": "Must be 'confirm' or 'reject'"})
        
        return Response({
            'message': message,
            'booking': HostBookingSerializer(booking, context={'request': request}).data
        })


# ============ HOST CLIENTS (tenants / customers on host listings) ============

def _client_avatar_initials(user):
    name = (user.get_full_name() or user.username or '?').strip()
    parts = name.split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return (name[:2] or '?').upper()


def _host_featured_booking(bookings_qs):
    for st in ('active', 'confirmed', 'pending', 'completed', 'cancelled', 'rejected'):
        b = bookings_qs.filter(status=st).order_by('-created_at').first()
        if b:
            return b
    return bookings_qs.order_by('-created_at').first()


def _host_client_row_for_user(host, user):
    bookings = Booking.objects.filter(
        user=user,
        rented_property__owner=host,
    ).select_related('rented_property')
    if not bookings.exists():
        return None

    featured = _host_featured_booking(bookings)
    prop = featured.rented_property
    if prop.listing_type == 'sale':
        type_label = 'Buy'
        amount = featured.total_price
    else:
        type_label = 'Rent'
        amount = featured.agreed_monthly_rate

    addr = ', '.join(x for x in (prop.address, prop.city, prop.country) if x)

    payments = BookingPayment.objects.filter(booking__in=bookings)
    today = timezone.now().date()
    next_pay = payments.filter(status='pending').order_by('due_date').first()
    has_overdue = payments.filter(status='pending', due_date__lt=today).exists()
    has_open = bookings.filter(status__in=['pending', 'confirmed', 'active']).exists()

    if has_overdue:
        ui_status = 'Overdue'
    elif has_open:
        ui_status = 'On Going'
    else:
        ui_status = 'Completed'

    display_name = (user.get_full_name() or '').strip() or user.username
    return {
        'id': str(user.id),
        'clientId': str(user.id),
        'tenant_user_id': user.id,
        'name': display_name,
        'avatarInitials': _client_avatar_initials(user),
        'propertyName': prop.title,
        'propertyAddress': addr,
        'type': type_label,
        'amount': str(amount),
        'currency': prop.currency,
        'nextPayment': next_pay.due_date.isoformat() if next_pay else '',
        'status': ui_status,
        'user_type': user.user_type,
    }


@extend_schema(tags=['Host'], summary='List host clients (tenant customers)')
class HostClientsListView(APIView):
    """Distinct users who have bookings on the host's properties (linked customer accounts)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        host = request.user
        tenant_ids = (
            Booking.objects.filter(rented_property__owner=host)
            .values_list('user_id', flat=True)
            .distinct()
        )
        User = get_user_model()
        users = User.objects.filter(id__in=tenant_ids).order_by('username')

        rows = []
        summary = {'total': 0, 'ongoing': 0, 'completed': 0}
        for u in users:
            row = _host_client_row_for_user(host, u)
            if row:
                rows.append(row)
                summary['total'] += 1
                if row['status'] in ('On Going', 'Overdue'):
                    summary['ongoing'] += 1
                elif row['status'] == 'Completed':
                    summary['completed'] += 1

        return Response({'summary': summary, 'clients': rows})


@extend_schema(tags=['Host'], summary='Host client detail (tenant customer)')
class HostClientDetailView(APIView):
    """Profile, bookings, and payment schedule for one tenant linked via bookings."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        host = request.user
        User = get_user_model()
        tenant = get_object_or_404(User, pk=user_id)
        bookings = Booking.objects.filter(
            user=tenant,
            rented_property__owner=host,
        ).select_related('rented_property')
        if not bookings.exists():
            return Response(
                {'detail': 'Not a client of yours.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        featured = _host_featured_booking(bookings)
        prop = featured.rented_property
        addr = ', '.join(x for x in (prop.address, prop.city, prop.country) if x)

        payments = BookingPayment.objects.filter(booking__in=bookings).order_by(
            '-due_date', '-id'
        )
        tx_rows = []
        for p in payments:
            tx_rows.append({
                'id': str(p.id),
                'paymentType': p.get_payment_type_display(),
                'dueDate': p.due_date.isoformat(),
                'amount': float(p.amount),
                'status': 'Paid' if p.status == 'paid' else 'Pending',
            })

        display_name = (tenant.get_full_name() or '').strip() or tenant.username
        detail_block = {
            'clientId': str(tenant.id),
            'tenantUserId': tenant.id,
            'name': display_name,
            'avatarInitials': _client_avatar_initials(tenant),
            'email': tenant.email,
            'phone': tenant.phone or '',
            'bio': '',
            'user_type': tenant.user_type,
            'propertyName': prop.title,
            'propertyAddress': addr,
            'propertyType': prop.get_property_type_display(),
            'transactionDate': featured.created_at.date().isoformat(),
            'transactionType': 'Rent' if prop.listing_type == 'rent' else 'Purchase',
            'rentDuration': (
                f'{featured.months_booked} mo.' if prop.listing_type == 'rent' else '—'
            ),
        }

        bookings_brief = HostBookingSerializer(
            bookings.order_by('-created_at')[:25],
            many=True,
            context={'request': request},
        ).data

        return Response({
            'tenant': UserSerializer(tenant).data,
            'detail': detail_block,
            'bookings': bookings_brief,
            'transactions': tx_rows,
        })


@extend_schema(tags=['Host'], summary='Host analytics (bookings, mix, top properties)')
class HostAnalyticsView(APIView):
    """
    Aggregates for the host analytics screen. Query: ?range=7d|30d|90d (default 30d).
    Traffic series = new bookings per day (no separate view-tracking yet).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        host = request.user
        r = request.query_params.get('range', '30d')
        if r not in ('7d', '30d', '90d'):
            r = '30d'
        days = {'7d': 7, '30d': 30, '90d': 90}[r]

        today = timezone.now().date()
        start_date = today - timedelta(days=days - 1)
        start_dt = timezone.make_aware(
            datetime.combine(start_date, datetime.min.time()),
            timezone.get_current_timezone(),
        )

        prop_qs = Property.objects.filter(owner=host)
        total_props = prop_qs.count()
        available_props = prop_qs.filter(status='available').count()

        tenant_ids = (
            Booking.objects.filter(rented_property__owner=host)
            .values_list('user_id', flat=True)
            .distinct()
        )
        clients_count = len(set(tenant_ids))

        if total_props > 0:
            occupied = prop_qs.filter(status='rented').count()
            occupancy_rate = min(100, int(round(100 * occupied / total_props)))
        else:
            occupancy_rate = 0

        prop_ids = list(prop_qs.values_list('id', flat=True))
        promo_qs = PromoCode.objects.filter(is_active=True).filter(
            models.Q(applies_to_property_id__in=prop_ids)
            | models.Q(applies_to_property__isnull=True)
        ).filter(
            models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=today),
        ).filter(
            models.Q(valid_until__isnull=True) | models.Q(valid_until__gte=today),
        )
        active_discounts = promo_qs.distinct().count()

        series = []
        labels = []
        for i in range(days):
            d = start_date + timedelta(days=i)
            labels.append(d.isoformat())
            n = Booking.objects.filter(
                rented_property__owner=host,
                created_at__date=d,
            ).count()
            series.append(n)

        rent_listings = prop_qs.filter(
            listing_type='rent', status='available'
        ).count()
        sale_listings = prop_qs.filter(
            listing_type='sale', status='available'
        ).count()
        occupied_or_other = max(0, total_props - rent_listings - sale_listings)
        mix_denom = max(1, rent_listings + sale_listings + occupied_or_other)
        pct_rent = int(round(100 * rent_listings / mix_denom))
        pct_sale = int(round(100 * sale_listings / mix_denom))
        pct_reserved = max(0, 100 - pct_rent - pct_sale)

        top_qs = (
            prop_qs.annotate(
                period_bookings=models.Count(
                    'bookings',
                    filter=models.Q(bookings__created_at__gte=start_dt),
                )
            )
            .order_by('-period_bookings', '-updated_at')[:30]
        )
        top_properties = []
        for p in top_qs:
            loc_parts = [x for x in (p.city, p.country) if x]
            top_properties.append({
                'id': p.id,
                'title': p.title,
                'location': ', '.join(loc_parts) if loc_parts else (p.address or ''),
                'bookings_in_period': p.period_bookings,
                'leads': p.period_bookings,
                'updated_at': p.updated_at.isoformat() if p.updated_at else '',
            })

        return Response({
            'range': r,
            'summary': {
                'properties_total': total_props,
                'properties_available': available_props,
                'clients': clients_count,
                'occupancy_rate': occupancy_rate,
                'active_discounts': active_discounts,
            },
            'traffic': {
                'metric': 'bookings_created',
                'labels': labels,
                'series': series,
            },
            'listing_mix': {
                'rent': rent_listings,
                'sale': sale_listings,
                'reserved': occupied_or_other,
                'total': total_props,
                'percent': {
                    'rent': pct_rent,
                    'sale': pct_sale,
                    'reserved': pct_reserved,
                },
            },
            'top_properties': top_properties,
        })


@extend_schema(tags=['Host'], summary='Host calendar events (bookings)')
class HostCalendarView(APIView):
    """
    Bookings on the host's properties, expanded to one entry per occupied night.
    Query: start=YYYY-MM-DD&end=YYYY-MM-DD (inclusive range of dates to return).
    Occupied nights: check_in <= d < check_out.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_s = request.query_params.get('start')
        end_s = request.query_params.get('end')
        if not start_s or not end_s:
            return Response(
                {'detail': 'Query params "start" and "end" are required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            start_date = datetime.strptime(start_s, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_s, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if end_date < start_date:
            return Response({'detail': '"end" must be >= "start".'}, status=status.HTTP_400_BAD_REQUEST)

        host = request.user
        bookings = (
            Booking.objects.filter(
                rented_property__owner=host,
                status__in=['pending', 'confirmed', 'active', 'completed'],
                check_in__lte=end_date,
                check_out__gt=start_date,
            )
            .select_related('rented_property', 'user')
            .order_by('check_in', 'id')
        )

        events = []
        for b in bookings:
            tenant_label = (b.user.get_full_name() or '').strip() or b.user.username
            title = f'{b.rented_property.title} · {tenant_label}'
            d = max(b.check_in, start_date)
            while d < b.check_out and d <= end_date:
                events.append({
                    'id': f'{b.id}-{d.isoformat()}',
                    'booking_id': b.id,
                    'title': title,
                    'date': d.isoformat(),
                    'status': b.status,
                    'property_id': b.rented_property_id,
                    'property_title': b.rented_property.title,
                    'all_day': True,
                    'check_in': b.check_in.isoformat(),
                    'check_out': b.check_out.isoformat(),
                    'guests': b.guests,
                })
                d += timedelta(days=1)

        return Response({'events': events})


@extend_schema(
    tags=['Admin'],
    summary='Admin calendar — all booking nights (platform admin)',
    description='Same shape as GET /api/host/calendar/; staff or user_type=admin only.',
)
class AdminCalendarView(APIView):
    """Platform-wide booking nights for the admin dashboard calendar."""

    permission_classes = [permissions.IsAuthenticated, IsAdminUserType]

    def get(self, request):
        start_s = request.query_params.get('start')
        end_s = request.query_params.get('end')
        if not start_s or not end_s:
            return Response(
                {'detail': 'Query params "start" and "end" are required (YYYY-MM-DD).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            start_date = datetime.strptime(start_s, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_s, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        if end_date < start_date:
            return Response({'detail': '"end" must be >= "start".'}, status=status.HTTP_400_BAD_REQUEST)

        bookings = (
            Booking.objects.filter(
                status__in=['pending', 'confirmed', 'active', 'completed'],
                check_in__lte=end_date,
                check_out__gt=start_date,
            )
            .select_related('rented_property', 'user')
            .order_by('check_in', 'id')
        )

        events = []
        for b in bookings:
            tenant_label = (b.user.get_full_name() or '').strip() or b.user.username
            title = f'{b.rented_property.title} · {tenant_label}'
            d = max(b.check_in, start_date)
            while d < b.check_out and d <= end_date:
                events.append({
                    'id': f'{b.id}-{d.isoformat()}',
                    'booking_id': b.id,
                    'title': title,
                    'date': d.isoformat(),
                    'status': b.status,
                    'property_id': b.rented_property_id,
                    'property_title': b.rented_property.title,
                    'all_day': True,
                    'check_in': b.check_in.isoformat(),
                    'check_out': b.check_out.isoformat(),
                    'guests': b.guests,
                })
                d += timedelta(days=1)

        return Response({'events': events})


@extend_schema(tags=['Bookings'], summary='Reschedule booking (listing owner or platform admin)')
class BookingRescheduleView(APIView):
    """
    Update check-in / check-out (and optionally guests) for a booking.
    Listing owner or staff / user_type=admin. Blocks if any payment is already marked paid.
    Recalculates months, total price, deposit, and regenerates pending payment schedule.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        serializer = BookingRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        check_in = serializer.validated_data['check_in']
        check_out = serializer.validated_data['check_out']
        guests_in = serializer.validated_data.get('guests')

        booking = get_object_or_404(
            Booking.objects.select_related('rented_property', 'user', 'promo'),
            pk=pk,
        )

        user = request.user
        is_admin = IsAdminUserType().has_permission(request, self)
        is_owner = booking.rented_property.owner_id == user.id
        if not (is_admin or is_owner):
            raise PermissionDenied('You do not have permission to reschedule this booking.')

        if booking.status not in ('pending', 'confirmed', 'active'):
            raise ValidationError(
                {'detail': 'Only pending, confirmed, or active bookings can be rescheduled.'}
            )

        if booking.payments.filter(status='paid').exists():
            raise ValidationError(
                {'detail': 'Cannot reschedule after one or more payments have been recorded as paid.'}
            )

        prop = booking.rented_property
        today = timezone.now().date()

        if check_in < today:
            raise ValidationError({'check_in': 'Check-in date cannot be in the past.'})
        if check_out <= check_in:
            raise ValidationError({'check_out': 'Check-out must be after check-in.'})
        if check_in.day != prop.monthly_cycle_start:
            raise ValidationError({
                'check_in': f'Monthly bookings must start on day {prop.monthly_cycle_start} of the month.',
            })

        months = prop.calculate_total_months(check_in, check_out)
        if prop.max_stay_months and months > prop.max_stay_months:
            raise ValidationError({
                'check_out': f'Maximum stay is {prop.max_stay_months} months for this property.',
            })

        if prop.has_booking_conflict(check_in, check_out, exclude_booking_id=booking.id):
            raise ValidationError(
                {'detail': 'Those dates overlap another booking for this property.'}
            )

        promo = booking.promo
        if promo:
            try:
                validate_promo_for_booking(promo, prop, months, check_in)
            except ValidationError:
                raise ValidationError(
                    {'detail': 'The applied promotion is not valid for the new dates.'}
                )

        monthly_rate = prop.effective_monthly_price
        total_price = final_total_with_promo(prop, months, promo)
        discount_pct = combined_discount_percent(prop, months, promo)
        deposit = prop.security_deposit_amount
        if deposit is None:
            deposit = Decimal('0')

        guests_val = guests_in if guests_in is not None else booking.guests

        with transaction.atomic():
            locked = Booking.objects.select_for_update().get(pk=booking.pk)
            if locked.payments.filter(status='paid').exists():
                raise ValidationError(
                    {'detail': 'Cannot reschedule after one or more payments have been recorded as paid.'}
                )
            Booking.objects.filter(pk=locked.pk).update(
                check_in=check_in,
                check_out=check_out,
                guests=guests_val,
                months_booked=months,
                agreed_monthly_rate=monthly_rate,
                total_price=total_price,
                security_deposit=deposit,
                discount_applied=discount_pct,
            )

        booking.refresh_from_db()
        booking.generate_payment_schedule()

        return Response({
            'message': 'Booking rescheduled successfully.',
            'booking': HostBookingSerializer(booking, context={'request': request}).data,
        })


@extend_schema(
    tags=['Host'],
    summary='Booking payments across your properties',
    parameters=[
        {
            'name': 'status',
            'required': False,
            'in': 'query',
            'description': 'Comma-separated statuses: pending,paid,overdue,cancelled,refunded',
            'schema': {'type': 'string'},
        },
        {
            'name': 'page',
            'required': False,
            'in': 'query',
            'description': 'Page number (1-based). Use with page_size.',
            'schema': {'type': 'integer', 'minimum': 1},
        },
        {
            'name': 'page_size',
            'required': False,
            'in': 'query',
            'description': 'Page size (default 50, max 200)',
            'schema': {'type': 'integer', 'minimum': 1},
        },
        {
            'name': 'limit',
            'required': False,
            'in': 'query',
            'description': 'Legacy: first-page page size when page/page_size omitted (max 2000)',
            'schema': {'type': 'integer', 'minimum': 1},
        },
    ],
)
class HostPaymentsListView(APIView):
    """
    Scheduled booking payments (deposit + rent installments) for listings you own.
    Filtering: optional status (comma-separated). Pagination: page + page_size (defaults 1 and 50).
    Legacy clients may pass limit only (no page) to fetch the first page with up to limit rows.
    Summary reflects the full filtered set (not just the current page).
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            status_filter = _parse_host_payments_status_param(request.query_params.get('status'))
        except ValidationError as e:
            return Response(e.detail if isinstance(e.detail, dict) else {'detail': e.detail}, status=400)

        qs = _host_payments_base_queryset(request.user)
        if status_filter is not None:
            qs = qs.filter(status__in=status_filter)

        summary = _host_payments_summary(qs)
        total_count = summary['count']

        qp = request.query_params
        try:
            page = int(qp.get('page', 1))
        except ValueError:
            page = 1
        page = max(1, page)

        if 'page_size' in qp:
            try:
                page_size = int(qp['page_size'])
            except ValueError:
                page_size = 50
            page_size = max(1, min(page_size, 200))
        elif 'limit' in qp:
            try:
                page_size = int(qp.get('limit', 500))
            except ValueError:
                page_size = 500
            page_size = max(1, min(page_size, 2000))
        elif 'page' in qp:
            page_size = 50
        else:
            # No hints: same default cap as pre-pagination API (single "page")
            page_size = 500

        offset = (page - 1) * page_size
        page_qs = qs[offset : offset + page_size]
        payments = [_serialize_booking_payment_row(p) for p in page_qs]

        total_pages = max(1, (total_count + page_size - 1) // page_size) if total_count else 1

        return Response({
            'payments': payments,
            'summary': summary,
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': total_pages,
        })


# ============ PAYMENT VIEWS ============

@extend_schema(tags=['Payments'])
class BookingPaymentsView(generics.ListAPIView):
    """List all payments for a booking"""
    serializer_class = BookingPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return BookingPayment.objects.none()
        booking_id = self.kwargs.get('pk')
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Only tenant and host can view payments
        if booking.user != self.request.user and booking.rented_property.owner != self.request.user:
            raise PermissionDenied("You don't have permission to view these payments.")
        
        return BookingPayment.objects.filter(booking=booking).order_by('due_date')


@extend_schema(tags=['Payments'])
class MarkPaymentPaidView(generics.UpdateAPIView):
    """Mark a payment as paid (host or admin only)"""
    serializer_class = BookingPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only host of the property can mark payments as paid"""
        if getattr(self, 'swagger_fake_view', False):
            return BookingPayment.objects.none()
        return BookingPayment.objects.filter(
            booking__rented_property__owner=self.request.user
        )
    
    def update(self, request, *args, **kwargs):
        payment = self.get_object()
        
        payment.mark_as_paid(
            transaction_id=request.data.get('transaction_id', '')
        )
        
        # Check if deposit is paid
        if payment.payment_type == 'deposit' and payment.status == 'paid':
            payment.booking.deposit_paid = True
            payment.booking.deposit_paid_at = timezone.now()
            payment.booking.save()
        
        return Response({
            'message': 'Payment marked as paid',
            'payment': BookingPaymentSerializer(payment).data
        })


# ============ REVIEW VIEWS ============

class CreateReviewView(generics.CreateAPIView):
    """Create a review for a completed booking"""
    serializer_class = PropertyReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['booking_id'] = self.kwargs.get('booking_id')
        return context
    
    def perform_create(self, serializer):
        serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'message': 'Review submitted successfully',
            'review': serializer.data
        }, status=status.HTTP_201_CREATED)


class HostRespondToReviewView(generics.UpdateAPIView):
    """Host responds to a review"""
    serializer_class = HostResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only host of the property can respond"""
        return PropertyReview.objects.filter(
            property__owner=self.request.user
        )
    
    def update(self, request, *args, **kwargs):
        review = self.get_object()
        serializer = self.get_serializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'message': 'Response posted successfully',
            'review': PropertyReviewSerializer(review).data
        })


class PropertyReviewsView(generics.ListAPIView):
    """List all reviews for a property"""
    serializer_class = PropertyReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        property_id = self.kwargs.get('pk')
        return PropertyReview.objects.filter(
            property_id=property_id
        ).order_by('-created_at')


# ============ DASHBOARD/STATS VIEWS ============

def _pct_change(current: Decimal, previous: Decimal) -> Optional[float]:
    if previous is not None and previous > 0:
        return float((current - previous) / previous * 100)
    return None


def _revenue_in_period(user, start, end):
    q = Booking.objects.filter(
        rented_property__owner=user,
        status__in=['confirmed', 'active', 'completed'],
        created_at__gte=start,
        created_at__lt=end,
    ).aggregate(total=models.Sum('total_price'))['total']
    return q if q is not None else Decimal('0')


def _host_payments_base_queryset(user):
    return (
        BookingPayment.objects.filter(booking__rented_property__owner=user)
        .select_related('booking__user', 'booking__rented_property')
        .order_by('-due_date', '-id')
    )


def _serialize_booking_payment_row(p: BookingPayment):
    return {
        'id': p.id,
        'booking': p.booking_id,
        'payment_type': p.payment_type,
        'month_number': p.month_number,
        'amount': str(p.amount),
        'due_date': p.due_date.isoformat(),
        'status': p.status,
        'paid_date': p.paid_date.isoformat() if p.paid_date else None,
        'transaction_id': p.transaction_id or '',
        'property_title': p.booking.rented_property.title,
        'customer': (
            (p.booking.user.get_full_name() or '').strip()
            or p.booking.user.username
        ),
    }


def _parse_host_payments_status_param(raw: Optional[str]):
    """
    Comma-separated status values, e.g. pending or pending,overdue.
    Empty or missing means no filter (all statuses).
    """
    if raw is None or not str(raw).strip():
        return None
    parts = [s.strip() for s in str(raw).split(',') if s.strip()]
    if not parts:
        return None
    invalid = [s for s in parts if s not in _HOST_PAYMENT_STATUS_CODES]
    if invalid:
        raise ValidationError(
            {'status': f'Invalid status value(s): {", ".join(invalid)}. '
             f'Allowed: {", ".join(sorted(_HOST_PAYMENT_STATUS_CODES))}.'}
        )
    return parts


def _host_payments_summary(qs):
    """Counts and outstanding amount for the (filtered) queryset, before pagination."""
    total = qs.count()
    agg = {row['status']: row['n'] for row in qs.values('status').annotate(n=models.Count('id'))}
    outstanding = (
        qs.filter(status__in=['pending', 'overdue']).aggregate(t=models.Sum('amount'))['t']
        or Decimal('0')
    )
    return {
        'count': total,
        'paid': agg.get('paid', 0),
        'pending': agg.get('pending', 0),
        'overdue': agg.get('overdue', 0),
        'cancelled': agg.get('cancelled', 0),
        'refunded': agg.get('refunded', 0),
        'outstanding_amount': str(outstanding),
    }


def _serialize_recent_payments_for_host(user, limit=100):
    qs = _host_payments_base_queryset(user)[:limit]
    return [_serialize_booking_payment_row(p) for p in qs]


def _listings_chart(user):
    today = timezone.now().date()
    weekday_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    days_since_sun = (today.weekday() + 1) % 7
    sun = today - timedelta(days=days_since_sun)
    weekly = []
    for i in range(7):
        d = sun + timedelta(days=i)
        qs = Property.objects.filter(owner=user, created_at__date=d)
        weekly.append({
            "label": weekday_labels[i],
            "rent": qs.filter(listing_type='rent').count(),
            "sale": qs.filter(listing_type='sale').count(),
        })

    year, month = today.year, today.month
    last_day = calendar.monthrange(year, month)[1]
    bucket_defs = [
        (1, 5, "1 - 5"),
        (6, 10, "6 - 10"),
        (11, 15, "11 - 15"),
        (16, 20, "16 - 20"),
        (21, 25, "21 - 25"),
        (26, 31, f"26 - {last_day}"),
    ]
    monthly = []
    for dmin, dmax, label in bucket_defs:
        end = min(dmax, last_day)
        if dmin > last_day:
            monthly.append({"label": label, "rent": 0, "sale": 0})
            continue
        start_d = date(year, month, dmin)
        end_d = date(year, month, end)
        qs = Property.objects.filter(
            owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        )
        monthly.append({
            "label": label,
            "rent": qs.filter(listing_type='rent').count(),
            "sale": qs.filter(listing_type='sale').count(),
        })

    y = today.year
    quarterly_labels = ["Q1", "Q2", "Q3", "Q4"]
    yearly = []
    for qi, (start_m, end_m) in enumerate([(1, 3), (4, 6), (7, 9), (10, 12)]):
        qs = Property.objects.filter(
            owner=user,
            created_at__year=y,
            created_at__month__gte=start_m,
            created_at__month__lte=end_m,
        )
        yearly.append({
            "label": quarterly_labels[qi],
            "rent": qs.filter(listing_type='rent').count(),
            "sale": qs.filter(listing_type='sale').count(),
        })

    return {"weekly": weekly, "monthly": monthly, "yearly": yearly}


def _activity_chart(user):
    today = timezone.now().date()

    daily = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        b_n = Booking.objects.filter(
            rented_property__owner=user, created_at__date=d
        ).count()
        l_n = Property.objects.filter(owner=user, created_at__date=d).count()
        daily.append({
            "date": d.isoformat(),
            "dateLabel": d.strftime("%B %d, %Y"),
            "views": b_n,
            "property": l_n,
        })

    weekly = []
    for w in range(3, -1, -1):
        end_d = today - timedelta(days=w * 7)
        start_d = end_d - timedelta(days=6)
        b_n = Booking.objects.filter(
            rented_property__owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        l_n = Property.objects.filter(
            owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        weekly.append({
            "date": start_d.isoformat(),
            "dateLabel": start_d.strftime("%B %d, %Y"),
            "views": b_n,
            "property": l_n,
        })

    monthly = []
    for m_back in range(5, -1, -1):
        dt = today.replace(day=1) - relativedelta(months=m_back)
        y, mo = dt.year, dt.month
        last = calendar.monthrange(y, mo)[1]
        start_d = date(y, mo, 1)
        end_d = date(y, mo, last)
        b_n = Booking.objects.filter(
            rented_property__owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        l_n = Property.objects.filter(
            owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        monthly.append({
            "date": start_d.isoformat(),
            "dateLabel": start_d.strftime("%B %Y"),
            "views": b_n,
            "property": l_n,
        })

    yearly = []
    for m_back in range(11, -1, -1):
        dt = today.replace(day=1) - relativedelta(months=m_back)
        y, mo = dt.year, dt.month
        last = calendar.monthrange(y, mo)[1]
        start_d = date(y, mo, 1)
        end_d = date(y, mo, last)
        b_n = Booking.objects.filter(
            rented_property__owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        l_n = Property.objects.filter(
            owner=user,
            created_at__date__gte=start_d,
            created_at__date__lte=end_d,
        ).count()
        yearly.append({
            "date": start_d.isoformat(),
            "dateLabel": start_d.strftime("%B %Y"),
            "views": b_n,
            "property": l_n,
        })

    return {"Daily": daily, "Weekly": weekly, "Monthly": monthly, "Yearly": yearly}


@extend_schema(
    tags=['Dashboards'],
    summary='Host dashboard',
    responses={200: HostDashboardSerializer},
)
class HostDashboardView(APIView):
    """Dashboard statistics for hosts"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        now = timezone.now()
        start_30 = now - timedelta(days=30)
        start_60 = now - timedelta(days=60)

        # Properties
        prop_base = Property.objects.filter(owner=user)
        total_properties = prop_base.count()
        active_properties = prop_base.filter(status='available').count()
        rent_listings = prop_base.filter(listing_type='rent').count()
        sale_listings = prop_base.filter(listing_type='sale').count()

        rent_new_30 = prop_base.filter(
            listing_type='rent', created_at__gte=start_30
        ).count()
        rent_new_prev = prop_base.filter(
            listing_type='rent', created_at__gte=start_60, created_at__lt=start_30
        ).count()
        sale_new_30 = prop_base.filter(
            listing_type='sale', created_at__gte=start_30
        ).count()
        sale_new_prev = prop_base.filter(
            listing_type='sale', created_at__gte=start_60, created_at__lt=start_30
        ).count()

        # Bookings
        total_bookings = Booking.objects.filter(rented_property__owner=user).count()
        pending_bookings = Booking.objects.filter(
            rented_property__owner=user,
            status='pending'
        ).count()
        active_bookings = Booking.objects.filter(
            rented_property__owner=user,
            status__in=['confirmed', 'active']
        ).count()

        # Revenue
        total_revenue = Booking.objects.filter(
            rented_property__owner=user,
            status__in=['confirmed', 'active', 'completed']
        ).aggregate(total=models.Sum('total_price'))['total'] or Decimal('0')

        upcoming_payments = BookingPayment.objects.filter(
            booking__rented_property__owner=user,
            status='pending',
            due_date__gte=timezone.now().date()
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')

        rev_last_30 = _revenue_in_period(user, start_30, now)
        rev_prior_30 = _revenue_in_period(user, start_60, start_30)

        # Recent bookings
        recent_bookings = Booking.objects.filter(
            rented_property__owner=user
        ).select_related('user', 'rented_property').order_by('-created_at')[:5]

        primary_currency = (
            prop_base.values_list('currency', flat=True).first() or 'ghs'
        )

        return Response({
            'properties': {
                'total': total_properties,
                'active': active_properties,
                'rent_listings': rent_listings,
                'sale_listings': sale_listings,
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'active': active_bookings,
            },
            'revenue': {
                'total': str(total_revenue),
                'upcoming': str(upcoming_payments),
                'last_30_days': str(rev_last_30),
                'prior_30_days': str(rev_prior_30),
            },
            'recent_bookings': HostBookingSerializer(
                recent_bookings, many=True, context={'request': request}
            ).data,
            'recent_payments': _serialize_recent_payments_for_host(user),
            'listings_chart': _listings_chart(user),
            'activity_chart': _activity_chart(user),
            'comparison': {
                'revenue_pct': _pct_change(rev_last_30, rev_prior_30),
                'rent_listings_pct': _pct_change(
                    Decimal(rent_new_30), Decimal(rent_new_prev)
                ),
                'sale_listings_pct': _pct_change(
                    Decimal(sale_new_30), Decimal(sale_new_prev)
                ),
            },
            'currency': primary_currency,
        })


@extend_schema(
    tags=['Dashboards'],
    summary='Tenant dashboard',
    responses={200: TenantDashboardSerializer},
)
class TenantDashboardView(APIView):
    """Dashboard statistics for tenants"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Bookings
        total_bookings = Booking.objects.filter(user=user).count()
        active_bookings = Booking.objects.filter(
            user=user,
            status__in=['confirmed', 'active']
        ).count()
        pending_bookings = Booking.objects.filter(
            user=user,
            status='pending'
        ).count()
        completed_bookings = Booking.objects.filter(
            user=user,
            status='completed'
        ).count()
        
        # Upcoming payments
        upcoming_payments = BookingPayment.objects.filter(
            booking__user=user,
            status='pending',
            due_date__gte=timezone.now().date()
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Next booking
        next_booking = Booking.objects.filter(
            user=user,
            status__in=['confirmed', 'active'],
            check_in__gte=timezone.now().date()
        ).order_by('check_in').first()
        
        # Recent bookings
        recent_bookings = Booking.objects.filter(
            user=user
        ).select_related('rented_property').order_by('-created_at')[:5]
        
        return Response({
            'bookings': {
                'total': total_bookings,
                'active': active_bookings,
                'pending': pending_bookings,
                'completed': completed_bookings,
            },
            'upcoming_payments': upcoming_payments,
            'next_booking': BookingSerializer(next_booking).data if next_booking else None,
            'recent_bookings': BookingSerializer(recent_bookings, many=True).data
        })

# ============ CONFIG VIEWS ============

class CurrencyChoicesView(APIView):
    """Get available currency choices"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        choices = [{"value": code, "label": str(name)} for code, name in Property.CURRENCY_CHOICES]
        return Response(choices)


@extend_schema(
    tags=['Locale'],
    summary='List UI languages',
    responses={200: LocaleChoiceSerializer(many=True)},
)
class LanguageListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response([{"value": v, "label": l} for v, l in LANGUAGE_CHOICES])


@extend_schema(
    tags=['Locale'],
    summary='List time zones',
    responses={200: LocaleChoiceSerializer(many=True)},
)
class TimeZoneListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response([{"value": v, "label": l} for v, l in TIMEZONE_CHOICES])
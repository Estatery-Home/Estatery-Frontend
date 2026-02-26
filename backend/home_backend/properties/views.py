from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, Booking, BookingPayment, PropertyReview
from .serializers import (
    PropertySerializer, PropertyDetailSerializer, PropertyAvailabilitySerializer,
    BookingSerializer, HostBookingSerializer, BookingPaymentSerializer,
    PropertyReviewSerializer, HostResponseSerializer
)
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings

# ============ PROPERTY VIEWS ============

class PropertyListView(generics.ListCreateAPIView):
    """List all available properties or create a new property"""
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['property_type', 'bedrooms', 'bathrooms', 'city', 'country', 'status']
    search_fields = ['title', 'description', 'address', 'city']
    ordering_fields = ['daily_price', 'monthly_price', 'created_at', 'area', 'bedrooms']
    ordering = ['-created_at']  # Default ordering
    
    def get_queryset(self):
        queryset = Property.objects.all()
        
        # Filter by availability status
        status = self.request.query_params.get('status', 'available')
        if status == 'available':
            queryset = queryset.filter(status='available')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(monthly_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(monthly_price__lte=max_price)
        
        # Filter by amenities
        amenities = ['wifi', 'parking', 'pool', 'gym', 'furnished', 'kitchen']
        for amenity in amenities:
            if self.request.query_params.get(f'has_{amenity}'):
                queryset = queryset.filter(**{f'has_{amenity}': True})
        
        return queryset
    
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
    queryset = Property.objects.all()
    
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


class MyPropertiesView(generics.ListAPIView):
    """List all properties owned by current user"""
    serializer_class = PropertySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Property.objects.filter(owner=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        """Use detail serializer for host view"""
        if self.request.query_params.get('detailed'):
            return PropertyDetailSerializer
        return PropertySerializer


# ============ AVAILABILITY & CALCULATION VIEWS ============

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
            property=property_obj,
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
            property=property_obj,
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
                id=serializer.validated_data['property'].id
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
            
            # Create payment schedule for monthly payments
            self.create_payment_schedule(booking)
            
            # Send confirmation email
            self.send_booking_notification(booking)
            
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
            due_date = current_date.replace(day=booking.property.monthly_cycle_start)
            
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
            f'Your booking for {booking.property.title} has been submitted and is pending confirmation.',
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
            fail_silently=True,
        )
        
        # To host
        send_mail(
            'New Booking Request',
            f'You have a new booking request for {booking.property.title} from {booking.user.username}.',
            settings.DEFAULT_FROM_EMAIL,
            [booking.property.owner.email],
            fail_silently=True,
        )
    
    def create(self, request, *args, **kwargs):
        """Custom create response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = self.perform_create(serializer)
        
        return Response({
            'message': 'Booking request submitted successfully',
            'booking': BookingSerializer(booking).data,
            'next_steps': 'Waiting for host confirmation'
        }, status=status.HTTP_201_CREATED)


class MyBookingsView(generics.ListAPIView):
    """List all bookings for current user"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
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
        
        return queryset.select_related('property', 'user').order_by('-created_at')


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or cancel a booking"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users can only access their own bookings"""
        return Booking.objects.filter(user=self.request.user)
    
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
                f'Your booking for {instance.property.title} has been cancelled.',
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

class HostBookingsView(generics.ListAPIView):
    """List all bookings for host's properties"""
    serializer_class = HostBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Booking.objects.filter(
            property__owner=self.request.user
        ).select_related('user', 'property').order_by('-created_at')
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by property
        property_id = self.request.query_params.get('property')
        if property_id:
            queryset = queryset.filter(property_id=property_id)
        
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['host_view'] = True
        return context


class ConfirmBookingView(generics.UpdateAPIView):
    """Host confirms or rejects a booking"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only bookings for host's properties"""
        return Booking.objects.filter(
            property__owner=self.request.user,
            status='pending'
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
                        f'Your booking for {booking.property.title} has been confirmed!',
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
                        f'Your booking request for {booking.property.title} has been rejected.\nReason: {reason}',
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


# ============ PAYMENT VIEWS ============

class BookingPaymentsView(generics.ListAPIView):
    """List all payments for a booking"""
    serializer_class = BookingPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        booking_id = self.kwargs.get('pk')
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Only tenant and host can view payments
        if booking.user != self.request.user and booking.property.owner != self.request.user:
            raise PermissionDenied("You don't have permission to view these payments.")
        
        return BookingPayment.objects.filter(booking=booking).order_by('due_date')


class MarkPaymentPaidView(generics.UpdateAPIView):
    """Mark a payment as paid (host or admin only)"""
    serializer_class = BookingPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only host of the property can mark payments as paid"""
        return BookingPayment.objects.filter(
            booking__property__owner=self.request.user
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

class HostDashboardView(APIView):
    """Dashboard statistics for hosts"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Properties
        total_properties = Property.objects.filter(owner=user).count()
        active_properties = Property.objects.filter(owner=user, status='available').count()
        
        # Bookings
        total_bookings = Booking.objects.filter(property__owner=user).count()
        pending_bookings = Booking.objects.filter(
            property__owner=user, 
            status='pending'
        ).count()
        active_bookings = Booking.objects.filter(
            property__owner=user,
            status__in=['confirmed', 'active']
        ).count()
        
        # Revenue
        total_revenue = Booking.objects.filter(
            property__owner=user,
            status__in=['confirmed', 'active', 'completed']
        ).aggregate(total=models.Sum('total_price'))['total'] or 0
        
        upcoming_payments = BookingPayment.objects.filter(
            booking__property__owner=user,
            status='pending',
            due_date__gte=timezone.now().date()
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        # Recent bookings
        recent_bookings = Booking.objects.filter(
            property__owner=user
        ).select_related('user', 'property').order_by('-created_at')[:5]
        
        return Response({
            'properties': {
                'total': total_properties,
                'active': active_properties,
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'active': active_bookings,
            },
            'revenue': {
                'total': total_revenue,
                'upcoming': upcoming_payments,
            },
            'recent_bookings': HostBookingSerializer(recent_bookings, many=True, context={'request': request}).data
        })


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
        ).select_related('property').order_by('-created_at')[:5]
        
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
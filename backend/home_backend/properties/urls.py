# properties/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # === PROPERTIES ===
    path('properties/', views.PropertyListView.as_view(), name='property-list'),
    path('properties/<int:pk>/', views.PropertyDetailView.as_view(), name='property-detail'),
    path('properties/my/', views.MyPropertiesView.as_view(), name='my-properties'),
    
    # === AVAILABILITY ===
    path('properties/<int:pk>/check-availability/', 
         views.PropertyAvailabilityCheckView.as_view(), 
         name='property-availability-check'),
    path('properties/<int:pk>/calendar/', 
         views.PropertyMonthlyCalendarView.as_view(), 
         name='property-calendar'),
    
    # === BOOKINGS ===
    path('bookings/', views.BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', views.MyBookingsView.as_view(), name='my-bookings'),
    path('bookings/<int:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    
    # === HOST BOOKINGS ===
    path('host/bookings/', views.HostBookingsView.as_view(), name='host-bookings'),
    path('host/bookings/<int:pk>/confirm/', 
         views.ConfirmBookingView.as_view(), 
         name='confirm-booking'),
    
    # === PAYMENTS ===
    path('bookings/<int:pk>/payments/', 
         views.BookingPaymentsView.as_view(), 
         name='booking-payments'),
    path('payments/<int:pk>/mark-paid/', 
         views.MarkPaymentPaidView.as_view(), 
         name='mark-payment-paid'),
    
    # === REVIEWS ===
    path('properties/<int:pk>/reviews/', 
         views.PropertyReviewsView.as_view(), 
         name='property-reviews'),
    path('bookings/<int:booking_id>/review/', 
         views.CreateReviewView.as_view(), 
         name='create-review'),
    path('reviews/<int:pk>/respond/', 
         views.HostRespondToReviewView.as_view(), 
         name='host-respond-review'),
    
    # === DASHBOARDS ===
    path('dashboard/host/', views.HostDashboardView.as_view(), name='host-dashboard'),
    path('dashboard/tenant/', views.TenantDashboardView.as_view(), name='tenant-dashboard'),
]
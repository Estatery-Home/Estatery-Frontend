# properties/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # === CUSTOMER / PUBLIC CATALOG ===
    path('customer/properties/', views.CustomerPropertyListView.as_view(), name='customer-property-list'),
    path('countries/', views.CountryListView.as_view(), name='country-list'),
    path('discounts/validate/', views.PromoCodeValidateView.as_view(), name='discount-validate'),
    path('admin/discounts/', views.AdminPromoCodeListCreateView.as_view(), name='admin-discount-list'),
    path('admin/discounts/<int:pk>/', views.AdminPromoCodeDetailView.as_view(), name='admin-discount-detail'),
    path('admin/bookings/', views.AdminAllBookingsListView.as_view(), name='admin-bookings-list'),
    path('admin/calendar/', views.AdminCalendarView.as_view(), name='admin-calendar'),
    # === PROPERTIES ===
    path('properties/', views.PropertyListView.as_view(), name='property-list'),
    path('properties/<int:pk>/', views.PropertyDetailView.as_view(), name='property-detail'),
    path('properties/my/', views.MyPropertiesView.as_view(), name='my-properties'),
    path('currencies/', views.CurrencyChoicesView.as_view(), name='currency-choices'),
    path('languages/', views.LanguageListView.as_view(), name='language-list'),
    path('timezones/', views.TimeZoneListView.as_view(), name='timezone-list'),
    
    # === AVAILABILITY ===
    path(
        'properties/<int:pk>/discounts/',
        views.PropertyActiveDiscountsView.as_view(),
        name='property-active-discounts',
    ),
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
    path('bookings/<int:pk>/reschedule/', views.BookingRescheduleView.as_view(), name='booking-reschedule'),
    
    # === HOST BOOKINGS ===
    path('host/bookings/', views.HostBookingsView.as_view(), name='host-bookings'),
    path('host/bookings/<int:pk>/confirm/', 
         views.ConfirmBookingView.as_view(), 
         name='confirm-booking'),
    path('host/clients/', views.HostClientsListView.as_view(), name='host-clients-list'),
    path('host/clients/<int:user_id>/', views.HostClientDetailView.as_view(), name='host-client-detail'),
    path('host/analytics/', views.HostAnalyticsView.as_view(), name='host-analytics'),
    path('host/calendar/', views.HostCalendarView.as_view(), name='host-calendar'),
    path('host/payments/', views.HostPaymentsListView.as_view(), name='host-payments-list'),
    
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
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
<<<<<<< HEAD
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path(
        'password-reset/request/',
        views.PasswordResetRequestView.as_view(),
        name='password_reset_request',
    ),
    path(
        'password-reset/verify-otp/',
        views.PasswordResetVerifyOtpView.as_view(),
        name='password_reset_verify_otp',
    ),
    path(
        'password-reset/confirm/',
        views.PasswordResetConfirmView.as_view(),
        name='password_reset_confirm',
    ),
    path('otp/request/', views.OtpRequestView.as_view(), name='otp_request'),
    path('otp/verify/', views.OtpVerifyView.as_view(), name='otp_verify'),
=======
    path('token/refresh/', views.TokenRefreshView.as_view(), name='token_refresh'),
>>>>>>> 298f14e1aa86aee20ab5073700c7bca94129b45b
]

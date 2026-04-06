from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import authenticate, login, logout
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from drf_spectacular.utils import extend_schema, inline_serializer

from .models import CustomUser, OtpChallenge
from . import otp as otp_service
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifyOtpSerializer,
    PasswordResetConfirmSerializer,
    OtpRequestSerializer,
    OtpVerifySerializer,
)

PASSWORD_RESET_SIGNER_SALT = "users.password-reset"
RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60


def _purpose_from_api(value: str) -> str:
    if value == "password_reset":
        return OtpChallenge.Purpose.PASSWORD_RESET
    return OtpChallenge.Purpose.VERIFY_EMAIL


def _sign_password_reset(user_id: int) -> str:
    return TimestampSigner(salt=PASSWORD_RESET_SIGNER_SALT).sign(str(user_id))


def _unsign_password_reset(token: str) -> int | None:
    signer = TimestampSigner(salt=PASSWORD_RESET_SIGNER_SALT)
    try:
        return int(signer.unsign(token, max_age=RESET_TOKEN_MAX_AGE_SECONDS))
    except (BadSignature, SignatureExpired, ValueError):
        return None


def _ensure_verified_for_password_reset(email: str) -> Response | None:
    """Block password-reset OTP when the account exists but email is not verified."""
    email_norm = email.strip().lower()
    user = CustomUser.objects.filter(email__iexact=email_norm).first()
    if user is not None and not user.email_verified:
        return Response(
            {
                "detail": "Please verify your email address before resetting your password.",
                "code": "email_not_verified",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    return None


AuthTokenOut = inline_serializer(
    name='AuthTokenResponse',
    fields={
        'user': UserSerializer(),
        'refresh': drf_serializers.CharField(),
        'access': drf_serializers.CharField(),
        'message': drf_serializers.CharField(),
    },
)

LogoutOut = inline_serializer(
    name='LogoutResponse',
    fields={'message': drf_serializers.CharField()},
)

GenericMessageOut = inline_serializer(
    name='GenericAuthMessage',
    fields={'message': drf_serializers.CharField()},
)

PasswordResetVerifyOut = inline_serializer(
    name='PasswordResetVerifyResponse',
    fields={
        'reset_token': drf_serializers.CharField(),
        'message': drf_serializers.CharField(),
    },
)

AuthErrorDetailOut = inline_serializer(
    name='AuthErrorDetail',
    fields={'detail': drf_serializers.CharField()},
)

OtpVerifySuccessOut = inline_serializer(
    name='OtpVerifySuccess',
    fields={
        'verified': drf_serializers.BooleanField(),
        'reset_token': drf_serializers.CharField(required=False, allow_null=True),
    },
)

OtpVerifyFailureOut = inline_serializer(
    name='OtpVerifyFailure',
    fields={
        'detail': drf_serializers.CharField(),
        'verified': drf_serializers.BooleanField(),
    },
)

@extend_schema(
    tags=['Auth'],
    summary='Register',
    responses={201: AuthTokenOut},
)
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    # Create a new user and return JWT tokens
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        otp_result = otp_service.issue_otp(
            email=user.email,
            purpose=OtpChallenge.Purpose.VERIFY_EMAIL,
        )

        # Create JWT tokens for the user
        refresh = RefreshToken.for_user(user)

        if otp_result == "send_failed":
            msg = (
                "User created successfully, but the verification email could not be sent. "
                "Try requesting a new code from account settings once email is configured."
            )
        else:
            msg = "User created successfully. A verification code was sent to your email."

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': msg,
        }, status=status.HTTP_201_CREATED)

@extend_schema(
    tags=['Auth'],
    summary='Login',
    request=LoginSerializer,
    responses={200: AuthTokenOut},
)
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            
            # Create JWT tokens for the user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Login successful'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(
    tags=['Auth'],
    summary='Logout',
    request=None,
    responses={200: LogoutOut},
)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

@extend_schema(
    tags=['Auth'],
    summary='Refresh JWT access token',
    request=TokenRefreshSerializer,
    responses={200: inline_serializer(
        name='TokenRefreshResponse',
        fields={
            'access': drf_serializers.CharField(),
            'refresh': drf_serializers.CharField(required=False),
        },
    )},
)
class TokenRefreshView(JWTTokenRefreshView):
    pass


@extend_schema(tags=['Auth'], summary='Profile')
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return CustomUser.objects.prefetch_related(
            'bookings',
            'properties',
        ).get(id=self.request.user.id)


@extend_schema(
    tags=['Auth'],
    summary='Request password reset (send OTP)',
    request=PasswordResetRequestSerializer,
    responses={200: GenericMessageOut, 400: AuthErrorDetailOut},
)
class PasswordResetRequestView(APIView):
    """Send a one-time code to the user's email (if an account exists and email is verified)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        blocked = _ensure_verified_for_password_reset(email)
        if blocked is not None:
            return blocked
        otp_result = otp_service.issue_otp(
            email=email,
            purpose=OtpChallenge.Purpose.PASSWORD_RESET,
        )
        if otp_result == "send_failed":
            return Response(
                {
                    "detail": "Could not send email. Check server email settings and try again.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "message": "If an account exists for this email, a verification code was sent.",
            }
        )


@extend_schema(
    tags=['Auth'],
    summary='Verify password-reset OTP',
    request=PasswordResetVerifyOtpSerializer,
    responses={
        200: PasswordResetVerifyOut,
        400: AuthErrorDetailOut,
    },
)
class PasswordResetVerifyOtpView(APIView):
    """Exchange email + OTP for a short-lived signed reset_token."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ok, user = otp_service.verify_otp(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["otp"],
            purpose=OtpChallenge.Purpose.PASSWORD_RESET,
        )
        if not ok or user is None:
            return Response(
                {"detail": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "reset_token": _sign_password_reset(user.pk),
                "message": "Verification successful. Submit a new password with this token.",
            }
        )


@extend_schema(
    tags=['Auth'],
    summary='Confirm password reset (set new password)',
    request=PasswordResetConfirmSerializer,
    responses={
        200: GenericMessageOut,
        400: AuthErrorDetailOut,
    },
)
class PasswordResetConfirmView(APIView):
    """Set a new password using reset_token from verify-otp."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = _unsign_password_reset(serializer.validated_data["reset_token"])
        if uid is None:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = CustomUser.objects.filter(pk=uid).first()
        if user is None:
            return Response(
                {"detail": "Invalid or expired reset token."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response(
            {"message": "Password has been reset. You can sign in with your new password."}
        )


@extend_schema(
    tags=['Auth'],
    summary='Request OTP (password_reset or verify_email)',
    request=OtpRequestSerializer,
    responses={200: GenericMessageOut},
)
class OtpRequestView(APIView):
    """Request an OTP for password_reset or verify_email (requires existing account)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        purpose = _purpose_from_api(serializer.validated_data["purpose"])
        email = serializer.validated_data["email"]
        if purpose == OtpChallenge.Purpose.PASSWORD_RESET:
            blocked = _ensure_verified_for_password_reset(email)
            if blocked is not None:
                return blocked
        otp_result = otp_service.issue_otp(
            email=email,
            purpose=purpose,
        )
        if otp_result == "send_failed":
            return Response(
                {
                    "detail": "Could not send email. Check server email settings and try again.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {"message": "If this email is eligible, a verification code was sent."}
        )


@extend_schema(
    tags=['Auth'],
    summary='Verify OTP (includes reset_token when purpose is password_reset)',
    request=OtpVerifySerializer,
    responses={
        200: OtpVerifySuccessOut,
        400: OtpVerifyFailureOut,
    },
)
class OtpVerifyView(APIView):
    """Verify an OTP. For password_reset, returns reset_token (same flow as dedicated verify endpoint)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        purpose = _purpose_from_api(serializer.validated_data["purpose"])
        ok, user = otp_service.verify_otp(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["otp"],
            purpose=purpose,
        )
        if not ok:
            return Response(
                {"detail": "Invalid or expired verification code.", "verified": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        body: dict = {"verified": True}
        if purpose == OtpChallenge.Purpose.PASSWORD_RESET and user is not None:
            body["reset_token"] = _sign_password_reset(user.pk)
        return Response(body)
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, login, logout
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

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

# Registeration for a new user
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    # Create a new user and return JWT tokens
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create JWT tokens for the user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

# Login for a user
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

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

# Get and update user profile
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return CustomUser.objects.prefetch_related(
            'bookings',
            'properties',
        ).get(id=self.request.user.id)


class PasswordResetRequestView(APIView):
    """Send a one-time code to the user's email (if an account exists)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_service.issue_otp(
            email=serializer.validated_data["email"],
            purpose=OtpChallenge.Purpose.PASSWORD_RESET,
        )
        return Response(
            {
                "message": "If an account exists for this email, a verification code was sent.",
            }
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


class OtpRequestView(APIView):
    """Request an OTP for password_reset or verify_email (requires existing account)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        otp_service.issue_otp(
            email=serializer.validated_data["email"],
            purpose=_purpose_from_api(serializer.validated_data["purpose"]),
        )
        return Response(
            {"message": "If this email is eligible, a verification code was sent."}
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
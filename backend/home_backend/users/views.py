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
    if value == "verify_email":
        return OtpChallenge.Purpose.VERIFY_EMAIL
    raise ValueError("Invalid purpose")


def _sign_password_reset(user_id: int) -> str:
    signer = TimestampSigner(salt=PASSWORD_RESET_SIGNER_SALT)
    return signer.sign(str(user_id))


def _unsign_password_reset(token: str) -> int | None:
    signer = TimestampSigner(salt=PASSWORD_RESET_SIGNER_SALT)
    try:
        uid = signer.unsign(token, max_age=RESET_TOKEN_MAX_AGE_SECONDS)
        return int(uid)
    except (BadSignature, SignatureExpired, ValueError):
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
        
        # Create JWT tokens for the user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User created successfully'
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


GenericMessageOut = inline_serializer(
    name='GenericAuthMessage',
    fields={'message': drf_serializers.CharField()},
)

PasswordResetVerifyOut = inline_serializer(
    name='PasswordResetVerifyResponse',
    fields={
        'reset_token': drf_serializers.CharField(),
        'message': drf_serializers.CharField(required=False),
    },
)

OtpVerifyOut = inline_serializer(
    name='OtpVerifyResponse',
    fields={
        'verified': drf_serializers.BooleanField(),
        'reset_token': drf_serializers.CharField(required=False),
    },
)


@extend_schema(
    tags=['Auth'],
    summary='Request password reset OTP',
    request=PasswordResetRequestSerializer,
    responses={200: GenericMessageOut},
)
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        otp_service.issue_otp(email=email, purpose=OtpChallenge.Purpose.PASSWORD_RESET)
        return Response(
            {
                "message": "If an account exists for this email, a verification code was sent.",
            }
        )


@extend_schema(
    tags=['Auth'],
    summary='Verify password reset OTP',
    request=PasswordResetVerifyOtpSerializer,
    responses={200: PasswordResetVerifyOut},
)
class PasswordResetVerifyOtpView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["otp"]
        ok, user = otp_service.verify_otp(
            email=email,
            code=code,
            purpose=OtpChallenge.Purpose.PASSWORD_RESET,
        )
        if not ok or user is None:
            return Response(
                {"detail": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = _sign_password_reset(user.pk)
        return Response(
            {
                "reset_token": token,
                "message": "Verification successful. Submit a new password with this token.",
            }
        )


@extend_schema(
    tags=['Auth'],
    summary='Confirm password reset',
    request=PasswordResetConfirmSerializer,
    responses={200: GenericMessageOut},
)
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_token = serializer.validated_data["reset_token"]
        new_password = serializer.validated_data["new_password"]
        uid = _unsign_password_reset(reset_token)
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
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"message": "Password has been reset. You can sign in with your new password."})


@extend_schema(
    tags=['Auth'],
    summary='Request an OTP (password reset or verify email)',
    request=OtpRequestSerializer,
    responses={200: GenericMessageOut},
)
class OtpRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        purpose = _purpose_from_api(serializer.validated_data["purpose"])
        otp_service.issue_otp(email=email, purpose=purpose)
        return Response(
            {
                "message": "If this email is eligible, a verification code was sent.",
            }
        )


@extend_schema(
    tags=['Auth'],
    summary='Verify an OTP',
    request=OtpVerifySerializer,
    responses={200: OtpVerifyOut},
)
class OtpVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        code = serializer.validated_data["otp"]
        purpose = _purpose_from_api(serializer.validated_data["purpose"])
        ok, user = otp_service.verify_otp(email=email, code=code, purpose=purpose)
        if not ok:
            return Response(
                {"detail": "Invalid or expired verification code.", "verified": False},
                status=status.HTTP_400_BAD_REQUEST,
            )
        out: dict = {"verified": True}
        if purpose == OtpChallenge.Purpose.PASSWORD_RESET and user is not None:
            out["reset_token"] = _sign_password_reset(user.pk)
        return Response(out)
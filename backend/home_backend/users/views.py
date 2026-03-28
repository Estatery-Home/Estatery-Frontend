from rest_framework import generics, permissions, status, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as JWTTokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import authenticate, login, logout
from drf_spectacular.utils import extend_schema, inline_serializer

from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer


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
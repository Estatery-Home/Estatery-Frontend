from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone', 'country', 'avatar', 'user_type']
        read_only_fields = ['id','user_type']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField(required=False, allow_blank=True, default="Ghana")

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'phone', 'country', 'user_type']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            country=validated_data.get('country', 'Ghana'),
            user_type=validated_data.get('user_type', 'customer'),
        )
        return user
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self,data):
        user = authenticate(username=data['username'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")


OTP_CODE_MIN_LEN = 4
OTP_CODE_MAX_LEN = 12


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class OtpCodeField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs.setdefault("min_length", OTP_CODE_MIN_LEN)
        kwargs.setdefault("max_length", OTP_CODE_MAX_LEN)
        super().__init__(**kwargs)


class PasswordResetVerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = OtpCodeField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)


class OtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(
        choices=["password_reset", "verify_email"],
        default="password_reset",
    )


class OtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = OtpCodeField()
    purpose = serializers.ChoiceField(choices=["password_reset", "verify_email"])

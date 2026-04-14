from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate



class UserSerializer(serializers.ModelSerializer):
    """Profile fields for GET/PATCH /api/auth/profile/. Social URLs apply to all properties owned by this user."""

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'avatar',
            'user_type',
            'email_verified',
            'instagram_url',
            'facebook_url',
            'twitter_url',
            'youtube_url',
        ]
        read_only_fields = ['id', 'user_type', 'email_verified']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    phone = serializers.CharField(required=False, allow_blank=True, default="")

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'phone', 'user_type']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
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


class PasswordResetVerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=OTP_CODE_MIN_LEN, max_length=OTP_CODE_MAX_LEN)


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
    otp = serializers.CharField(min_length=OTP_CODE_MIN_LEN, max_length=OTP_CODE_MAX_LEN)
    purpose = serializers.ChoiceField(choices=["password_reset", "verify_email"])

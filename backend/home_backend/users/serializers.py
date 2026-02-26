from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'phone', 'avatar', 'user_type']
        read_only_fields = ['id','user_type']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6) #write_only=True means password appears in request but never in responses
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'phone', 'user_type']    

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            user_type=validated_data['user_type'],      
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
        
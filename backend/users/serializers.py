from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import SellerProfile, User
from core.supabase_storage import create_signed_file_url

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'middle_name',
            'phone',
            'role',
        ]

    def validate_role(self, value):
        if value not in ['buyer', 'seller']:
            raise serializers.ValidationError('При регистрации можно выбрать только buyer или seller.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Пароли не совпадают.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Неверный логин или пароль.')

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'middle_name',
            'phone',
            'role',
            'seller_status',
            'avatar',
            'avatar_url',
        ]

    def get_avatar_url(self, obj):
        if obj.avatar_storage_path:
            return create_signed_file_url(obj.avatar_storage_path, expires_in=3600)

        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        if obj.avatar:
            return obj.avatar.url
        return None

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'middle_name',
            'phone',
            'role',
            'seller_status',
            'is_active',
            'date_joined',
        ]


class SellerModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['seller_status']

    def validate_seller_status(self, value):
        allowed_statuses = ['approved', 'rejected']
        if value not in allowed_statuses:
            raise serializers.ValidationError(
                'Можно установить только approved или rejected.'
            )
        return value


class SellerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    store_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = SellerProfile
        fields = [
            'id',
            'username',
            'email',
            'store_name',
            'store_description',
            'store_avatar',
            'store_avatar_url',
            'created_at',
            'updated_at',
        ]

    def get_store_avatar_url(self, obj):
        if obj.store_avatar_storage_path:
            return create_signed_file_url(obj.store_avatar_storage_path, expires_in=3600)

        request = self.context.get('request')
        if obj.store_avatar and request:
            return request.build_absolute_uri(obj.store_avatar.url)
        if obj.store_avatar:
            return obj.store_avatar.url
        return None


class SellerProfileCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            'store_name',
            'store_description',
            'store_avatar',
        ]


class UserAvatarUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class SellerAvatarUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework import serializers

from .models import PasswordResetCode, SellerProfile, User, UserNotification, UserPreference
from core.object_storage import create_signed_file_url

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


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self):
        email = self.validated_data["email"]
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if not user:
            return None

        PasswordResetCode.objects.filter(user=user, is_used=False).update(is_used=True)

        code = get_random_string(6, allowed_chars="0123456789")
        PasswordResetCode.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timezone.timedelta(minutes=15),
        )

        send_mail(
            subject="Код восстановления пароля Meshio",
            message=(
                "Вы запросили восстановление пароля.\n\n"
                f"Ваш код: {code}\n"
                "Код действует 15 минут.\n\n"
                "Если вы не запрашивали восстановление, просто проигнорируйте это письмо."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        return code


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs["email"], is_active=True).first()
        if not user:
            raise serializers.ValidationError("Код восстановления недействителен.")

        reset_code = PasswordResetCode.objects.filter(
            user=user,
            code=attrs["code"],
            is_used=False,
        ).order_by("-created_at").first()

        if not reset_code or reset_code.is_expired:
            raise serializers.ValidationError("Код восстановления устарел или недействителен.")

        attrs["user"] = user
        attrs["reset_code"] = reset_code
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        reset_code = self.validated_data["reset_code"]
        reset_code.is_used = True
        reset_code.save(update_fields=["is_used"])
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
    preferences = serializers.SerializerMethodField()

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
            'preferences',
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

    def get_preferences(self, obj):
        preferences, _ = UserPreference.objects.get_or_create(user=obj)
        return UserPreferenceSerializer(preferences).data


class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = [
            'sms_notifications',
            'search_preferences',
            'dark_theme',
            'compact_mode',
            'seller_moderation_updates',
            'seller_sales_updates',
            'seller_comments_updates',
            'seller_weekly_digest',
            'seller_auto_submit_to_review',
            'seller_show_store_contacts',
            'seller_compact_model_cards',
            'seller_allow_profile_indexing',
            'updated_at',
        ]
        read_only_fields = ['updated_at']


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = [
            'id',
            'kind',
            'title',
            'message',
            'link',
            'is_read',
            'created_at',
        ]

class AdminUserSerializer(serializers.ModelSerializer):
    seller_profile = serializers.SerializerMethodField()

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
            'seller_profile',
        ]

    def get_seller_profile(self, obj):
        profile = SellerProfile.objects.filter(user=obj).first()

        if not profile:
            return None

        return {
            'store_name': profile.store_name,
            'store_description': profile.store_description,
            'store_avatar_url': (
                create_signed_file_url(profile.store_avatar_storage_path, expires_in=3600)
                if profile.store_avatar_storage_path
                else None
            ),
        }

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
    store_banner_url = serializers.SerializerMethodField()

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
            'store_banner',
            'store_banner_url',
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

    def get_store_banner_url(self, obj):
        if obj.store_banner_storage_path:
            return create_signed_file_url(obj.store_banner_storage_path, expires_in=3600)

        request = self.context.get('request')
        if obj.store_banner and request:
            return request.build_absolute_uri(obj.store_banner.url)
        if obj.store_banner:
            return obj.store_banner.url
        return None


class SellerProfileCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = [
            'store_name',
            'store_description',
            'store_avatar',
            'store_banner',
        ]


class UserAvatarUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class SellerAvatarUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class SellerBannerUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "middle_name",
            "phone",
        ]

    def validate_username(self, value):
        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("Этот никнейм уже занят.")
        return value

    def validate_email(self, value):
        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Этот email уже занят.")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Старый пароль неверный.")
        return value

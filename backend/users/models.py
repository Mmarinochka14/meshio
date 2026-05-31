from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('buyer', 'Buyer'),
        ('seller', 'Seller'),
        ('admin', 'Admin'),
    ]

    SELLER_STATUS_CHOICES = [
        ('not_requested', 'Not Requested'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    username = models.CharField(max_length=150, unique=True, verbose_name='Никнейм')
    email = models.EmailField(unique=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    middle_name = models.CharField(max_length=150, blank=True, null=True, verbose_name='Отчество')

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='buyer',
        verbose_name='Роль'
    )

    seller_status = models.CharField(
        max_length=20,
        choices=SELLER_STATUS_CHOICES,
        default='not_requested',
        verbose_name='Статус продавца'
    )

    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')
    avatar_storage_path = models.CharField(max_length=500, blank=True, null=True,
                                           verbose_name='Путь аватара в Object Storage')

    def save(self, *args, **kwargs):
        if self.role == 'seller' and self.seller_status == 'not_requested':
            self.seller_status = 'pending'

        if self.role == 'buyer':
            self.seller_status = 'not_requested'

        if self.role == 'admin':
            self.seller_status = 'approved'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


class SellerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='seller_profile',
        verbose_name='Продавец'
    )
    store_name = models.CharField(max_length=255, unique=True, verbose_name='Название магазина')
    store_description = models.TextField(blank=True, null=True, verbose_name='Описание магазина')
    store_avatar = models.ImageField(upload_to='stores/avatars/', blank=True, null=True, verbose_name='Аватар магазина')
    store_avatar_storage_path = models.CharField(max_length=500, blank=True, null=True,
                                                 verbose_name='Путь аватара магазина в Object Storage')
    store_banner = models.ImageField(upload_to='stores/banners/', blank=True, null=True, verbose_name='Баннер магазина')
    store_banner_storage_path = models.CharField(max_length=500, blank=True, null=True,
                                                 verbose_name='Путь баннера магазина в Object Storage')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Профиль продавца'
        verbose_name_plural = 'Профили продавцов'
        ordering = ['store_name']

    def __str__(self):
        return self.store_name


class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_codes',
        verbose_name='Пользователь'
    )
    code = models.CharField(max_length=6, verbose_name='Код')
    is_used = models.BooleanField(default=False, verbose_name='Использован')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    expires_at = models.DateTimeField(verbose_name='Истекает')

    class Meta:
        verbose_name = 'Код восстановления пароля'
        verbose_name_plural = 'Коды восстановления пароля'
        ordering = ['-created_at']

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f'{self.user.username} - {self.code}'


class UserPreference(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences',
        verbose_name='Пользователь'
    )

    sms_notifications = models.BooleanField(default=True, verbose_name='СМС-уведомления')
    search_preferences = models.BooleanField(default=False, verbose_name='Учитывать предпочтения в поиске')
    dark_theme = models.BooleanField(default=True, verbose_name='Тёмная тема')
    compact_mode = models.BooleanField(default=False, verbose_name='Компактный режим')

    seller_moderation_updates = models.BooleanField(default=True, verbose_name='Уведомления о модерации')
    seller_sales_updates = models.BooleanField(default=True, verbose_name='Уведомления о продажах')
    seller_comments_updates = models.BooleanField(default=True, verbose_name='Уведомления о комментариях')
    seller_weekly_digest = models.BooleanField(default=False, verbose_name='Еженедельная сводка')
    seller_auto_submit_to_review = models.BooleanField(default=False, verbose_name='Автоотправка на модерацию')
    seller_show_store_contacts = models.BooleanField(default=True, verbose_name='Показывать контакты магазина')
    seller_compact_model_cards = models.BooleanField(default=False, verbose_name='Компактные карточки моделей')
    seller_allow_profile_indexing = models.BooleanField(default=True, verbose_name='Публичная индексация витрины')

    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Настройки пользователя'
        verbose_name_plural = 'Настройки пользователей'

    def __str__(self):
        return f'Настройки {self.user.username}'


class UserNotification(models.Model):
    KIND_CHOICES = [
        ('system', 'System'),
        ('seller_status', 'Seller Status'),
        ('product_moderation', 'Product Moderation'),
        ('sale', 'Sale'),
        ('support', 'Support'),
        ('comment', 'Comment'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Пользователь'
    )
    kind = models.CharField(max_length=40, choices=KIND_CHOICES, default='system', verbose_name='Тип')
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    message = models.TextField(blank=True, default='', verbose_name='Сообщение')
    link = models.CharField(max_length=500, blank=True, default='', verbose_name='Ссылка')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.title}'




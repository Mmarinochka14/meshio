from django.contrib.auth.models import AbstractUser
from django.db import models


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
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Профиль продавца'
        verbose_name_plural = 'Профили продавцов'
        ordering = ['store_name']

    def __str__(self):
        return self.store_name




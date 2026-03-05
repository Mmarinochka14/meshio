from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import SellerProfile, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = (
        'id',
        'username',
        'email',
        'role',
        'seller_status',
        'is_staff',
        'is_active',
    )
    list_filter = ('role', 'seller_status', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = UserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('phone', 'middle_name', 'role', 'seller_status', 'avatar')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Дополнительная информация', {
            'fields': ('email', 'phone', 'middle_name', 'role', 'seller_status', 'avatar')
        }),
    )


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'store_name', 'user', 'created_at')
    search_fields = ('store_name', 'user__username', 'user__email')
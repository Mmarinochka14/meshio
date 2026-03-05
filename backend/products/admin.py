from django.contrib import admin

from .models import Category, Comment, Favorite, License, Order, OrderItem, Product, ProductFile, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(License)
class LicenseAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'commercial_use_allowed',
        'resale_allowed',
        'modification_allowed',
        'attribution_required',
    )
    search_fields = ('name',)


class ProductFileInline(admin.TabularInline):
    model = ProductFile
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'seller',
        'category',
        'price',
        'status',
        'model_format',
        'poly_style',
        'created_at',
    )
    list_filter = ('status', 'model_format', 'poly_style', 'has_uv', 'has_textures', 'has_rigging', 'category')
    search_fields = ('title', 'description')
    inlines = [ProductFileInline]


@admin.register(ProductFile)
class ProductFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'file_type', 'is_primary', 'created_at')
    list_filter = ('file_type', 'is_primary')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'total_price', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('buyer__username',)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'price_at_purchase', 'created_at')
    search_fields = ('order__buyer__username', 'product__title')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'created_at')
    search_fields = ('user__username', 'product__title')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('user__username', 'product__title', 'text')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'created_at')
    search_fields = ('user__username', 'product__title', 'text')
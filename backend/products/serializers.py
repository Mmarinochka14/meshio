from rest_framework import serializers

from .models import Category, Comment, Favorite, License, Order, OrderItem, Product, ProductFile, Review
from core.supabase_storage import create_signed_file_url

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = [
            'id',
            'name',
            'description',
            'commercial_use_allowed',
            'resale_allowed',
            'modification_allowed',
            'attribution_required',
        ]


class ProductFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductFile
        fields = [
            'id',
            'file_type',
            'file',
            'file_url',
            'original_name',
            'mime_type',
            'size',
            'is_primary',
            'created_at',
        ]

    def get_file_url(self, obj):
        if obj.storage_path:
            return None

        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    category = CategorySerializer(read_only=True)
    license = LicenseSerializer(read_only=True)
    main_preview_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'title',
            'price',
            'status',
            'model_format',
            'poly_style',
            'average_rating',
            'reviews_count',
            'views_count',
            'favorites_count',
            'sales_count',
            'seller_username',
            'category',
            'license',
            'main_preview',
            'main_preview_url',
            'created_at',
        ]

    def get_main_preview_url(self, obj):
        if obj.main_preview_storage_path:
            return create_signed_file_url(obj.main_preview_storage_path, expires_in=3600)

        request = self.context.get('request')
        if obj.main_preview and request:
            return request.build_absolute_uri(obj.main_preview.url)
        if obj.main_preview:
            return obj.main_preview.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    category = CategorySerializer(read_only=True)
    license = LicenseSerializer(read_only=True)
    files = ProductFileSerializer(many=True, read_only=True)
    main_preview_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'title',
            'description',
            'price',
            'status',
            'moderation_comment',
            'model_format',
            'geometry_type',
            'poly_style',
            'topology_type',
            'polygon_count',
            'has_uv',
            'has_textures',
            'texture_type',
            'has_rigging',
            'average_rating',
            'reviews_count',
            'views_count',
            'favorites_count',
            'sales_count',
            'seller_username',
            'category',
            'license',
            'main_preview',
            'main_preview_url',
            'files',
            'created_at',
            'updated_at',
        ]

    def get_main_preview_url(self, obj):
        if obj.main_preview_storage_path:
            return create_signed_file_url(obj.main_preview_storage_path, expires_in=3600)

        request = self.context.get('request')
        if obj.main_preview and request:
            return request.build_absolute_uri(obj.main_preview.url)
        if obj.main_preview:
            return obj.main_preview.url
        return None


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'license',
            'title',
            'description',
            'price',
            'model_format',
            'geometry_type',
            'poly_style',
            'topology_type',
            'polygon_count',
            'has_uv',
            'has_textures',
            'texture_type',
            'has_rigging',
            'moderation_comment',
            'main_preview',
        ]
        read_only_fields = ['moderation_comment']

    def validate_status(self, value):
        allowed_statuses = ['draft', 'pending_review', 'archived']
        if value not in allowed_statuses:
            raise serializers.ValidationError(
                'Продавец может устанавливать только draft, pending_review или archived.'
            )
        return value

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'price_at_purchase',
            'created_at',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'total_price',
            'status',
            'items',
            'created_at',
        ]


class PurchaseSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()

class ProductModerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['status', 'moderation_comment']

    def validate_status(self, value):
        allowed_statuses = ['published', 'rejected', 'archived']
        if value not in allowed_statuses:
            raise serializers.ValidationError(
                'Администратор может устанавливать только published, rejected или archived.'
            )
        return value



class AdminProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    license_name = serializers.CharField(source='license.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'title',
            'seller_username',
            'category_name',
            'license_name',
            'price',
            'status',
            'moderation_comment',
            'created_at',
            'updated_at',
        ]


class ProductFiltersSerializer(serializers.Serializer):
    categories = CategorySerializer(many=True)
    formats = serializers.ListField(child=serializers.DictField())
    poly_styles = serializers.ListField(child=serializers.DictField())
    geometry_types = serializers.ListField(child=serializers.DictField())
    topology_types = serializers.ListField(child=serializers.DictField())
    sort_options = serializers.ListField(child=serializers.DictField())
    boolean_filters = serializers.ListField(child=serializers.DictField())


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = [
            'id',
            'product',
            'created_at',
        ]


class FavoriteActionSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()



class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'username',
            'rating',
            'text',
            'created_at',
            'updated_at',
        ]


class ReviewCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'rating',
            'text',
        ]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Оценка должна быть от 1 до 5.')
        return value


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'username',
            'text',
            'created_at',
            'updated_at',
        ]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['text']

    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Комментарий не может быть пустым.')
        return value.strip()


class ProductFileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    file_type = serializers.ChoiceField(choices=ProductFile.FILE_TYPE_CHOICES, default='model')
    is_primary = serializers.BooleanField(default=False)
    replace_existing = serializers.BooleanField(default=False)


class ProductPreviewUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()
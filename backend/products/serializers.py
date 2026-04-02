from rest_framework import serializers

from core.supabase_storage import create_signed_file_url
from .models import (
    Category,
    Comment,
    Favorite,
    GeneratedTexture,
    License,
    MaterialPreset,
    Order,
    OrderItem,
    Product,
    ProductFile,
    Review,
)


def build_public_file_url(obj, request=None, storage_attr='storage_path', file_attr='file'):
    storage_path = getattr(obj, storage_attr, None)
    django_file = getattr(obj, file_attr, None)

    if storage_path:
        return create_signed_file_url(storage_path, expires_in=3600)

    if django_file and request:
        return request.build_absolute_uri(django_file.url)

    if django_file:
        return django_file.url

    return None


def get_first_product_file(product, file_types, primary_first=True):
    qs = product.files.filter(file_type__in=file_types)

    if primary_first:
        file_obj = qs.filter(is_primary=True).order_by('sort_order', '-created_at').first()
        if file_obj:
            return file_obj

    return qs.order_by('sort_order', '-created_at').first()


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
            'preset_slug',
            'generated_from_prompt',
            'sort_order',
            'created_at',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        return build_public_file_url(obj, request=request)


class MaterialPresetSerializer(serializers.ModelSerializer):
    preview_image_url = serializers.SerializerMethodField()

    class Meta:
        model = MaterialPreset
        fields = [
            'id',
            'name',
            'slug',
            'category',
            'description',
            'preview_image_url',
            'base_color',
            'roughness',
            'metalness',
            'transmission',
            'opacity',
            'emissive_color',
            'basecolor_texture_path',
            'normal_texture_path',
            'roughness_texture_path',
            'metallic_texture_path',
            'opacity_texture_path',
            'emissive_texture_path',
        ]

    def get_preview_image_url(self, obj):
        if obj.preview_image_storage_path:
            return create_signed_file_url(obj.preview_image_storage_path, expires_in=3600)
        return None


class GeneratedTextureSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    preset = MaterialPresetSerializer(read_only=True)

    class Meta:
        model = GeneratedTexture
        fields = [
            'id',
            'preset',
            'prompt',
            'status',
            'image_url',
            'preview_url',
            'width',
            'height',
            'error_message',
            'created_at',
        ]

    def get_image_url(self, obj):
        if obj.image_storage_path:
            return create_signed_file_url(obj.image_storage_path, expires_in=3600)
        return None

    def get_preview_url(self, obj):
        if obj.preview_storage_path:
            return create_signed_file_url(obj.preview_storage_path, expires_in=3600)
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
            'viewer_format',
            'viewer_status',
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
        request = self.context.get('request')

        if obj.main_preview_storage_path:
            return create_signed_file_url(obj.main_preview_storage_path, expires_in=3600)

        if obj.main_preview and request:
            return request.build_absolute_uri(obj.main_preview.url)

        if obj.main_preview:
            return obj.main_preview.url

        preview_file = get_first_product_file(obj, ['preview'])
        if preview_file:
            return build_public_file_url(preview_file, request=request)

        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    category = CategorySerializer(read_only=True)
    license = LicenseSerializer(read_only=True)
    files = ProductFileSerializer(many=True, read_only=True)
    main_preview_url = serializers.SerializerMethodField()
    viewer_url = serializers.SerializerMethodField()
    uv_preview_url = serializers.SerializerMethodField()
    wireframe_preview_url = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    has_purchase = serializers.SerializerMethodField()

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
            'viewer_format',
            'viewer_status',
            'viewer_error',
            'geometry_type',
            'poly_style',
            'topology_type',
            'polygon_count',
            'has_uv',
            'has_textures',
            'texture_type',
            'has_rigging',
            'has_animation',
            'animation_clips_count',
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
            'viewer_url',
            'uv_preview_url',
            'wireframe_preview_url',
            'is_favorite',
            'has_purchase',
            'files',
            'created_at',
            'updated_at',
        ]

    def get_main_preview_url(self, obj):
        request = self.context.get('request')

        if obj.main_preview_storage_path:
            return create_signed_file_url(obj.main_preview_storage_path, expires_in=3600)

        if obj.main_preview and request:
            return request.build_absolute_uri(obj.main_preview.url)

        if obj.main_preview:
            return obj.main_preview.url

        preview_file = get_first_product_file(obj, ['preview'])
        if preview_file:
            return build_public_file_url(preview_file, request=request)

        return None

    def get_viewer_url(self, obj):
        request = self.context.get('request')
        viewer_file = get_first_product_file(obj, ['viewer_model'], primary_first=True)

        if not viewer_file:
            viewer_file = get_first_product_file(obj, ['model_source', 'model'], primary_first=True)

        if not viewer_file:
            return None

        return build_public_file_url(viewer_file, request=request)

    def get_uv_preview_url(self, obj):
        request = self.context.get('request')
        uv_file = get_first_product_file(obj, ['uv_preview'], primary_first=True)

        if not uv_file:
            return None

        return build_public_file_url(uv_file, request=request)

    def get_wireframe_preview_url(self, obj):
        request = self.context.get('request')
        wireframe_file = get_first_product_file(obj, ['wireframe_preview'], primary_first=True)

        if not wireframe_file:
            return None

        return build_public_file_url(wireframe_file, request=request)

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return Favorite.objects.filter(user=request.user, product=obj).exists()

    def get_has_purchase(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'role', None) != 'buyer':
            return False
        return OrderItem.objects.filter(
            order__buyer=request.user,
            order__status='paid',
            product=obj
        ).exists()


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
            'viewer_format',
            'geometry_type',
            'poly_style',
            'topology_type',
            'polygon_count',
            'has_uv',
            'has_textures',
            'texture_type',
            'has_rigging',
            'has_animation',
            'animation_clips_count',
            'viewer_status',
            'viewer_error',
            'moderation_comment',
            'main_preview',
        ]
        read_only_fields = ['moderation_comment']

    def validate_viewer_status(self, value):
        allowed_statuses = ['pending', 'ready', 'failed']
        if value not in allowed_statuses:
            raise serializers.ValidationError('Некорректный статус viewer.')
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
            'viewer_status',
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
    file_type = serializers.ChoiceField(choices=ProductFile.FILE_TYPE_CHOICES, default='model_source')
    is_primary = serializers.BooleanField(default=False)
    replace_existing = serializers.BooleanField(default=False)
    sort_order = serializers.IntegerField(required=False, default=0)


class ProductPreviewUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()
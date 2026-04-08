from pathlib import Path
import time
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .services.viewer_preprocessing import prepare_product_viewer
from django.core.files.base import ContentFile
from products.services.yandex_art import generate_texture_image
from core.object_storage import upload_file_to_storage
from core.object_storage import (
    create_signed_file_url,
    delete_file_from_storage,
    upload_file_to_storage,
)
from users.permissions import IsAdminRole, IsApprovedSeller, IsBuyer
from .models import (
    Category,
    Comment,
    Favorite,
    MaterialPreset,
    Order,
    OrderItem,
    Product,
    ProductFile,
    Review,
    GeneratedTexture,
    ContactRequest,
    NewsletterSubscription,
    Cart,
    CartItem,
)
from .permissions import CanModifyProductByStatus, IsOwnerOrReadOnly
from .serializers import (
    AdminProductSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    FavoriteActionSerializer,
    FavoriteSerializer,
    MaterialPresetSerializer,
    OrderItemSerializer,
    ProductCreateUpdateSerializer,
    ProductDetailSerializer,
    ProductFileUploadSerializer,
    ProductFiltersSerializer,
    ProductListSerializer,
    ProductModerationSerializer,
    ProductPreviewUploadSerializer,
    PurchaseSerializer,
    ReviewCreateUpdateSerializer,
    ReviewSerializer,
    GenerateTextureSerializer,
    ContactRequestCreateSerializer,
    ContactRequestSerializer,
    NewsletterSubscribeSerializer,
    CartActionSerializer,
    CartMergeSerializer,
    CartSerializer,
    ProductIdsSerializer,
)

from .services.unisender import (
    UnisenderServiceError,
    subscribe_email_to_unisender,
)

def build_product_file_url(request, product_file):
    if product_file.storage_path:
        return create_signed_file_url(product_file.storage_path, expires_in=3600)

    if product_file.file:
        return request.build_absolute_uri(product_file.file.url)

    return None


def get_product_file(product, file_types, primary_first=True):
    qs = ProductFile.objects.filter(product=product, file_type__in=file_types)

    if primary_first:
        primary = qs.filter(is_primary=True).order_by('sort_order', '-created_at').first()
        if primary:
            return primary

    return qs.order_by('sort_order', '-created_at').first()


def infer_model_format(filename: str) -> str:
    ext = Path(filename).suffix.lower().lstrip('.')
    allowed = {'glb', 'gltf', 'obj', 'fbx', 'blend'}
    return ext if ext in allowed else 'other'


def update_product_rating(product):
    reviews = product.reviews.all()
    reviews_count = reviews.count()

    if reviews_count == 0:
        product.average_rating = 0
        product.reviews_count = 0
    else:
        total = sum(review.rating for review in reviews)
        product.average_rating = round(total / reviews_count, 2)
        product.reviews_count = reviews_count

    product.save(update_fields=['average_rating', 'reviews_count'])


class GenerateTextureView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GenerateTextureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prompt = serializer.validated_data["prompt"]

        generated = GeneratedTexture.objects.create(
            product=product,
            user=request.user,
            prompt=prompt,
            status="pending",
        )

        try:
            image_bytes = generate_texture_image(prompt)

            temp_file = ContentFile(image_bytes, name=f"generated_texture_{generated.id}.png")
            upload_result = upload_file_to_storage(
                temp_file,
                folder=f"products/{product.id}/generated_textures"
            )

            generated.image_storage_path = upload_result["storage_path"]
            generated.preview_storage_path = upload_result["storage_path"]
            generated.width = 1024
            generated.height = 1024
            generated.status = "ready"
            generated.save(
                update_fields=[
                    "image_storage_path",
                    "preview_storage_path",
                    "width",
                    "height",
                    "status",
                ]
            )

            return Response(
                {
                    "detail": "Текстура сгенерирована.",
                    "generated_texture_id": generated.id,
                    "image_url": create_signed_file_url(generated.image_storage_path, expires_in=3600),
                    "preview_url": create_signed_file_url(generated.preview_storage_path, expires_in=3600),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            generated.status = "failed"
            generated.error_message = str(e)
            generated.save(update_fields=["status", "error_message"])

            return Response(
                {"detail": f"Ошибка генерации текстуры: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(status='published').select_related(
            'seller',
            'category',
            'license',
        )

        q = self.request.query_params.get('q')
        category = self.request.query_params.get('category')
        model_format = self.request.query_params.get('model_format')
        geometry_type = self.request.query_params.get('geometry_type')
        poly_style = self.request.query_params.get('poly_style')
        topology_type = self.request.query_params.get('topology_type')
        has_uv = self.request.query_params.get('has_uv')
        has_textures = self.request.query_params.get('has_textures')
        texture_type = self.request.query_params.get('texture_type')
        is_free = self.request.query_params.get('is_free')
        min_polygons = self.request.query_params.get('min_polygons')
        max_polygons = self.request.query_params.get('max_polygons')
        ordering = self.request.query_params.get('ordering')

        if q:
            queryset = queryset.filter(title__icontains=q)

        if category:
            queryset = queryset.filter(category__slug=category)

        if model_format:
            queryset = queryset.filter(model_format=model_format)

        if geometry_type:
            queryset = queryset.filter(geometry_type=geometry_type)

        if poly_style:
            queryset = queryset.filter(poly_style=poly_style)

        if topology_type:
            queryset = queryset.filter(topology_type=topology_type)

        if has_uv is not None:
            if has_uv.lower() == 'true':
                queryset = queryset.filter(has_uv=True)
            elif has_uv.lower() == 'false':
                queryset = queryset.filter(has_uv=False)

        if has_textures is not None:
            if has_textures.lower() == 'true':
                queryset = queryset.filter(has_textures=True)
            elif has_textures.lower() == 'false':
                queryset = queryset.filter(has_textures=False)

        if texture_type:
            queryset = queryset.filter(texture_type__iexact=texture_type)

        if is_free is not None:
            if is_free.lower() == 'true':
                queryset = queryset.filter(price=0)
            elif is_free.lower() == 'false':
                queryset = queryset.filter(price__gt=0)

        if min_polygons:
            try:
                queryset = queryset.filter(polygon_count__gte=int(min_polygons))
            except ValueError:
                pass

        if max_polygons:
            try:
                queryset = queryset.filter(polygon_count__lte=int(max_polygons))
            except ValueError:
                pass

        if ordering == 'price_asc':
            queryset = queryset.order_by('price')
        elif ordering == 'price_desc':
            queryset = queryset.order_by('-price')
        elif ordering == 'rating_asc':
            queryset = queryset.order_by('average_rating')
        elif ordering == 'rating_desc':
            queryset = queryset.order_by('-average_rating')
        elif ordering == 'newest':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')

        return queryset


class ProductFiltersView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by('name')

        formats = [{'value': value, 'label': label} for value, label in Product.FORMAT_CHOICES]
        poly_styles = [{'value': value, 'label': label} for value, label in Product.POLY_STYLE_CHOICES]
        geometry_types = [{'value': value, 'label': label} for value, label in Product.GEOMETRY_CHOICES]
        topology_types = [{'value': value, 'label': label} for value, label in Product.TOPOLOGY_CHOICES]

        sort_options = [
            {'value': 'price_asc', 'label': 'Цена по возрастанию'},
            {'value': 'price_desc', 'label': 'Цена по убыванию'},
            {'value': 'rating_asc', 'label': 'Рейтинг по возрастанию'},
            {'value': 'rating_desc', 'label': 'Рейтинг по убыванию'},
            {'value': 'newest', 'label': 'Сначала новые'},
        ]

        boolean_filters = [
            {'value': 'has_uv', 'label': 'UV-развертка'},
            {'value': 'has_textures', 'label': 'Текстуры'},
            {'value': 'is_free', 'label': 'Бесплатные'},
        ]

        data = {
            'categories': categories,
            'formats': formats,
            'poly_styles': poly_styles,
            'geometry_types': geometry_types,
            'topology_types': topology_types,
            'sort_options': sort_options,
            'boolean_filters': boolean_filters,
        }

        serializer = ProductFiltersSerializer(data)
        return Response(serializer.data)


class MaterialPresetListView(generics.ListAPIView):
    queryset = MaterialPreset.objects.filter(is_active=True).order_by('category', 'name')
    serializer_class = MaterialPresetSerializer
    permission_classes = [permissions.AllowAny]


class MyProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [IsApprovedSeller]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user).select_related(
            'seller',
            'category',
            'license',
        )


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(status='published').select_related(
        'seller',
        'category',
        'license',
    ).prefetch_related('files')
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        t0 = time.perf_counter()

        obj = super().get_object()
        t1 = time.perf_counter()

        Product.objects.filter(pk=obj.pk).update(views_count=obj.views_count + 1)
        t2 = time.perf_counter()

        obj.refresh_from_db()
        t3 = time.perf_counter()

        print("DETAIL get object:", round(t1 - t0, 3))
        print("DETAIL update views:", round(t2 - t1, 3))
        print("DETAIL refresh:", round(t3 - t2, 3))

        return obj


class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsApprovedSeller]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, status='draft', viewer_status='pending')


class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all().select_related('seller', 'category', 'license')
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsApprovedSeller, IsOwnerOrReadOnly, CanModifyProductByStatus]


class ProductDeleteView(generics.DestroyAPIView):
    queryset = Product.objects.all().select_related('seller')
    serializer_class = ProductCreateUpdateSerializer
    permission_classes = [IsApprovedSeller, IsOwnerOrReadOnly, CanModifyProductByStatus]

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()

        try:
            if product.main_preview_storage_path:
                delete_file_from_storage(product.main_preview_storage_path)
        except Exception:
            pass

        if product.main_preview:
            product.main_preview.delete(save=False)

        product_files = ProductFile.objects.filter(product=product)
        for product_file in product_files:
            try:
                if product_file.storage_path:
                    delete_file_from_storage(product_file.storage_path)
            except Exception:
                pass

            if product_file.file:
                product_file.file.delete(save=False)

        product.delete()

        return Response(
            {'detail': 'Товар и все связанные файлы удалены.'},
            status=status.HTTP_200_OK
        )


class ArchiveProductView(APIView):
    permission_classes = [IsApprovedSeller]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if product.status not in ['published', 'draft', 'rejected']:
            return Response(
                {'detail': 'Этот товар нельзя перевести в архив из текущего статуса.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product.status = 'archived'
        product.save(update_fields=['status'])

        return Response(
            {'detail': 'Товар переведён в архив.', 'status': product.status},
            status=status.HTTP_200_OK
        )


class SendProductToReviewView(APIView):
    permission_classes = [IsApprovedSeller]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)

        if product.status not in ['draft', 'rejected', 'archived']:
            return Response(
                {'detail': 'Этот товар нельзя отправить на модерацию из текущего статуса.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        has_model_file = ProductFile.objects.filter(
            product=product,
            file_type__in=['model_source', 'model']
        ).exists()

        if not has_model_file:
            return Response(
                {'detail': 'Нельзя отправить товар на модерацию без файла модели.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not product.title:
            return Response(
                {'detail': 'У товара должно быть название.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        product.status = 'pending_review'
        product.moderation_comment = None
        product.save(update_fields=['status', 'moderation_comment'])

        return Response(
            {'detail': 'Товар отправлен на модерацию.', 'status': product.status},
            status=status.HTTP_200_OK
        )


class UploadProductFileView(APIView):
    permission_classes = [IsApprovedSeller]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        file_type = serializer.validated_data['file_type']
        is_primary = serializer.validated_data['is_primary']
        replace_existing = serializer.validated_data['replace_existing']
        sort_order = serializer.validated_data.get('sort_order', 0)

        existing_primary = None
        if is_primary:
            existing_primary = ProductFile.objects.filter(
                product=product,
                file_type=file_type,
                is_primary=True
            ).first()

        try:
            upload_result = upload_file_to_storage(
                uploaded_file,
                folder=f'products/{product.id}/{file_type}'
            )
        except Exception as e:
            return Response(
                {'detail': f'Ошибка загрузки в storage: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if is_primary and existing_primary:
            if replace_existing:
                try:
                    if existing_primary.storage_path:
                        delete_file_from_storage(existing_primary.storage_path)
                except Exception:
                    pass

                if existing_primary.file:
                    existing_primary.file.delete(save=False)

                existing_primary.delete()
            else:
                existing_primary.is_primary = False
                existing_primary.save(update_fields=['is_primary'])

        product_file = ProductFile.objects.create(
            product=product,
            file_type=file_type,
            storage_path=upload_result['storage_path'],
            original_name=upload_result['original_name'],
            mime_type=upload_result['content_type'],
            size=upload_result['size'],
            is_primary=is_primary,
            sort_order=sort_order,
        )

        update_fields = []

        if file_type == 'model_source':
            detected_format = infer_model_format(upload_result['original_name'])
            product.model_format = detected_format
            product.viewer_status = 'pending'
            product.viewer_error = None
            update_fields.extend(['model_format', 'viewer_status', 'viewer_error'])

        if file_type == 'viewer_model':
            detected_format = infer_model_format(upload_result['original_name'])
            product.viewer_format = detected_format
            product.viewer_status = 'ready'
            product.viewer_error = None
            update_fields.extend(['viewer_format', 'viewer_status', 'viewer_error'])

        if file_type == 'uv_preview' and not product.has_uv:
            product.has_uv = True
            update_fields.append('has_uv')

        if file_type.startswith('texture_') and not product.has_textures:
            product.has_textures = True
            update_fields.append('has_textures')

        if update_fields:
            product.save(update_fields=update_fields)

        # запускаем preprocessing после загрузки исходной модели
        if file_type == 'model_source':
            try:
                prepare_product_viewer(product.id)
            except Exception as e:
                product.viewer_status = 'failed'
                product.viewer_error = str(e)
                product.save(update_fields=['viewer_status', 'viewer_error'])

        return Response(
            {
                'detail': 'Файл загружен в storage.',
                'file_id': product_file.id,
                'storage_path': product_file.storage_path,
                'file_type': product_file.file_type,
                'is_primary': product_file.is_primary,
            },
            status=status.HTTP_201_CREATED
        )

class DeleteProductFileView(APIView):
    permission_classes = [IsApprovedSeller]

    def delete(self, request, pk):
        try:
            product_file = ProductFile.objects.select_related('product').get(
                id=pk,
                product__seller=request.user
            )
        except ProductFile.DoesNotExist:
            return Response({'detail': 'Файл товара не найден.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            if product_file.storage_path:
                delete_file_from_storage(product_file.storage_path)
        except Exception:
            pass

        if product_file.file:
            product_file.file.delete(save=False)

        product_file.delete()

        return Response({'detail': 'Файл товара удалён.'}, status=status.HTTP_200_OK)


class UploadProductPreviewView(APIView):
    permission_classes = [IsApprovedSeller]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductPreviewUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']

        old_storage_path = product.main_preview_storage_path

        try:
            upload_result = upload_file_to_storage(
                uploaded_file,
                folder=f'products/{product.id}/preview'
            )
        except Exception as e:
            return Response(
                {'detail': f'Ошибка загрузки превью в storage: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        product.main_preview_storage_path = upload_result['storage_path']
        product.save(update_fields=['main_preview_storage_path'])

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if product.main_preview:
            product.main_preview.delete(save=False)

        preview_url = create_signed_file_url(product.main_preview_storage_path, expires_in=3600)

        return Response(
            {
                'detail': 'Превью загружено в storage.',
                'main_preview_storage_path': product.main_preview_storage_path,
                'preview_url': preview_url,
            },
            status=status.HTTP_200_OK
        )


class DeleteProductPreviewView(APIView):
    permission_classes = [IsApprovedSeller]

    def delete(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({'detail': 'Товар не найден.'}, status=status.HTTP_404_NOT_FOUND)

        old_storage_path = product.main_preview_storage_path

        try:
            if old_storage_path:
                delete_file_from_storage(old_storage_path)
        except Exception:
            pass

        if product.main_preview:
            product.main_preview.delete(save=False)

        product.main_preview_storage_path = None
        product.save(update_fields=['main_preview_storage_path'])

        return Response({'detail': 'Превью удалено.'}, status=status.HTTP_200_OK)


class ProductModerationView(generics.UpdateAPIView):
    queryset = Product.objects.all().select_related('seller', 'category', 'license')
    serializer_class = ProductModerationSerializer
    permission_classes = [IsAdminRole]


class ModerationQueueView(generics.ListAPIView):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Product.objects.filter(status='pending_review').select_related(
            'seller',
            'category',
            'license',
        ).order_by('created_at')


class AdminAllProductsView(generics.ListAPIView):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return Product.objects.all().select_related(
            'seller',
            'category',
            'license',
        ).order_by('-created_at')


class PurchaseProductView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = PurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']

        try:
            product = Product.objects.get(id=product_id, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.price <= 0:
            return Response(
                {'detail': 'Бесплатный товар не нужно покупать.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        already_purchased = OrderItem.objects.filter(
            order__buyer=request.user,
            product=product,
            order__status='paid'
        ).exists()

        if already_purchased:
            return Response(
                {'detail': 'Этот товар уже куплен.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = Order.objects.create(
            buyer=request.user,
            total_price=product.price,
            status='paid'
        )

        OrderItem.objects.create(
            order=order,
            product=product,
            price_at_purchase=product.price
        )

        product.sales_count += 1
        product.save(update_fields=['sales_count'])

        return Response(
            {'detail': 'Покупка успешно совершена.', 'order_id': order.id},
            status=status.HTTP_201_CREATED
        )


class MyPurchasedProductsView(generics.ListAPIView):
    serializer_class = OrderItemSerializer
    permission_classes = [IsBuyer]

    def get_queryset(self):
        return OrderItem.objects.filter(
            order__buyer=self.request.user,
            order__status='paid'
        ).select_related(
            'product',
            'product__seller',
            'product__category',
            'product__license',
            'order',
        )


class MyFavoritesView(generics.ListAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsBuyer]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            'product',
            'product__seller',
            'product__category',
            'product__license',
        )


class AddFavoriteView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = FavoriteActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']

        try:
            product = Product.objects.get(id=product_id, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            product=product
        )

        if created:
            product.favorites_count += 1
            product.save(update_fields=['favorites_count'])
            return Response(
                {'detail': 'Товар добавлен в избранное.'},
                status=status.HTTP_201_CREATED
            )

        return Response(
            {'detail': 'Товар уже в избранном.'},
            status=status.HTTP_200_OK
        )


class RemoveFavoriteView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = FavoriteActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']

        try:
            favorite = Favorite.objects.get(
                user=request.user,
                product_id=product_id
            )
        except Favorite.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден в избранном.'},
                status=status.HTTP_404_NOT_FOUND
            )

        product = favorite.product
        favorite.delete()

        if product.favorites_count > 0:
            product.favorites_count -= 1
            product.save(update_fields=['favorites_count'])

        return Response(
            {'detail': 'Товар удалён из избранного.'},
            status=status.HTTP_200_OK
        )


class ProductReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Review.objects.filter(
            product_id=self.kwargs['pk'],
            product__status='published'
        ).select_related('user', 'product')


class AddOrUpdateReviewView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        has_purchase = OrderItem.objects.filter(
            order__buyer=request.user,
            order__status='paid',
            product=product
        ).exists()

        if not has_purchase:
            return Response(
                {'detail': 'Оставить отзыв можно только после покупки.'},
                status=status.HTTP_403_FORBIDDEN
            )

        review = Review.objects.filter(user=request.user, product=product).first()

        if review:
            serializer = ReviewCreateUpdateSerializer(review, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            update_product_rating(product)

            return Response(
                {
                    'detail': 'Отзыв обновлён.',
                    'review': ReviewSerializer(review).data,
                },
                status=status.HTTP_200_OK,
            )

        serializer = ReviewCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(user=request.user, product=product)
        update_product_rating(product)

        return Response(
            {
                'detail': 'Отзыв добавлен.',
                'review': ReviewSerializer(review).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProductCommentsView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Comment.objects.filter(
            product_id=self.kwargs['pk'],
            product__status='published'
        ).select_related('user', 'product')


class AddCommentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(user=request.user, product=product)

        return Response(
            {
                'detail': 'Комментарий добавлен.',
                'comment': CommentSerializer(comment).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DeleteCommentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            comment = Comment.objects.get(id=pk, user=request.user)
        except Comment.DoesNotExist:
            return Response({'detail': 'Комментарий не найден.'}, status=status.HTTP_404_NOT_FOUND)

        comment.delete()
        return Response({'detail': 'Комментарий удалён.'}, status=status.HTTP_200_OK)


class ProductDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        product_file = get_product_file(product, ['model_source', 'model'], primary_first=True)

        if not product_file:
            return Response(
                {'detail': 'Файл для скачивания не найден.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.price <= 0:
            download_url = build_product_file_url(request, product_file)

            if not download_url:
                return Response(
                    {'detail': 'Ссылка для скачивания не может быть создана.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            return Response(
                {
                    'detail': 'Скачивание доступно.',
                    'download_url': download_url,
                    'product_id': product.id,
                    'product_title': product.title,
                    'is_free': True,
                },
                status=status.HTTP_200_OK
            )

        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Для скачивания платного товара нужно войти в аккаунт.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if request.user.role != 'buyer':
            return Response(
                {'detail': 'Скачивание платного товара доступно только покупателю.'},
                status=status.HTTP_403_FORBIDDEN
            )

        has_purchase = OrderItem.objects.filter(
            order__buyer=request.user,
            order__status='paid',
            product=product
        ).exists()

        if not has_purchase:
            return Response(
                {'detail': 'Сначала нужно купить этот товар.'},
                status=status.HTTP_403_FORBIDDEN
            )

        download_url = build_product_file_url(request, product_file)

        if not download_url:
            return Response(
                {'detail': 'Ссылка для скачивания не может быть создана.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'detail': 'Скачивание доступно.',
                'download_url': download_url,
                'product_id': product.id,
                'product_title': product.title,
                'is_free': False,
            },
            status=status.HTTP_200_OK
        )


class ProductViewerUrlView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        product_file = get_product_file(product, ['viewer_model'], primary_first=True)

        if not product_file:
            return Response(
                {'detail': 'Viewer-модель ещё не подготовлена.'},
                status=status.HTTP_404_NOT_FOUND
            )

        viewer_url = build_product_file_url(request, product_file)

        if not viewer_url:
            return Response(
                {'detail': 'Ссылка для просмотра не может быть создана.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'product_id': product.id,
                'product_title': product.title,
                'viewer_url': viewer_url,
                'file_type': product_file.file_type,
                'original_name': product_file.original_name,
                'mime_type': product_file.mime_type,
                'viewer_status': product.viewer_status,
            },
            status=status.HTTP_200_OK
        )


class ProductUVPreviewUrlView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.get(id=pk, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        uv_file = get_product_file(product, ['uv_preview'], primary_first=True)

        if not uv_file:
            return Response(
                {'detail': 'UV-развёртка не найдена.'},
                status=status.HTTP_404_NOT_FOUND
            )

        uv_url = build_product_file_url(request, uv_file)

        if not uv_url:
            return Response(
                {'detail': 'Ссылка на UV-развёртку не может быть создана.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'product_id': product.id,
                'product_title': product.title,
                'uv_preview_url': uv_url,
                'file_type': uv_file.file_type,
                'original_name': uv_file.original_name,
                'mime_type': uv_file.mime_type,
            },
            status=status.HTTP_200_OK
        )


class ContactRequestCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        contact_request = serializer.save(
            user=request.user if request.user.is_authenticated else None
        )

        return Response(
            {
                'detail': 'Обращение успешно отправлено.',
                'contact_request': ContactRequestSerializer(contact_request).data,
            },
            status=status.HTTP_201_CREATED,
        )


class NewsletterSubscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        subscription, created = NewsletterSubscription.objects.get_or_create(
            email=email,
            defaults={
                'user': request.user if request.user.is_authenticated else None,
                'source': 'contacts_page',
                'status': 'pending',
            }
        )

        if not created:
            update_fields = ['status', 'error_message', 'updated_at']

            if request.user.is_authenticated and subscription.user is None:
                subscription.user = request.user
                update_fields.append('user')

            subscription.status = 'pending'
            subscription.error_message = None
            subscription.save(update_fields=update_fields)

        try:
            result = subscribe_email_to_unisender(email)

            subscription.status = 'pending'
            subscription.unisender_result = result
            subscription.error_message = None
            subscription.save(
                update_fields=[
                    'status',
                    'unisender_result',
                    'error_message',
                    'updated_at',
                ]
            )

            return Response(
                {
                    'detail': 'Подтвердите подписку через письмо, отправленное на указанный email.',
                    'subscription_id': subscription.id,
                    'status': subscription.status,
                },
                status=status.HTTP_200_OK,
            )

        except UnisenderServiceError as e:
            subscription.status = 'failed'
            subscription.error_message = str(e)
            subscription.save(update_fields=['status', 'error_message', 'updated_at'])

            return Response(
                {
                    'detail': f'Не удалось оформить подписку: {str(e)}',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )



class MyCartView(APIView):
    permission_classes = [IsBuyer]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartCountView(APIView):
    permission_classes = [IsBuyer]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(
            {'count': cart.items.count()},
            status=status.HTTP_200_OK,
        )


class AddToCartView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = CartActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']

        try:
            product = Product.objects.get(id=product_id, status='published')
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Товар не найден или не опубликован.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if product.price <= 0:
            return Response(
                {'detail': 'Бесплатный товар не нужно добавлять в корзину.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
        )

        if created:
            return Response(
                {'detail': 'Товар добавлен в корзину.'},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {'detail': 'Товар уже находится в корзине.'},
            status=status.HTTP_200_OK,
        )


class RemoveFromCartView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = CartActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']

        try:
            cart = Cart.objects.get(user=request.user)
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except (Cart.DoesNotExist, CartItem.DoesNotExist):
            return Response(
                {'detail': 'Товар не найден в корзине.'},
                status=status.HTTP_404_NOT_FOUND
            )

        cart_item.delete()

        return Response(
            {'detail': 'Товар удалён из корзины.'},
            status=status.HTTP_200_OK,
        )


class MergeCartView(APIView):
    permission_classes = [IsBuyer]

    def post(self, request):
        serializer = CartMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data['product_ids']
        cart, _ = Cart.objects.get_or_create(user=request.user)

        added_count = 0

        products = Product.objects.filter(
            id__in=product_ids,
            status='published',
            price__gt=0,
        )

        existing_ids = set(
            cart.items.filter(product_id__in=product_ids).values_list('product_id', flat=True)
        )

        for product in products:
            if product.id in existing_ids:
                continue
            CartItem.objects.create(cart=cart, product=product)
            added_count += 1

        response_serializer = CartSerializer(cart, context={'request': request})

        return Response(
            {
                'detail': 'Корзина синхронизирована.',
                'added_count': added_count,
                'cart': response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ProductsByIdsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ProductIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_ids = serializer.validated_data['product_ids']

        queryset = Product.objects.filter(
            id__in=product_ids,
            status='published',
        ).select_related(
            'seller',
            'category',
            'license',
        )

        products_by_id = {product.id: product for product in queryset}
        ordered_products = [
            products_by_id[product_id]
            for product_id in product_ids
            if product_id in products_by_id
        ]

        response_serializer = ProductListSerializer(
            ordered_products,
            many=True,
            context={'request': request},
        )

        return Response(
            {'results': response_serializer.data},
            status=status.HTTP_200_OK,
        )
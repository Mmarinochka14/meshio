from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Название')
    slug = models.SlugField(max_length=120, unique=True, verbose_name='Слаг')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['name']

    def __str__(self):
        return self.name


class License(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Название лицензии')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    commercial_use_allowed = models.BooleanField(default=False, verbose_name='Коммерческое использование')
    resale_allowed = models.BooleanField(default=False, verbose_name='Перепродажа')
    modification_allowed = models.BooleanField(default=True, verbose_name='Изменение')
    attribution_required = models.BooleanField(default=False, verbose_name='Требуется указание автора')

    class Meta:
        verbose_name = 'Лицензия'
        verbose_name_plural = 'Лицензии'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    FORMAT_CHOICES = [
        ('glb', 'GLB'),
        ('gltf', 'GLTF'),
        ('obj', 'OBJ'),
        ('fbx', 'FBX'),
        ('blend', 'BLEND'),
        ('other', 'Other'),
    ]

    GEOMETRY_CHOICES = [
        ('polygonal', 'Polygonal'),
        ('procedural', 'Procedural'),
        ('other', 'Other'),
    ]

    TOPOLOGY_CHOICES = [
        ('quad', 'Quad'),
        ('triangulated', 'Triangulated'),
        ('mixed', 'Mixed'),
        ('other', 'Other'),
    ]

    POLY_STYLE_CHOICES = [
        ('low_poly', 'Low-poly'),
        ('mid_poly', 'Mid-poly'),
        ('high_poly', 'High-poly'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
        ('archived', 'Archived'),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        verbose_name='Продавец'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Категория'
    )
    license = models.ForeignKey(
        License,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Лицензия'
    )

    title = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Цена')

    model_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='glb', verbose_name='Формат')
    geometry_type = models.CharField(max_length=20, choices=GEOMETRY_CHOICES, default='polygonal', verbose_name='Геометрия')
    model_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='glb', verbose_name='Формат')
    geometry_type = models.CharField(max_length=20, choices=GEOMETRY_CHOICES, default='polygonal',
                                     verbose_name='Геометрия')
    poly_style = models.CharField(max_length=20, choices=POLY_STYLE_CHOICES, blank=True, null=True,
                                  verbose_name='Стиль полигональности')
    topology_type = models.CharField(max_length=20, choices=TOPOLOGY_CHOICES, default='quad', verbose_name='Топология')
    topology_type = models.CharField(max_length=20, choices=TOPOLOGY_CHOICES, default='quad', verbose_name='Топология')

    polygon_count = models.PositiveIntegerField(default=0, verbose_name='Количество полигонов')
    has_uv = models.BooleanField(default=False, verbose_name='Есть UV')
    has_textures = models.BooleanField(default=False, verbose_name='Есть текстуры')
    texture_type = models.CharField(max_length=100, blank=True, null=True, verbose_name='Тип текстур')
    has_rigging = models.BooleanField(default=False, verbose_name='Есть риг')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Статус')
    moderation_comment = models.TextField(blank=True, null=True, verbose_name='Комментарий модератора')
    main_preview = models.ImageField(upload_to='products/previews/', blank=True, null=True,
                                     verbose_name='Главное превью')
    main_preview_storage_path = models.CharField(max_length=500, blank=True, null=True,
                                                 verbose_name='Путь превью в Supabase')

    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name='Средний рейтинг')
    reviews_count = models.PositiveIntegerField(default=0, verbose_name='Количество отзывов')
    views_count = models.PositiveIntegerField(default=0, verbose_name='Количество просмотров')
    favorites_count = models.PositiveIntegerField(default=0, verbose_name='Количество избранного')
    sales_count = models.PositiveIntegerField(default=0, verbose_name='Количество продаж')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ProductFile(models.Model):
    FILE_TYPE_CHOICES = [
        ('model', '3D Model'),
        ('texture', 'Texture'),
        ('preview', 'Preview'),
        ('uv_preview', 'UV Preview'),
        ('wireframe_preview', 'Wireframe Preview'),
        ('other', 'Other'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Товар'
    )
    file_type = models.CharField(max_length=30, choices=FILE_TYPE_CHOICES, default='model', verbose_name='Тип файла')
    file = models.FileField(upload_to='products/files/', verbose_name='Файл')

    storage_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Путь в Supabase')
    original_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Исходное имя')
    mime_type = models.CharField(max_length=100, blank=True, null=True, verbose_name='MIME-тип')
    size = models.PositiveIntegerField(default=0, verbose_name='Размер файла в байтах')
    is_primary = models.BooleanField(default=False, verbose_name='Основной файл')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Файл товара'
        verbose_name_plural = 'Файлы товара'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.title} - {self.file_type}'

class Order(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Покупатель'
    )
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Общая сумма')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='paid', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Заказ #{self.id} - {self.buyer.username}'


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Товар'
    )
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена на момент покупки')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Позиция заказа'
        verbose_name_plural = 'Позиции заказа'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order} - {self.product.title}'


class Favorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='Пользователь'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='Товар'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Избранное'
        verbose_name_plural = 'Избранное'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'product'], name='unique_user_favorite')
        ]

    def __str__(self):
        return f'{self.user.username} -> {self.product.title}'


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Пользователь'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Товар'
    )
    rating = models.PositiveSmallIntegerField(verbose_name='Оценка')
    text = models.TextField(blank=True, null=True, verbose_name='Текст отзыва')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'product'], name='unique_user_review')
        ]

    def __str__(self):
        return f'{self.user.username} -> {self.product.title} ({self.rating})'


class Comment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Пользователь'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='Товар'
    )
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} -> {self.product.title}'
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

    VIEWER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
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

    # Исходный формат товара, который загрузил продавец
    model_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='fbx', verbose_name='Формат')

    # Формат browser-view версии
    viewer_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='glb', verbose_name='Формат viewer')

    geometry_type = models.CharField(max_length=20, choices=GEOMETRY_CHOICES, default='polygonal', verbose_name='Геометрия')
    poly_style = models.CharField(
        max_length=20,
        choices=POLY_STYLE_CHOICES,
        blank=True,
        null=True,
        verbose_name='Стиль полигональности'
    )
    topology_type = models.CharField(max_length=20, choices=TOPOLOGY_CHOICES, default='quad', verbose_name='Топология')

    polygon_count = models.PositiveIntegerField(default=0, verbose_name='Количество полигонов')
    has_uv = models.BooleanField(default=False, verbose_name='Есть UV')
    has_textures = models.BooleanField(default=False, verbose_name='Есть текстуры')
    texture_type = models.CharField(max_length=100, blank=True, null=True, verbose_name='Тип текстур')
    has_rigging = models.BooleanField(default=False, verbose_name='Есть риг')

    has_animation = models.BooleanField(default=False, verbose_name='Есть анимация')
    animation_clips_count = models.PositiveIntegerField(default=0, verbose_name='Количество клипов анимации')

    viewer_status = models.CharField(
        max_length=20,
        choices=VIEWER_STATUS_CHOICES,
        default='pending',
        verbose_name='Статус viewer-модели'
    )
    viewer_error = models.TextField(blank=True, null=True, verbose_name='Ошибка подготовки viewer')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Статус')
    moderation_comment = models.TextField(blank=True, null=True, verbose_name='Комментарий модератора')

    # Оставляем для совместимости/переходного периода
    main_preview = models.ImageField(
        upload_to='products/previews/',
        blank=True,
        null=True,
        verbose_name='Главное превью'
    )
    main_preview_storage_path = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Путь превью в Object Storage'
    )

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
        ('model_source', 'Source 3D Model'),
        ('viewer_model', 'Viewer 3D Model'),

        ('preview', 'Preview'),
        ('uv_preview', 'UV Preview'),
        ('wireframe_preview', 'Wireframe Preview'),

        ('texture_basecolor', 'Base Color Texture'),
        ('texture_normal', 'Normal Texture'),
        ('texture_roughness', 'Roughness Texture'),
        ('texture_metallic', 'Metallic Texture'),
        ('texture_opacity', 'Opacity Texture'),
        ('texture_emissive', 'Emissive Texture'),

        ('generated_texture', 'Generated Texture'),
        ('download_bundle', 'Download Bundle'),

        # legacy fallback
        ('model', 'Legacy 3D Model'),
        ('texture', 'Legacy Texture'),
        ('other', 'Other'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='files',
        verbose_name='Товар'
    )
    file_type = models.CharField(max_length=30, choices=FILE_TYPE_CHOICES, default='model_source', verbose_name='Тип файла')
    file = models.FileField(upload_to='products/files/', blank=True, null=True, verbose_name='Файл')

    storage_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Путь в Object Storage')
    original_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='Исходное имя')
    mime_type = models.CharField(max_length=100, blank=True, null=True, verbose_name='MIME-тип')
    size = models.PositiveIntegerField(default=0, verbose_name='Размер файла в байтах')
    is_primary = models.BooleanField(default=False, verbose_name='Основной файл')

    preset_slug = models.CharField(max_length=100, blank=True, null=True, verbose_name='Slug пресета')
    generated_from_prompt = models.TextField(blank=True, null=True, verbose_name='Промпт генерации')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='Порядок')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Файл товара'
        verbose_name_plural = 'Файлы товара'
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return f'{self.product.title} - {self.file_type}'


class MaterialPreset(models.Model):
    CATEGORY_CHOICES = [
        ('wood', 'Wood'),
        ('glass', 'Glass'),
        ('metal', 'Metal'),
        ('plastic', 'Plastic'),
        ('stone', 'Stone'),
        ('fabric', 'Fabric'),
        ('leather', 'Leather'),
        ('ceramic', 'Ceramic'),
        ('sci_fi', 'Sci-Fi'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(unique=True, verbose_name='Слаг')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, verbose_name='Категория')

    description = models.TextField(blank=True, null=True, verbose_name='Описание')
    preview_image_storage_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Путь превью пресета')

    base_color = models.CharField(max_length=20, blank=True, null=True, verbose_name='Базовый цвет')
    roughness = models.FloatField(default=0.5, verbose_name='Roughness')
    metalness = models.FloatField(default=0.0, verbose_name='Metalness')
    transmission = models.FloatField(default=0.0, verbose_name='Transmission')
    opacity = models.FloatField(default=1.0, verbose_name='Opacity')
    emissive_color = models.CharField(max_length=20, blank=True, null=True, verbose_name='Emissive color')

    basecolor_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Base color texture')
    normal_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Normal texture')
    roughness_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Roughness texture')
    metallic_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Metallic texture')
    opacity_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Opacity texture')
    emissive_texture_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Emissive texture')

    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Пресет материала'
        verbose_name_plural = 'Пресеты материалов'
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class GeneratedTexture(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='generated_textures',
        verbose_name='Товар'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='generated_textures',
        verbose_name='Пользователь'
    )
    preset = models.ForeignKey(
        MaterialPreset,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='generated_textures',
        verbose_name='Пресет'
    )

    prompt = models.TextField(blank=True, null=True, verbose_name='Промпт')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')

    image_storage_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Путь итоговой текстуры')
    preview_storage_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='Путь превью текстуры')

    width = models.PositiveIntegerField(default=0, verbose_name='Ширина')
    height = models.PositiveIntegerField(default=0, verbose_name='Высота')

    error_message = models.TextField(blank=True, null=True, verbose_name='Ошибка')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        verbose_name = 'Сгенерированная текстура'
        verbose_name_plural = 'Сгенерированные текстуры'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.product.title} - {self.user.username} - {self.created_at:%Y-%m-%d %H:%M}'


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
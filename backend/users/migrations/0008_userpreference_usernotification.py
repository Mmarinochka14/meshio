from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_sellerprofile_store_banner_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sms_notifications', models.BooleanField(default=True, verbose_name='СМС-уведомления')),
                ('search_preferences', models.BooleanField(default=False, verbose_name='Учитывать предпочтения в поиске')),
                ('dark_theme', models.BooleanField(default=True, verbose_name='Тёмная тема')),
                ('compact_mode', models.BooleanField(default=False, verbose_name='Компактный режим')),
                ('seller_moderation_updates', models.BooleanField(default=True, verbose_name='Уведомления о модерации')),
                ('seller_sales_updates', models.BooleanField(default=True, verbose_name='Уведомления о продажах')),
                ('seller_comments_updates', models.BooleanField(default=True, verbose_name='Уведомления о комментариях')),
                ('seller_weekly_digest', models.BooleanField(default=False, verbose_name='Еженедельная сводка')),
                ('seller_auto_submit_to_review', models.BooleanField(default=False, verbose_name='Автоотправка на модерацию')),
                ('seller_show_store_contacts', models.BooleanField(default=True, verbose_name='Показывать контакты магазина')),
                ('seller_compact_model_cards', models.BooleanField(default=False, verbose_name='Компактные карточки моделей')),
                ('seller_allow_profile_indexing', models.BooleanField(default=True, verbose_name='Публичная индексация витрины')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='preferences', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Настройки пользователя',
                'verbose_name_plural': 'Настройки пользователей',
            },
        ),
        migrations.CreateModel(
            name='UserNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('system', 'System'), ('seller_status', 'Seller Status'), ('product_moderation', 'Product Moderation'), ('sale', 'Sale'), ('support', 'Support'), ('comment', 'Comment')], default='system', max_length=40, verbose_name='Тип')),
                ('title', models.CharField(max_length=255, verbose_name='Заголовок')),
                ('message', models.TextField(blank=True, default='', verbose_name='Сообщение')),
                ('link', models.CharField(blank=True, default='', max_length=500, verbose_name='Ссылка')),
                ('is_read', models.BooleanField(default=False, verbose_name='Прочитано')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Уведомление',
                'verbose_name_plural': 'Уведомления',
                'ordering': ['-created_at'],
            },
        ),
    ]

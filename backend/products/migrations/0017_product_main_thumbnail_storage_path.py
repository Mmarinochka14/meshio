from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0016_alter_generatedtexture_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="main_thumbnail_storage_path",
            field=models.CharField(
                blank=True,
                max_length=500,
                null=True,
                verbose_name="Thumbnail path in Object Storage",
            ),
        ),
    ]

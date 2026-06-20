from urllib.request import urlopen

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from core.object_storage import create_signed_file_url
from products.models import Product
from products.services.thumbnails import upload_product_thumbnail


class Command(BaseCommand):
    help = "Create missing product thumbnails from existing main previews."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Maximum number of products to process. 0 means no limit.",
        )

    def handle(self, *args, **options):
        queryset = Product.objects.filter(
            main_thumbnail_storage_path__isnull=True,
        ).exclude(
            main_preview_storage_path__isnull=True,
        ).exclude(
            main_preview_storage_path="",
        ).order_by("id")

        limit = options["limit"]
        if limit:
            queryset = queryset[:limit]

        created = 0
        failed = 0

        for product in queryset:
            try:
                preview_url = create_signed_file_url(
                    product.main_preview_storage_path,
                    expires_in=3600,
                )

                with urlopen(preview_url, timeout=30) as response:
                    preview_file = ContentFile(
                        response.read(),
                        name=f"product-{product.id}-preview",
                    )

                result = upload_product_thumbnail(preview_file, product.id)
                product.main_thumbnail_storage_path = result["storage_path"]
                product.save(update_fields=["main_thumbnail_storage_path"])
                created += 1
                self.stdout.write(f"Created thumbnail for product {product.id}")
            except Exception as exc:
                failed += 1
                self.stderr.write(
                    f"Failed to create thumbnail for product {product.id}: {exc}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Thumbnail backfill finished. Created: {created}. Failed: {failed}."
            )
        )

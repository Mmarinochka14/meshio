from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

from core.object_storage import upload_file_to_storage


THUMBNAIL_SIZE = (600, 600)
THUMBNAIL_QUALITY = 82


def create_thumbnail_file(file_obj, name="thumbnail.webp"):
    file_obj.seek(0)

    with Image.open(file_obj) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

        output = BytesIO()
        image.save(output, format="WEBP", quality=THUMBNAIL_QUALITY, method=6)

    thumbnail = ContentFile(output.getvalue(), name=Path(name).with_suffix(".webp").name)
    thumbnail.content_type = "image/webp"
    file_obj.seek(0)
    return thumbnail


def upload_product_thumbnail(file_obj, product_id):
    thumbnail = create_thumbnail_file(file_obj)
    return upload_file_to_storage(
        thumbnail,
        folder=f"products/{product_id}/thumbnail",
    )

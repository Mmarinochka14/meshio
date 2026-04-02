import tempfile
from pathlib import Path
from urllib.request import urlopen

from django.db import transaction

from core.object_storage import (
    create_signed_file_url,
    delete_file_from_storage,
    upload_file_to_storage,
)
from products.models import Product, ProductFile
from .blender_runner import run_blender_preprocessing


def _get_source_file(product: Product) -> ProductFile | None:
    source_file = (
        product.files.filter(file_type='model_source', is_primary=True)
        .order_by('sort_order', '-created_at')
        .first()
    )
    if source_file:
        return source_file

    source_file = (
        product.files.filter(file_type='model_source')
        .order_by('sort_order', '-created_at')
        .first()
    )
    if source_file:
        return source_file

    # fallback для старых записей
    source_file = (
        product.files.filter(file_type='model', is_primary=True)
        .order_by('sort_order', '-created_at')
        .first()
    )
    if source_file:
        return source_file

    return (
        product.files.filter(file_type='model')
        .order_by('sort_order', '-created_at')
        .first()
    )


def _copy_source_to_temp(product_file: ProductFile, temp_dir: Path) -> Path:
    original_name = product_file.original_name

    if not original_name and product_file.file:
        original_name = Path(product_file.file.name).name

    if not original_name and product_file.storage_path:
        original_name = Path(product_file.storage_path).name

    if not original_name:
        original_name = 'source_model'

    source_path = temp_dir / original_name

    # если файл есть локально через FileField
    if product_file.file:
        product_file.file.open('rb')
        try:
            source_path.write_bytes(product_file.file.read())
        finally:
            product_file.file.close()
        return source_path

    # если файл только в Object Storage
    if product_file.storage_path:
        signed_url = create_signed_file_url(product_file.storage_path, expires_in=3600)
        with urlopen(signed_url) as response:
            source_path.write_bytes(response.read())
        return source_path

    raise ValueError('Не найден источник файла ни в file, ни в storage_path.')


def _delete_existing_product_files(product: Product, file_type: str) -> None:
    existing_files = ProductFile.objects.filter(product=product, file_type=file_type)

    for item in existing_files:
        try:
            if item.storage_path:
                delete_file_from_storage(item.storage_path)
        except Exception:
            pass

        if item.file:
            item.file.delete(save=False)

        item.delete()


def _create_product_file_from_local_path(
    *,
    product: Product,
    file_type: str,
    local_path: Path,
    folder: str,
    is_primary: bool = True,
    sort_order: int = 0,
) -> ProductFile:
    with local_path.open('rb') as f:
        upload_result = upload_file_to_storage(f, folder=folder)

    return ProductFile.objects.create(
        product=product,
        file_type=file_type,
        storage_path=upload_result['storage_path'],
        original_name=local_path.name,
        mime_type=upload_result.get('content_type') or '',
        size=upload_result.get('size') or local_path.stat().st_size,
        is_primary=is_primary,
        sort_order=sort_order,
    )


@transaction.atomic
def prepare_product_viewer(product_id: int) -> None:
    product = Product.objects.select_for_update().get(id=product_id)

    source_file = _get_source_file(product)
    if not source_file:
        product.viewer_status = 'failed'
        product.viewer_error = 'Не найден source model.'
        product.save(update_fields=['viewer_status', 'viewer_error'])
        return

    product.viewer_status = 'pending'
    product.viewer_error = None
    product.save(update_fields=['viewer_status', 'viewer_error'])

    with tempfile.TemporaryDirectory(prefix=f'meshio_product_{product.id}_') as tmp:
        temp_dir = Path(tmp)

        try:
            source_path = _copy_source_to_temp(source_file, temp_dir)

            viewer_output = temp_dir / 'viewer_model.glb'
            uv_output = temp_dir / 'uv_preview.png'

            result = run_blender_preprocessing(
                source_path=source_path,
                output_glb_path=viewer_output,
                output_uv_png_path=uv_output,
            )

            _delete_existing_product_files(product, 'viewer_model')
            _delete_existing_product_files(product, 'uv_preview')

            _create_product_file_from_local_path(
                product=product,
                file_type='viewer_model',
                local_path=result['viewer_glb_path'],
                folder=f'products/{product.id}/viewer_model',
                is_primary=True,
                sort_order=0,
            )

            update_fields = ['viewer_status', 'viewer_error', 'viewer_format']

            product.viewer_status = 'ready'
            product.viewer_error = None
            product.viewer_format = 'glb'

            if result.get('uv_preview_path'):
                _create_product_file_from_local_path(
                    product=product,
                    file_type='uv_preview',
                    local_path=result['uv_preview_path'],
                    folder=f'products/{product.id}/uv_preview',
                    is_primary=True,
                    sort_order=0,
                )
                product.has_uv = True
                update_fields.append('has_uv')

            product.save(update_fields=update_fields)

        except Exception as e:
            product.viewer_status = 'failed'
            product.viewer_error = str(e)
            product.save(update_fields=['viewer_status', 'viewer_error'])
            raise
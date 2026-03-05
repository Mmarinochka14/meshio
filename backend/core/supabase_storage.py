import mimetypes
import uuid
from pathlib import Path

from django.conf import settings
from supabase import create_client


def get_supabase_client():
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase credentials are not configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def build_storage_path(folder: str, original_name: str) -> str:
    ext = Path(original_name).suffix or ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return f"{folder}/{unique_name}"


def upload_file_to_supabase(file_obj, folder: str):
    client = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    storage_path = build_storage_path(folder, file_obj.name)
    content_type = getattr(file_obj, "content_type", None) or mimetypes.guess_type(file_obj.name)[0] or "application/octet-stream"

    file_obj.seek(0)
    file_bytes = file_obj.read()

    client.storage.from_(bucket).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": False},
    )

    return {
        "storage_path": storage_path,
        "content_type": content_type,
        "size": len(file_bytes),
        "original_name": file_obj.name,
    }


def create_signed_file_url(storage_path: str, expires_in: int = 3600):
    client = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    data = client.storage.from_(bucket).create_signed_url(storage_path, expires_in)
    if isinstance(data, dict):
        return data.get("signedURL") or data.get("signed_url")
    return data

def delete_file_from_supabase(storage_path: str):
    if not storage_path:
        return

    client = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET
    client.storage.from_(bucket).remove([storage_path])
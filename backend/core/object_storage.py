import mimetypes
import uuid
from pathlib import Path

import boto3
from botocore.client import Config
from django.conf import settings


_S3_CLIENT = None


def get_s3_client():
    global _S3_CLIENT

    if _S3_CLIENT is not None:
        return _S3_CLIENT

    access_key = settings.CLOUDRU_ACCESS_KEY_ID
    secret_key = settings.CLOUDRU_SECRET_ACCESS_KEY
    endpoint_url = settings.CLOUDRU_STORAGE_ENDPOINT
    region_name = settings.CLOUDRU_STORAGE_REGION

    if not access_key or not secret_key or not endpoint_url or not region_name:
        raise ValueError("Cloud.ru Object Storage credentials are not configured.")

    _S3_CLIENT = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
    )
    return _S3_CLIENT

def get_bucket_name():
    bucket = settings.CLOUDRU_STORAGE_BUCKET
    if not bucket:
        raise ValueError("Cloud.ru bucket is not configured.")
    return bucket


def build_storage_path(folder: str, original_name: str) -> str:
    ext = Path(original_name).suffix or ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    return f"{folder}/{unique_name}"


def upload_file_to_storage(file_obj, folder: str):
    client = get_s3_client()
    bucket = get_bucket_name()

    storage_path = build_storage_path(folder, file_obj.name)
    content_type = (
        getattr(file_obj, "content_type", None)
        or mimetypes.guess_type(file_obj.name)[0]
        or "application/octet-stream"
    )

    file_obj.seek(0)
    file_bytes = file_obj.read()

    client.put_object(
        Bucket=bucket,
        Key=storage_path,
        Body=file_bytes,
        ContentType=content_type,
    )

    return {
        "storage_path": storage_path,
        "content_type": content_type,
        "size": len(file_bytes),
        "original_name": file_obj.name,
    }


def create_signed_file_url(storage_path: str, expires_in: int = 3600):
    if not storage_path:
        return None

    client = get_s3_client()
    bucket = get_bucket_name()

    return client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": bucket,
            "Key": storage_path,
        },
        ExpiresIn=expires_in,
    )


def delete_file_from_storage(storage_path: str):
    if not storage_path:
        return

    client = get_s3_client()
    bucket = get_bucket_name()

    client.delete_object(Bucket=bucket, Key=storage_path)

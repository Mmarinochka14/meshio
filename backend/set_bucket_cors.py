import os
from dotenv import load_dotenv
import boto3
from botocore.client import Config

load_dotenv()


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def split_origins(value):
    return [origin.strip() for origin in value.split(",") if origin.strip()]


if env_bool("S3_CORS_ALLOW_ALL_ORIGINS", True):
    allowed_origins = ["*"]
else:
    allowed_origins = split_origins(os.getenv("CORS_ALLOWED_ORIGINS", ""))
    frontend_url = os.getenv("FRONTEND_URL", "").strip()

    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)

    if not allowed_origins:
        allowed_origins = ["http://localhost:5173"]

client = boto3.client(
    "s3",
    endpoint_url=os.getenv("CLOUDRU_STORAGE_ENDPOINT", "https://s3.cloud.ru"),
    region_name=os.getenv("CLOUDRU_STORAGE_REGION", "ru-central-1"),
    aws_access_key_id=os.getenv("CLOUDRU_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("CLOUDRU_SECRET_ACCESS_KEY"),
    config=Config(signature_version="s3v4"),
)

bucket_name = os.getenv("CLOUDRU_STORAGE_BUCKET")

cors_configuration = {
    "CORSRules": [
        {
            "AllowedOrigins": allowed_origins,
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
            "MaxAgeSeconds": 3000,
        }
    ]
}

client.put_bucket_cors(
    Bucket=bucket_name,
    CORSConfiguration=cors_configuration,
)

print("CORS successfully configured for bucket:", bucket_name)
print("Allowed origins:", ", ".join(allowed_origins))

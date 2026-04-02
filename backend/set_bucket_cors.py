import os
from dotenv import load_dotenv
import boto3
from botocore.client import Config

load_dotenv()

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
            "AllowedOrigins": ["http://localhost:5173"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000,
        }
    ]
}

client.put_bucket_cors(
    Bucket=bucket_name,
    CORSConfiguration=cors_configuration,
)

print("CORS successfully configured for bucket:", bucket_name)
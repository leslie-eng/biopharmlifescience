"""The private S3-compatible bucket that holds product images (Neon object storage in production).

Objects are never public: visitors get a presigned GET URL that expires after an hour.
"""

import logging
from functools import lru_cache

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

log = logging.getLogger("biolinks_api")

StorageError = (BotoCoreError, ClientError)


@lru_cache(maxsize=1)
def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
        # Non-AWS endpoints serve buckets by path (endpoint/bucket/key), not as subdomains.
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}, retries={"max_attempts": 3}),
    )


def put(key: str, body: bytes, content_type: str) -> None:
    _client().put_object(Bucket=settings.S3_BUCKET_NAME, Key=key, Body=body, ContentType=content_type)


def delete(key: str) -> None:
    """Best effort: a leftover object costs a little storage; failing the caller's request would be worse."""
    try:
        _client().delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    except StorageError:
        log.warning("Could not delete %s from the image bucket", key, exc_info=True)


def presigned_url(key: str) -> str:
    """Signed locally (no network call), so it is cheap to build one per product per request."""
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=settings.IMAGE_URL_EXPIRES_SECONDS,
    )

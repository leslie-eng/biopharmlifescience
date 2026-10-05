"""Product photos: validated from their own bytes, stored in the bucket, referenced by `products.image_key`."""

import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.models import Product
from app.services import storage

CONTENT_TYPES = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


def sniff_image_extension(contents: bytes) -> str | None:
    if contents.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if contents[:4] == b"RIFF" and contents[8:12] == b"WEBP":
        return "webp"
    return None


def read_image(file: UploadFile) -> tuple[bytes, str]:
    """The upload's bytes and extension. The client's filename and Content-Type are ignored."""
    contents = file.file.read(settings.MAX_UPLOAD_BYTES + 1)
    if len(contents) > settings.MAX_UPLOAD_BYTES:
        raise AppError(413, "Image must be 5 MB or smaller", "IMAGE_TOO_LARGE")
    ext = sniff_image_extension(contents)
    if ext is None:
        raise AppError(400, "Only JPEG, PNG or WebP images are allowed", "IMAGE_TYPE_NOT_ALLOWED")
    return contents, ext


def image_url(product: Product) -> str | None:
    """A short-lived link to the product's photo, or the deprecated image_url while it has none."""
    if product.image_key:
        return storage.presigned_url(product.image_key)
    return product.image_url


def replace_image(db: Session, product: Product, contents: bytes, ext: str) -> None:
    """Store a new photo for the product, then drop the one it replaces."""
    key = f"products/{product.id}/{uuid.uuid4()}.{ext}"
    try:
        storage.put(key, contents, CONTENT_TYPES[ext])
    except storage.StorageError as exc:
        raise AppError(502, "Could not store the image. Try again.", "IMAGE_STORAGE_FAILED") from exc

    old_key = product.image_key
    product.image_key = key
    try:
        db.commit()
    except Exception:
        db.rollback()
        storage.delete(key)  # don't leave an object nothing points at
        raise
    if old_key:
        storage.delete(old_key)


def remove_image(db: Session, product: Product) -> None:
    old_key = product.image_key
    product.image_key = None
    db.commit()
    if old_key:
        storage.delete(old_key)

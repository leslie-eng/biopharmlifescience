from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.config import settings
from app.api.deps import require_staff
from app.schemas import UploadResponse
from app.utils import new_id

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

CATALOG_DIR = settings.UPLOAD_DIR / "catalog"
CATALOG_DIR.mkdir(parents=True, exist_ok=True)


def sniff_image_extension(contents: bytes) -> str | None:
    if contents.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if contents.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if contents[:4] == b"RIFF" and contents[8:12] == b"WEBP":
        return ".webp"
    return None


@router.post("/product-image", response_model=UploadResponse)
def upload_product_image(
    file: UploadFile = File(...),
    staff=Depends(require_staff),
):
    contents = file.file.read(settings.MAX_UPLOAD_BYTES + 1)
    if len(contents) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large")

    # The client's filename and Content-Type are ignored: the stored extension comes
    # only from the file's own bytes, so nothing executable can land under /uploads.
    ext = sniff_image_extension(contents)
    if ext is None:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG or WebP images are allowed")

    filename = f"{new_id()}{ext}"
    dest = CATALOG_DIR / filename
    dest.write_bytes(contents)

    url = f"{settings.PUBLIC_URL}/uploads/catalog/{filename}"
    return UploadResponse(url=url, path=f"catalog/{filename}")

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import settings
from ..deps import require_staff
from ..schemas import UploadResponse
from ..utils import new_id

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

CATALOG_DIR = settings.UPLOAD_DIR / "catalog"
CATALOG_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/product-image", response_model=UploadResponse)
def upload_product_image(
    file: UploadFile = File(...),
    staff=Depends(require_staff),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    contents = file.file.read(settings.MAX_UPLOAD_BYTES + 1)
    if len(contents) > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large")

    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    filename = f"{new_id()}{ext}"
    dest = CATALOG_DIR / filename
    dest.write_bytes(contents)

    url = f"{settings.PUBLIC_URL}/uploads/catalog/{filename}"
    return UploadResponse(url=url, path=f"catalog/{filename}")

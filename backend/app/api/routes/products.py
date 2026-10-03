from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_optional_user_id, require_staff
from app.core.database import get_db
from app.core.errors import AppError
from app.models import Product
from app.schemas import ProductCreate, ProductOut, ProductUpdate, PublicProductOut
from app.services.auth import is_staff, load_user_roles
from app.utils import is_uuid, new_id, slugify

router = APIRouter(prefix="/api/products", tags=["products"])


def _is_staff(db: Session, user_id: str | None) -> bool:
    return is_staff(load_user_roles(db, user_id)) if user_id else False


def _get(db: Session, product_id: str) -> Product | None:
    return db.get(Product, product_id) if is_uuid(product_id) else None


def _refuse_taken_slug(db: Session, slug: str, product_id: str | None = None) -> None:
    stmt = select(Product.id).where(Product.slug == slug)
    if product_id:
        stmt = stmt.where(Product.id != product_id)
    if db.execute(stmt).first():
        raise AppError(409, f"Another product already uses the slug '{slug}'", "SLUG_TAKEN")


def _for_caller(product: Product, is_staff: bool) -> ProductOut | PublicProductOut:
    return ProductOut.model_validate(product) if is_staff else PublicProductOut.model_validate(product)


# response_model=None: the shape depends on the caller (Staff see cost, visitors don't).
@router.get("", response_model=None)
def list_products(
    staff: bool = Query(False),
    active: bool = Query(False),
    user_id: str | None = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
) -> list[ProductOut] | list[PublicProductOut]:
    is_staff = _is_staff(db, user_id)
    if staff and not is_staff:
        raise HTTPException(status_code=403, detail="Staff access required")

    active_only = active or not staff
    stmt = select(Product).order_by(Product.created_at.desc())
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True))
    return [_for_caller(p, is_staff) for p in db.execute(stmt).scalars().all()]


@router.get("/{product_id}", response_model=None)
def get_product(
    product_id: str,
    user_id: str | None = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
) -> ProductOut | PublicProductOut:
    is_staff = _is_staff(db, user_id)
    product = _get(db, product_id)
    if not product or (not product.is_active and not is_staff):
        raise HTTPException(status_code=404, detail="Product not found")
    return _for_caller(product, is_staff)


@router.post("", status_code=201, response_model=ProductOut)
def create_product(
    body: ProductCreate,
    staff: tuple[str, list[str]] = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name required")

    slug = (body.slug or "").strip() or slugify(body.name)
    _refuse_taken_slug(db, slug)
    product = Product(
        id=new_id(),
        name=body.name.strip(),
        slug=slug,
        description=body.description,
        category=body.category,
        price=body.price or 0,
        cost=body.cost or 0,
        stock=body.stock or 0,
        unit=body.unit or "unit",
        image_url=body.image_url,
        is_active=body.is_active if body.is_active is not None else True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    body: ProductUpdate,
    staff: tuple[str, list[str]] = Depends(require_staff),
    db: Session = Depends(get_db),
):
    product = _get(db, product_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if updates.get("slug"):
        _refuse_taken_slug(db, updates["slug"], product.id)

    for key, value in updates.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    staff: tuple[str, list[str]] = Depends(require_staff),
    db: Session = Depends(get_db),
):
    product = _get(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}

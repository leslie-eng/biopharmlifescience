from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_optional_user_id, load_user_roles, require_staff
from ..models import Product
from ..schemas import ProductCreate, ProductOut, ProductUpdate
from ..utils import new_id, slugify

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    staff: bool = Query(False),
    active: bool = Query(False),
    user_id: str | None = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
):
    if staff:
        roles = load_user_roles(db, user_id) if user_id else []
        if "admin" not in roles and "staff" not in roles:
            raise HTTPException(status_code=403, detail="Staff access required")

    active_only = active or not staff
    stmt = select(Product).order_by(Product.created_at.desc())
    if active_only:
        stmt = stmt.where(Product.is_active.is_(True))
    return db.execute(stmt).scalars().all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", status_code=201, response_model=ProductOut)
def create_product(
    body: ProductCreate,
    staff: tuple[str, list[str]] = Depends(require_staff),
    db: Session = Depends(get_db),
):
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Name required")

    product = Product(
        id=new_id(),
        name=body.name.strip(),
        slug=(body.slug or "").strip() or slugify(body.name),
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
    product = db.get(Product, product_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

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
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}

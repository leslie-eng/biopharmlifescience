"""Read-only catalog for the public website. The POS (products table) is the only source of products.

Only products that are both active and published are visible, with storefront-safe fields only.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Product
from app.schemas import StorefrontCategory, StorefrontPage, StorefrontProduct
from app.services import product_images
from app.utils import is_uuid

router = APIRouter(prefix="/api/public", tags=["storefront"])

MAX_PAGE_SIZE = 100

_VISIBLE = (Product.is_active.is_(True), Product.is_published.is_(True))


def _storefront(product: Product) -> StorefrontProduct:
    return StorefrontProduct(
        id=product.id,
        slug=product.slug,
        name=product.name,
        description=product.description,
        category=product.category,
        price=float(product.price),
        unit=product.unit,
        in_stock=product.stock > 0,
        image_url=product_images.image_url(product),
    )


@router.get("/products", response_model=StorefrontPage)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=MAX_PAGE_SIZE),
    category: str | None = Query(None, description="Exact category name, case-insensitive"),
    q: str | None = Query(None, max_length=100, description="Search in name, description and category"),
    db: Session = Depends(get_db),
):
    conditions = list(_VISIBLE)
    if category and category.strip():
        conditions.append(func.lower(Product.category) == category.strip().lower())
    if q and q.strip():
        # Escape LIKE wildcards so a search for "100%" means the text, not a pattern.
        term = "%" + q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        conditions.append(
            or_(
                Product.name.ilike(term, escape="\\"),
                Product.description.ilike(term, escape="\\"),
                Product.category.ilike(term, escape="\\"),
            )
        )

    total = db.execute(select(func.count()).select_from(Product).where(*conditions)).scalar_one()
    products = (
        db.execute(
            select(Product)
            .where(*conditions)
            .order_by(func.nullif(Product.category, "").asc().nulls_last(), Product.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return StorefrontPage(items=[_storefront(p) for p in products], total=total, page=page, page_size=page_size)


@router.get("/products/{id_or_slug}", response_model=StorefrontProduct)
def get_product(id_or_slug: str, db: Session = Depends(get_db)):
    match = Product.id == id_or_slug if is_uuid(id_or_slug) else Product.slug == id_or_slug
    product = db.execute(select(Product).where(match, *_VISIBLE)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _storefront(product)


@router.get("/categories", response_model=list[StorefrontCategory])
def list_categories(db: Session = Depends(get_db)):
    """Categories that have at least one visible product, for the website's filter."""
    rows = db.execute(
        select(Product.category, func.count())
        .where(*_VISIBLE, Product.category.is_not(None), Product.category != "")
        .group_by(Product.category)
        .order_by(Product.category)
    ).all()
    return [StorefrontCategory(name=name, count=count) for name, count in rows]

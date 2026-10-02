"""Recording a sale: prices come from the catalog, never the client, and stock can't go negative."""

from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import Order, OrderItem, Product
from app.schemas import OrderCreateBody
from app.utils import generate_order_number, new_id


def record_sale(db: Session, body: OrderCreateBody) -> Order:
    """Create the order and its lines, and take the sold quantities out of stock, atomically."""
    if not body.items:
        raise AppError(400, "Order and items required", "EMPTY_ORDER")

    customer_name = (body.order.customer_name or "").strip()
    if not customer_name:
        raise AppError(400, "Customer name required", "CUSTOMER_NAME_REQUIRED")

    order = Order(
        id=new_id(),
        order_number=generate_order_number(),
        client_id=body.order.client_id,
        customer_name=customer_name,
        customer_email=body.order.customer_email,
        customer_phone=body.order.customer_phone,
        status=body.order.status or "pending",
        payment_method=body.order.payment_method or "mpesa",
        subtotal=0,
        total=0,
        notes=body.order.notes,
    )

    try:
        db.add(order)
        db.flush()  # assign order.id to the FK rows below within the same transaction

        subtotal = Decimal(0)
        for line in body.items:
            # Lock the product row for the rest of the transaction: prices are read from
            # it (never trusted from the client) and concurrent sales can't oversell stock.
            product = db.execute(
                select(Product).where(Product.id == line.product_id).with_for_update()
            ).scalar_one_or_none()
            if not product:
                raise AppError(400, "Product not found", "PRODUCT_NOT_FOUND")
            if not product.is_active:
                raise AppError(400, f"{product.name} is no longer for sale", "PRODUCT_INACTIVE")

            quantity = line.quantity
            line_total = product.price * quantity
            subtotal += line_total
            db.add(
                OrderItem(
                    id=new_id(),
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    unit_price=product.price,
                    quantity=quantity,
                    line_total=line_total,
                )
            )

            new_stock = product.stock - quantity
            if new_stock < 0:
                raise AppError(400, f"Insufficient stock for {product.name}", "INSUFFICIENT_STOCK")
            product.stock = new_stock

        order.subtotal = subtotal
        order.total = subtotal
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order

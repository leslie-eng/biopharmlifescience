from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_staff
from ..models import Order, OrderItem, Product
from ..schemas import OrderCreateBody, OrderItemOut, OrderOut, OrderStatusUpdate
from ..utils import generate_order_number, new_id

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(Order).order_by(Order.created_at.desc())).scalars().all()


@router.get("/{order_id}/items", response_model=list[OrderItemOut])
def order_items(order_id: str, staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(OrderItem).where(OrderItem.order_id == order_id)).scalars().all()


@router.patch("/{order_id}", response_model=OrderOut)
def update_order_status(
    order_id: str, body: OrderStatusUpdate, staff=Depends(require_staff), db: Session = Depends(get_db)
):
    if not body.status:
        raise HTTPException(status_code=400, detail="Status required")
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order


@router.post("", status_code=201, response_model=OrderOut)
def create_order(body: OrderCreateBody, staff=Depends(require_staff), db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Order and items required")

    status = body.order.status or "pending"
    customer_name = (body.order.customer_name or "").strip()
    if not customer_name:
        raise HTTPException(status_code=400, detail="Customer name required")

    order = Order(
        id=new_id(),
        order_number=generate_order_number(),
        client_id=body.order.client_id,
        customer_name=customer_name,
        customer_email=body.order.customer_email,
        customer_phone=body.order.customer_phone,
        status=status,
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
                raise HTTPException(status_code=400, detail="Product not found")

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

            if body.decrement_stock:
                new_stock = product.stock - quantity
                if new_stock < 0:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
                product.stock = new_stock

        order.subtotal = subtotal
        order.total = subtotal
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order

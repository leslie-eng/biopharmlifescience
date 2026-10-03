from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import require_staff
from app.models import Order, OrderItem
from app.schemas import OrderCreateBody, OrderItemOut, OrderOut, OrderStatusUpdate
from app.services import orders as orders_service
from app.utils import is_uuid

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(staff=Depends(require_staff), db: Session = Depends(get_db)):
    return db.execute(select(Order).order_by(Order.created_at.desc())).scalars().all()


@router.get("/{order_id}/items", response_model=list[OrderItemOut])
def order_items(order_id: str, staff=Depends(require_staff), db: Session = Depends(get_db)):
    if not is_uuid(order_id) or not db.get(Order, order_id):
        raise HTTPException(status_code=404, detail="Order not found")
    return db.execute(select(OrderItem).where(OrderItem.order_id == order_id)).scalars().all()


@router.patch("/{order_id}", response_model=OrderOut)
def update_order_status(
    order_id: str, body: OrderStatusUpdate, staff=Depends(require_staff), db: Session = Depends(get_db)
):
    order = db.get(Order, order_id) if is_uuid(order_id) else None
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = body.status
    db.commit()
    db.refresh(order)
    return order


@router.post("", status_code=201, response_model=OrderOut)
def create_order(body: OrderCreateBody, staff=Depends(require_staff), db: Session = Depends(get_db)):
    return orders_service.record_sale(db, body)

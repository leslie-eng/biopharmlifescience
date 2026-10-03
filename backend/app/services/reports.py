"""Figures for the dashboard's overview and reports pages."""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Client, Order, OrderItem, Product
from app.schemas import DashboardOverview, DashboardReports, DashboardStats

PAID_STATUSES = ("paid", "processing", "shipped", "delivered")
LOW_STOCK_THRESHOLD = 5
DEFAULT_REPORT_DAYS = 30


def overview(db: Session) -> DashboardOverview:
    orders = db.execute(select(Order).order_by(Order.created_at.desc())).scalars().all()
    client_count = db.execute(select(func.count()).select_from(Client)).scalar_one()
    stock_levels = db.execute(select(Product.stock)).scalars().all()

    revenue = sum(float(o.total or 0) for o in orders if o.status in PAID_STATUSES)

    return DashboardOverview(
        stats=DashboardStats(
            revenue=revenue,
            orders=len(orders),
            clients=client_count,
            products=len(stock_levels),
            lowStock=sum(1 for stock in stock_levels if stock <= LOW_STOCK_THRESHOLD),
        ),
        recentOrders=orders[:5],
    )


def _serialize(row) -> dict:
    out = dict(row._mapping)
    for key, value in out.items():
        if isinstance(value, datetime):
            # Match the old mysql2 `dateStrings: true` wire format — see the
            # long comment on schemas._iso_z for why this isn't ISO-8601/"Z".
            out[key] = value.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(value, Decimal):
            # Pydantic's default JSON encoding for Decimal-typed values inside a
            # `dict[str, Any]` model is a STRING (e.g. "50.00"), to preserve
            # precision. The old API always returned numbers here (mysql2 numeric
            # columns come back as JS numbers), and the frontend's TS types
            # (Order.total, OrderItem.line_total: number) assume that — so cast
            # explicitly rather than let this silently become a string over the
            # wire. Caught by the local smoke test, not by type-checking.
            out[key] = float(value)
    return out


def sales_since(db: Session, since: datetime | None) -> DashboardReports:
    """Orders and order lines created since `since`, or the last 30 days."""
    since_dt = since or datetime.utcnow() - timedelta(days=DEFAULT_REPORT_DAYS)
    since_naive = since_dt.replace(tzinfo=None)

    orders = db.execute(
        select(Order.total, Order.status, Order.created_at).where(Order.created_at >= since_naive)
    ).all()
    items = db.execute(
        select(OrderItem.product_name, OrderItem.line_total, OrderItem.quantity)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.created_at >= since_naive)
    ).all()

    return DashboardReports(
        orders=[_serialize(row) for row in orders],
        order_items=[_serialize(row) for row in items],
    )

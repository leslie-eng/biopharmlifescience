import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid_col(**kw):
    return mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()), **kw)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = _uuid_col()
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    profile: Mapped["Profile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="profile")


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role", name="uq_user_role"),
        CheckConstraint("role IN ('admin', 'staff', 'customer')", name="ck_user_roles_role"),
    )

    id: Mapped[str] = _uuid_col()
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)

    user: Mapped["User"] = relationship(back_populates="roles")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = _uuid_col()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)
    unit: Mapped[str | None] = mapped_column(String(40), nullable=True, default="unit")
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = _uuid_col()
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notify_on_restock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')",
            name="ck_orders_status",
        ),
        CheckConstraint(
            "payment_method IS NULL OR payment_method IN ('mpesa','cash','bank','other')",
            name="ck_orders_payment_method",
        ),
    )

    id: Mapped[str] = _uuid_col()
    order_number: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    client_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True, default="mpesa")
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    mpesa_receipt: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = _uuid_col()
    order_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[str] = _uuid_col()
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    occurred_on: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class StockInterest(Base):
    __tablename__ = "stock_interest"
    __table_args__ = (UniqueConstraint("product_id", "email", name="uq_stock_interest"),)

    id: Mapped[str] = _uuid_col()
    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    client_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("clients.id", ondelete="CASCADE"), nullable=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

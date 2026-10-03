from datetime import date, datetime
import re
from typing import Annotated, Any, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, field_serializer


def _iso_z(value: datetime | None) -> str | None:
    """Match the OLD Node backend's actual wire format for timestamps.

    Important: the old server/src/db.js pool was created with `dateStrings: true`,
    which makes mysql2 hand back DATETIME columns as plain strings like
    "2024-01-15 10:30:00" — NOT JS Date objects. That means serializeRow()'s
    `instanceof Date` branch never actually fired for created_at/updated_at, and
    the frontend has always received naive, space-separated, non-ISO strings
    with no timezone marker (the browser's `new Date(...)` parses these as local
    time). Emitting real ISO-8601 with a trailing "Z" here would change that
    behavior — a UTC marker shifts every displayed timestamp by the viewer's
    UTC offset. So we deliberately reproduce the old plain format instead.
    """
    if value is None:
        return None
    return value.strftime("%Y-%m-%d %H:%M:%S")


class OutBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------




class LoginBody(BaseModel):
    email: str
    password: str


class UserMetadata(BaseModel):
    full_name: str = ""


class AuthUserOut(BaseModel):
    id: str
    email: str
    user_metadata: UserMetadata


class AuthResponse(BaseModel):
    token: str
    user: AuthUserOut
    roles: list[str]
    must_change_password: bool = False


class MeResponse(BaseModel):
    user: AuthUserOut
    roles: list[str]
    must_change_password: bool = False


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


_EMAIL_SHAPE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _username(value: str) -> str:
    """The sign-in username is the account's email (the staff sign-in page asks for one)."""
    value = value.strip().lower()
    if not 3 <= len(value) <= 50:
        raise ValueError("username must be 3-50 characters")
    if not _EMAIL_SHAPE.match(value):
        raise ValueError("username must be an email address, e.g. you@example.com")
    return value


Username = Annotated[str, AfterValidator(_username)]


class SetupAdminBody(BaseModel):
    username: Username = Field(description="Your sign-in email, 3-50 characters")
    password: str = Field(description="At least 12 characters; not repetitive, common or containing the username")
    setup_token: str = Field(description="The SETUP_TOKEN value from the Render dashboard")


class SetupAdminResponse(BaseModel):
    username: str
    roles: list[str]


class ResetAdminPasswordBody(BaseModel):
    username: Username
    new_password: str
    reset_token: str = Field(description="The ADMIN_RESET_TOKEN value from the Render dashboard")


class ChangeUsernameBody(BaseModel):
    current_password: str
    new_username: Username


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


# ---------- Products ----------


class PublicProductOut(OutBase):
    """What visitors see: everything except what the product cost us."""

    id: str
    name: str
    slug: str
    description: str | None
    category: str | None
    price: float
    stock: int
    unit: str | None
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _ser_dt(self, v: datetime) -> str:
        return _iso_z(v)


class ProductOut(PublicProductOut):
    """What Staff see."""

    cost: float


class ProductCreate(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    category: str | None = None
    price: float = 0
    cost: float = 0
    stock: int = 0
    unit: str | None = "unit"
    image_url: str | None = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    category: str | None = None
    price: float | None = None
    cost: float | None = None
    stock: int | None = None
    unit: str | None = None
    image_url: str | None = None
    is_active: bool | None = None


# ---------- Clients ----------


class ClientOut(OutBase):
    id: str
    full_name: str
    email: str | None
    phone: str | None
    address: str | None
    notes: str | None
    notify_on_restock: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _ser_dt(self, v: datetime) -> str:
        return _iso_z(v)


class ClientCreate(BaseModel):
    full_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    notify_on_restock: bool = True


class ClientUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    notify_on_restock: bool | None = None


# ---------- Orders ----------


class OrderOut(OutBase):
    id: str
    order_number: str
    client_id: str | None
    customer_name: str | None
    customer_email: str | None
    customer_phone: str | None
    status: str
    payment_method: str | None
    subtotal: float
    total: float
    mpesa_receipt: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def _ser_dt(self, v: datetime) -> str:
        return _iso_z(v)


class OrderItemOut(OutBase):
    id: str
    order_id: str
    product_id: str | None
    product_name: str
    unit_price: float
    quantity: int
    line_total: float
    created_at: datetime

    @field_serializer("created_at")
    def _ser_dt(self, v: datetime) -> str:
        return _iso_z(v)


class OrderStatusUpdate(BaseModel):
    status: str


class OrderLineIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    # Sent by the POS but ignored: name and prices are always read from the product.
    product_name: str | None = None
    unit_price: float | None = None
    line_total: float | None = None


class OrderIn(BaseModel):
    client_id: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    status: str | None = None
    payment_method: str | None = "mpesa"
    # Sent by the POS but ignored: totals are computed from catalog prices.
    subtotal: float | None = None
    total: float | None = None
    notes: str | None = None


class OrderCreateBody(BaseModel):
    order: OrderIn
    items: list[OrderLineIn]


# ---------- Expenses ----------


class ExpenseOut(OutBase):
    id: str
    category: str
    description: str | None
    amount: float
    occurred_on: date
    created_at: datetime

    @field_serializer("created_at")
    def _ser_dt(self, v: datetime) -> str:
        return _iso_z(v)


class ExpenseCreate(BaseModel):
    category: str
    description: str | None = None
    amount: float
    occurred_on: date | None = None


# ---------- Stock interest ----------






# ---------- Dashboard ----------


class DashboardStats(BaseModel):
    revenue: float
    orders: int
    clients: int
    products: int
    lowStock: int


class DashboardOverview(BaseModel):
    stats: DashboardStats
    recentOrders: list[OrderOut]


class DashboardReports(BaseModel):
    orders: list[dict[str, Any]]
    order_items: list[dict[str, Any]]


# ---------- Chat ----------


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessageIn] = []


class ChatSource(BaseModel):
    id: str
    title: str


class ChatResponse(BaseModel):
    reply: str
    sources: list[ChatSource]
    mode: str


# ---------- Uploads ----------


class UploadResponse(BaseModel):
    url: str
    path: str


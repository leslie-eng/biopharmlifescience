"""Product images move to the bucket (image_key); products can be hidden from the website.

Revision ID: 0003
Revises: 0002
"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("image_key", sa.String(length=512), nullable=True))
    # Existing products stay on the website.
    op.add_column(
        "products", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true"))
    )
    op.alter_column("products", "image_url", existing_type=sa.Text(), comment="Deprecated: use image_key")


def downgrade() -> None:
    op.alter_column(
        "products", "image_url", existing_type=sa.Text(), comment=None, existing_comment="Deprecated: use image_key"
    )
    op.drop_column("products", "is_published")
    op.drop_column("products", "image_key")

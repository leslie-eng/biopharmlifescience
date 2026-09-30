"""The Alembic history is reversible and matches the ORM models the app runs on."""

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect

from app import models  # noqa: F401
from app.database import Base, engine
from conftest import alembic

APP_TABLES = {
    "users", "profiles", "user_roles", "products", "clients", "orders", "order_items", "expenses", "stock_interest"
}


def tables():
    return set(inspect(engine).get_table_names()) - {"alembic_version"}


def test_migrations_upgrade_downgrade_and_upgrade_again():
    assert tables() == APP_TABLES

    alembic("downgrade", "base")
    assert tables() == set()

    alembic("upgrade", "head")
    assert tables() == APP_TABLES


def test_orm_models_match_the_migrated_schema():
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)

    assert diff == []

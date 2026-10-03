import random
import re
import uuid
from datetime import datetime


def new_id() -> str:
    return str(uuid.uuid4())


def is_uuid(value: str) -> bool:
    """Ids are UUID columns: anything else can't exist, so routes answer 404 instead of a database error."""
    try:
        uuid.UUID(value)
    except ValueError:
        return False
    return True


def generate_order_number() -> str:
    now = datetime.now()
    yy = f"{now.year % 100:02d}"
    mm = f"{now.month:02d}"
    dd = f"{now.day:02d}"
    rand = f"{random.randint(0, 9999):04d}"
    return f"BL-{yy}{mm}{dd}-{rand}"


def slugify(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")

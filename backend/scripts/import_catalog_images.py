"""One-off: move the old static storefront photos into the image bucket and onto POS products.

The website used to ship 97 hardcoded products with photos in frontend/public/images/catalog/.
static_catalog.json (next to this file) records which photo each of those products used. This
script matches each entry to a POS product (by slug, then by name), uploads the photo to the
bucket and sets products.image_key. Products that already have an image_key are left alone, so
it is safe to run more than once.

Run from backend/ with the production DATABASE_URL and bucket variables set:

    python -m scripts.import_catalog_images --images-dir <folder with the .jpg files> --dry-run
    python -m scripts.import_catalog_images --images-dir <folder with the .jpg files>

--create-missing also creates (published, price 0, stock 0) any catalog product the POS doesn't
have yet; without it those are only listed.
"""

import argparse
import json
import re
import sys
from pathlib import Path

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Product
from app.services import product_images
from app.utils import new_id

MANIFEST = Path(__file__).with_name("static_catalog.json")


def _norm(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[—–-]", "-", name.lower())).strip()


def run(images_dir: Path, create_missing: bool, dry_run: bool) -> int:
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    uploaded, created, kept, not_in_pos, problems = [], [], [], [], []

    with SessionLocal() as db:
        products = db.execute(select(Product)).scalars().all()
        by_slug = {p.slug: p for p in products}
        by_name = {_norm(p.name): p for p in products}

        for entry in entries:
            product = by_slug.get(entry["slug"]) or by_name.get(_norm(entry["name"]))
            if product is None:
                if not create_missing:
                    not_in_pos.append(entry["name"])
                    continue
                product = Product(
                    id=new_id(),
                    name=entry["name"],
                    slug=entry["slug"],
                    category=entry["category"],
                    description=entry["description"],
                    price=0,
                    cost=0,
                    stock=0,
                    unit="unit",
                    is_active=True,
                    is_published=True,
                )
                created.append(entry["name"])
                if not dry_run:
                    db.add(product)
                    db.commit()
                by_slug[product.slug] = product

            if product.image_key:
                kept.append(product.name)
                continue

            path = images_dir / entry["image"]
            if not path.is_file():
                problems.append(f"{product.name}: {path} not found")
                continue
            contents = path.read_bytes()
            ext = product_images.sniff_image_extension(contents)
            if ext is None:
                problems.append(f"{product.name}: {path.name} is not a JPEG, PNG or WebP image")
                continue
            if not dry_run:
                product_images.replace_image(db, product, contents, ext)
            uploaded.append(f"{product.name} <- {path.name}")

        without_image = sorted(
            p.name for p in db.execute(select(Product)).scalars().all() if not p.image_key and not p.image_url
        )

    prefix = "[dry run] would " if dry_run else ""
    _section(f"{prefix}upload", uploaded)
    _section(f"{prefix}create in the POS (price 0, stock 0: set them in the POS)", created)
    _section("already had an image (left alone)", kept)
    _section("static catalog products not in the POS (rerun with --create-missing, or add them)", not_in_pos)
    _section("could not upload", problems)
    _section("POS products still without an image (fix in the POS)", [] if dry_run else without_image)
    return 1 if problems else 0


def _section(title: str, lines: list[str]) -> None:
    print(f"\n{title}: {len(lines)}")
    for line in lines:
        print(f"  - {line}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m scripts.import_catalog_images", description=__doc__.split("\n")[0])
    parser.add_argument("--images-dir", type=Path, required=True, help="Folder holding the old catalog .jpg files")
    parser.add_argument("--create-missing", action="store_true", help="Create catalog products the POS lacks")
    parser.add_argument("--dry-run", action="store_true", help="Report what would happen; change nothing")
    args = parser.parse_args(argv)
    if not args.images_dir.is_dir():
        parser.error(f"{args.images_dir} is not a folder")
    return run(args.images_dir, args.create_missing, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())

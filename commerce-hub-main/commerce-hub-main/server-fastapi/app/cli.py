"""Operator commands. Staff and Admin accounts are created here, never via public sign-up.

Usage (e.g. from the Render shell):
    python -m app.cli create-user --email ops@example.com --password '...' --role admin
"""

import argparse
import sys

from sqlalchemy import select

from .database import SessionLocal
from .models import Profile, User, UserRole
from .security import hash_password
from .utils import new_id

ROLES = ("admin", "staff", "customer")
MIN_PASSWORD_LENGTH = 8


def create_user(email: str, password: str, role: str, full_name: str = "") -> str:
    """Create a user with one role. Raises ValueError with a readable message on bad input."""
    email = email.strip().lower()
    if not email or "@" not in email:
        raise ValueError("A valid email is required")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    if role not in ROLES:
        raise ValueError(f"Role must be one of: {', '.join(ROLES)}")

    with SessionLocal() as db:
        if db.execute(select(User.id).where(User.email == email)).first():
            raise ValueError(f"A user with email {email} already exists")
        user_id = new_id()
        db.add(User(id=user_id, email=email, password_hash=hash_password(password)))
        db.flush()
        db.add(Profile(id=user_id, full_name=full_name, email=email))
        db.add(UserRole(id=new_id(), user_id=user_id, role=role))
        db.commit()
    return user_id


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create-user", help="Create an admin, staff or customer account")
    create.add_argument("--email", required=True)
    create.add_argument("--password", required=True)
    create.add_argument("--role", required=True, choices=ROLES)
    create.add_argument("--name", default="")

    args = parser.parse_args(argv)

    if args.command == "create-user":
        try:
            create_user(args.email, args.password, args.role, args.name)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        print(f"Created {args.role} {args.email.strip().lower()}")
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())

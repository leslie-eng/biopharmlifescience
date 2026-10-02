"""Operator commands. Staff and Admin accounts are created here, never via public sign-up.

Usage (e.g. from the Render shell):
    python -m app.cli create-user --email ops@example.com --role admin --temporary
    python -m app.cli set-password --email ops@example.com --temporary

Without --password the password is read from a hidden prompt, or from the environment
variable named by --password-env, so it never lands in shell history or the process list.
--temporary makes the user replace it on first sign-in.
"""

import argparse
import getpass
import os
import sys

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Profile, User, UserRole
from app.core.security import hash_password, password_problem
from app.utils import new_id

ROLES = ("admin", "staff", "customer")


def _check_password(password: str) -> None:
    problem = password_problem(password)
    if problem:
        raise ValueError(problem)


def create_user(email: str, password: str, role: str, full_name: str = "", temporary: bool = False) -> str:
    """Create a user with one role. Raises ValueError with a readable message on bad input."""
    email = email.strip().lower()
    if not email or "@" not in email:
        raise ValueError("A valid email is required")
    _check_password(password)
    if role not in ROLES:
        raise ValueError(f"Role must be one of: {', '.join(ROLES)}")

    with SessionLocal() as db:
        if db.execute(select(User.id).where(User.email == email)).first():
            raise ValueError(f"A user with email {email} already exists; use set-password to reset it")
        user_id = new_id()
        db.add(User(id=user_id, email=email, password_hash=hash_password(password), must_change_password=temporary))
        db.flush()
        db.add(Profile(id=user_id, full_name=full_name, email=email))
        db.add(UserRole(id=new_id(), user_id=user_id, role=role))
        db.commit()
    return user_id


def set_password(email: str, password: str, temporary: bool = False) -> None:
    """Replace an existing user's password. Raises ValueError if there is no such user."""
    email = email.strip().lower()
    _check_password(password)
    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            raise ValueError(f"No user with email {email}")
        user.password_hash = hash_password(password)
        user.must_change_password = temporary
        db.commit()


def _read_password(args: argparse.Namespace) -> str:
    if args.password:
        return args.password
    if args.password_env:
        password = os.environ.get(args.password_env, "")
        if not password:
            raise ValueError(f"Environment variable {args.password_env} is empty or not set")
        return password
    password = getpass.getpass("Password: ")
    if getpass.getpass("Repeat password: ") != password:
        raise ValueError("Passwords do not match")
    return password


def _add_password_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--password", help="Avoid: visible in shell history. Prefer the prompt or --password-env.")
    parser.add_argument("--password-env", metavar="VAR", help="Read the password from this environment variable")
    parser.add_argument("--temporary", action="store_true", help="Require a password change on first sign-in")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create-user", help="Create an admin, staff or customer account")
    create.add_argument("--email", required=True)
    create.add_argument("--role", required=True, choices=ROLES)
    create.add_argument("--name", default="")
    _add_password_args(create)

    reset = commands.add_parser("set-password", help="Reset an existing account's password")
    reset.add_argument("--email", required=True)
    _add_password_args(reset)

    args = parser.parse_args(argv)
    email = args.email.strip().lower()

    try:
        password = _read_password(args)
        if args.command == "create-user":
            create_user(args.email, password, args.role, args.name, temporary=args.temporary)
            print(f"Created {args.role} {email}")
        elif args.command == "set-password":
            set_password(args.email, password, temporary=args.temporary)
            print(f"Password updated for {email}")
        else:
            return 2
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    if args.temporary:
        print("The password is temporary: it must be changed at first sign-in.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Trusted operator CLI. Run only with deployment administrator access."""

import argparse, getpass, secrets, os
from sqlalchemy import select, delete
from .core import DB, PH, ENV
from .models import *


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("approve-owner")
    p.add_argument("email")
    p = sub.add_parser("publish")
    p.add_argument("property_id", type=int)
    p = sub.add_parser("unpublish")
    p.add_argument("property_id", type=int)
    p = sub.add_parser("reset-password")
    p.add_argument("email")
    sub.add_parser("seed-demo")
    args = parser.parse_args()
    with DB() as db:
        if args.command == "seed-demo":
            from .demo import seed_demo
            password = os.getenv("DEMO_PASSWORD") or getpass.getpass(
                "Demo password (at least 12 characters): "
            )
            seed_demo(db, password)
            print("Demo data ready. Accounts: owner@example.test, owner2@example.test, owner3@example.test, tenant@example.test. Existing accounts were preserved.")
        elif args.command in ("approve-owner", "reset-password"):
            u = db.scalar(select(User).where(User.email == args.email.lower()))
            if not u:
                raise SystemExit("Account not found")
            if args.command == "approve-owner":
                u.owner_approved = True
            else:
                pw = getpass.getpass("New password (at least 12 characters): ")
                if len(pw) < 12:
                    raise SystemExit("Password too short")
                u.password = PH.hash(pw)
                db.execute(delete(Session).where(Session.user_id == u.id))
            db.add(Audit(action="operator." + args.command, target=str(u.id)))
            db.commit()
            print("Updated")
        else:
            p = db.get(Property, args.property_id)
            if not p:
                raise SystemExit("Property not found")
            if args.command == "publish" and (
                not db.get(User, p.owner_id).owner_approved or not p.photo
            ):
                raise SystemExit(
                    "Approve owner and upload a property photo before publishing"
                )
            p.published = args.command == "publish"
            db.add(Audit(action="operator." + args.command, target=str(p.id)))
            db.commit()
            print("Updated")


def date_today():
    from datetime import date

    return date.today().isoformat()


if __name__ == "__main__":
    main()

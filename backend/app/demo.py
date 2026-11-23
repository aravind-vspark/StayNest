"""Explicit, transactional demo fixtures. Never runs during registration/startup."""
import secrets
from datetime import timedelta
from sqlalchemy import select
from . import core
from .models import User, Property, Bed, Tenancy, Invoice, Ticket, Notice, JoinRequest, Enquiry, Saved, Audit, now


PROPERTIES = [
    ("The Green House", "Gachibowli", "Co-living", 9500, 2, 10, "photo-1520277739336-7bf67edfa768", 17.4401, 78.3489),
    ("Nest Women's Residence", "Madhapur", "Women", 8500, 3, 9, "photo-1560448204-e02f11c3d0e2", 17.4486, 78.3908),
    ("Urban Hive", "Kondapur", "Men", 7200, 3, 12, "photo-1611892440504-42a792e24d32", 17.4622, 78.3568),
    ("Olive Living", "Gachibowli", "Women", 11000, 1, 6, "photo-1505693416388-ac5ce068fe85", 17.4325, 78.3443),
    ("The Social Stay", "HITEC City", "Co-living", 10500, 2, 8, "photo-1590490360182-c33d57733427", 17.4435, 78.3772),
    ("Maple Boys Hostel", "Kukatpally", "Men", 6500, 4, 12, "photo-1566665797739-1674de7a421a", 17.4849, 78.4138),
]


def seed_demo(db, password):
    if core.ENV == "production":
        raise SystemExit("Demo seeding is disabled in production")
    if len(password) < 12:
        raise SystemExit("Password must have at least 12 characters")
    if db.scalar(select(Audit.id).where(Audit.action == "demo.seed", Audit.target == "v2")):
        return False
    emails = ["owner@example.test", "owner2@example.test", "owner3@example.test"]
    emails += ["tenant@example.test"] + [f"tenant{i}@example.test" for i in range(2, 16)]
    # Never attach privileges, change passwords or impersonate an existing user.
    if db.scalar(select(User.id).where(User.email.in_(emails))):
        raise SystemExit("A demo email already exists. Existing accounts were left unchanged; use a separate demo database.")
    try:
        owners = []
        for email, name in zip(emails[:3], ["Ravi Kumar", "Ananya Reddy", "Vikram Rao"]):
            user = User(email=email, name=name, password=core.PH.hash(password), owner_approved=True)
            db.add(user)
            owners.append(user)
        tenants = []
        names = ["Aravind", "Priya Sharma", "Rahul Mehta", "Sneha Reddy", "Karthik Rao", "Meera Nair", "Aditya Singh", "Divya Patel", "Rohan Das", "Anjali Menon", "Sai Krishna", "Neha Gupta", "Akash Verma", "Pooja Shah", "Nikhil Jain"]
        for email, name in zip(emails[3:], names):
            user = User(email=email, name=name, password=core.PH.hash(password))
            db.add(user)
            tenants.append(user)
        db.flush()
        today = now().date()
        month = today.replace(day=1)
        previous = (month - timedelta(days=1)).replace(day=1)
        for index, (name, area, kind, price, sharing, count, photo, lat, lon) in enumerate(PROPERTIES):
            p = Property(owner_id=owners[index // 2].id, name=name, area=area,
                address=f"{area}, Hyderabad — demonstration property", type=kind,
                price=price, deposit=price, lat=str(lat), lon=str(lon),
                amen=["Wi-Fi", "Meals", "Laundry"] + (["AC"] if price >= 9500 else []),
                photo=f"https://images.unsplash.com/{photo}?auto=format&fit=crop&w=900&q=85",
                phone="0000000000", published=True, join_code=secrets.token_urlsafe(24),
                rules="Demonstration listing. Sample people, photos and payment history; no accommodation is offered.",
                menu={"breakfast": "Idli, sambar and chutney", "lunch": "Rice, dal, vegetables and curd", "dinner": "Chapati and paneer curry"})
            db.add(p)
            db.flush()
            db.add(Audit(action="demo.property", target=str(p.id)))
            beds = [Bed(property_id=p.id, room=str(201 + i // sharing), label=chr(65 + i % sharing), sharing=sharing) for i in range(count)]
            db.add_all(beds)
            db.flush()
            for slot in range(2):
                user = tenants[index * 2 + slot]
                tenancy = Tenancy(user_id=user.id, property_id=p.id, bed_id=beds[slot].id, joined=now() - timedelta(days=45 + index))
                db.add(tenancy)
                db.flush()
                db.add(Invoice(user_id=user.id, property_id=p.id, tenancy_id=tenancy.id,
                    period=month.strftime("%Y-%m"), amount=price * 100, due=month.replace(day=5).isoformat()))
                db.add(Invoice(user_id=user.id, property_id=p.id, tenancy_id=tenancy.id,
                    period=previous.strftime("%Y-%m"), amount=price * 100, due=previous.replace(day=5).isoformat(),
                    status="paid", payment_id=f"demo_payment_{p.id}_{user.id}", paid_at=now() - timedelta(days=28)))
                db.add(Ticket(user_id=user.id, property_id=p.id,
                    title=["Wi-Fi connection drops", "Bathroom tap needs repair"][slot],
                    category=["Internet", "Maintenance"][slot], detail="Please arrange a check when convenient.",
                    status=["In progress", "Resolved"][slot], reply=["Technician scheduled this afternoon.", "Repair completed; please confirm."][slot]))
                db.add(Saved(user_id=user.id, property_id=p.id))
            db.add_all([
                Notice(property_id=p.id, title="Lunch is ready", body="Meals are served in the dining hall until 2:30 PM.", type="Food ready"),
                Notice(property_id=p.id, title="Weekend housekeeping", body="Room cleaning is scheduled for Saturday morning.", type="General update"),
            ])
            if index < 3:
                prospect = tenants[12 + index]
                db.add(JoinRequest(user_id=prospect.id, property_id=p.id))
                db.add(Enquiry(user_id=prospect.id, property_id=p.id, kind="Video tour",
                    date=(today + timedelta(days=2)).isoformat(), message="Interested in moving next month. Is an evening tour possible?"))
        db.add(Audit(action="demo.seed", target="v2"))
        db.commit()
        return True
    except BaseException:
        db.rollback()
        raise

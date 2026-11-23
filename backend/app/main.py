import os, io, secrets, hashlib, json, hmac
from datetime import date, timedelta
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Request, Response, UploadFile, File, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select, func, delete, text
from sqlalchemy.exc import IntegrityError
from PIL import Image, UnidentifiedImageError
import qrcode
from .models import *
from .core import *
from .schemas import *
from . import payments
from .push import enqueue

app = FastAPI(
    title="StayNest API",
    version="1.0.0",
    docs_url="/api/docs" if ENV != "production" else None,
    redoc_url=None,
)
WEB = Path(__file__).resolve().parents[2] / "web"
if not WEB.exists():
    WEB = Path("/app/web")


def need(obj):
    if obj is None:
        raise HTTPException(404, "Not found")
    return obj


def own(db, u, pid):
    p = need(db.get(Property, pid))
    if p.owner_id != u.id:
        raise HTTPException(403, "Property access denied")
    return p


def tenancy(db, u):
    return need(
        db.scalar(
            select(Tenancy).where(Tenancy.user_id == u.id, Tenancy.active == True)
        )
    )


def audit(db, u, action, target):
    db.add(Audit(actor=u.id if u else None, action=action, target=str(target)))


def public(p, db, inventory=None):
    beds = inventory[0].get(p.id, []) if inventory is not None else db.scalars(
        select(Bed).where(Bed.property_id == p.id, Bed.active == True)
    ).all()
    used = inventory[1] if inventory is not None else set(
        db.scalars(
            select(Tenancy.bed_id).where(
                Tenancy.property_id == p.id, Tenancy.active == True
            )
        ).all()
    )
    return dict(
        id=p.id,
        name=p.name,
        area=p.area,
        address=p.address,
        type=p.type,
        price=p.price,
        deposit=p.deposit,
        lat=float(p.lat),
        lon=float(p.lon),
        amen=p.amen,
        photo=p.photo,
        photos=p.photos if (hasattr(p, "photos") and p.photos) else ([p.photo] if p.photo else []),
        video_url=getattr(p, "video_url", "") or "",
        merchant_account_id=getattr(p, "merchant_account_id", "") or "",
        beds=sum(b.id not in used for b in beds),
        sharing=min((b.sharing for b in beds), default=1),
        sharing_options=sorted(set(b.sharing for b in beds)),
        phone=p.phone,
        closing=p.closing,
        notice_days=p.notice_days,
        rules=p.rules,
        updated=p.updated.isoformat(),
        published=p.published,
        demonstration=p.rules.startswith("Demonstration listing."),
    )


def inv(i):
    return dict(
        id=i.id,
        user_id=i.user_id,
        property_id=i.property_id,
        tenancy_id=i.tenancy_id,
        period=i.period,
        amount=i.amount,
        due=i.due,
        status=i.status,
        payment_id=i.payment_id,
        paid_at=i.paid_at.isoformat() if i.paid_at else None,
    )


def ticket(r):
    return dict(
        id=r.id,
        user_id=r.user_id,
        title=r.title,
        category=r.category,
        detail=r.detail,
        status=r.status,
        reply=r.reply,
    )


def notice(n):
    return dict(
        id=n.id, title=n.title, body=n.body, type=n.type, created=n.created.isoformat()
    )


def enquiry_row(e, db):
    return dict(
        id=e.id,
        property_id=e.property_id,
        hostel=db.get(Property, e.property_id).name,
        name=db.get(User, e.user_id).name,
        kind=e.kind,
        date=e.date,
        message=e.message,
        status=e.status,
    )


@app.middleware("http")
async def protection(request, call_next):
    if (
        request.method in ("POST", "PUT", "PATCH", "DELETE")
        and request.url.path != "/api/payments/webhook"
    ):
        if (
            request.headers.get("origin") != ORIGIN
            or request.headers.get("x-staynest-request") != "1"
        ):
            return Response("Invalid request origin", status_code=403)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "geolocation=(self), camera=(), microphone=()"
    )
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    elif request.url.path in ("/", "/index.html", "/app.js", "/sw.js"):
        response.headers["Cache-Control"] = "no-cache"
    if ENV == "production":
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    # Inline handlers retained to preserve original UI. No eval; all untrusted text is escaped.
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://*.razorpay.com; connect-src 'self' https://*.razorpay.com; frame-src https://*.razorpay.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    )
    return response


@app.exception_handler(IntegrityError)
async def conflict(request, exc):
    return Response(
        json.dumps({"detail": "Conflicting record. Refresh and try again."}),
        409,
        media_type="application/json",
    )


@app.get("/api/health")
def health(db=Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.post("/api/auth/register", status_code=201)
def register(
    data: Registration, request: Request, response: Response, db=Depends(get_db)
):
    throttle("register:" + request.client.host, 5, 300)
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "Unable to register this email")
    u = User(email=data.email, name=data.name, password=PH.hash(data.password), onboarding_intent=data.onboarding_intent)
    db.add(u)
    db.flush()
    issue_session(db, u, response)
    return {"id": u.id, "name": u.name}


@app.post("/api/auth/login")
def login(data: Credentials, request: Request, response: Response, db=Depends(get_db)):
    throttle("login:" + request.client.host, 20, 300)
    throttle("account:" + data.email, 10, 300)
    u = db.scalar(select(User).where(User.email == data.email))
    if not verify(data.password, u.password if u else DUMMY) or not u or u.deleted:
        raise HTTPException(401, "Invalid email or password")
    issue_session(db, u, response)
    return {"id": u.id, "name": u.name}


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, db=Depends(get_db)):
    db.execute(
        delete(Session).where(
            Session.token
            == hashlib.sha256(
                request.cookies.get("staynest_session", "").encode()
            ).hexdigest()
        )
    )
    db.commit()
    response.delete_cookie("staynest_session")
    return {"ok": True}


@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest, request: Request, db=Depends(get_db)):
    throttle("forgot-password:" + request.client.host, 10, 300)
    u = db.scalar(select(User).where(User.email == data.email, User.deleted == False))
    if not u:
        return {"status": "ok", "message": "If an account exists with this email, a reset token has been issued."}
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == u.id))
    db.add(PasswordResetToken(
        user_id=u.id,
        token_hash=token_hash,
        expires=now() + timedelta(hours=1),
    ))
    db.add(Audit(actor=u.id, action="user.forgot_password", target=u.email))
    db.commit()
    res = {"status": "ok", "message": "Password reset token generated. Check your email or enter the code to continue."}
    if ENV != "production":
        res["reset_token"] = raw_token
    return res


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordRequest, request: Request, db=Depends(get_db)):
    throttle("reset-password:" + request.client.host, 10, 300)
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    t = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used == False,
            PasswordResetToken.expires > now(),
        )
    )
    if not t:
        raise HTTPException(400, "Invalid or expired reset token")
    u = need(db.get(User, t.user_id))
    if u.deleted:
        raise HTTPException(400, "Account has been deleted")
    u.password = PH.hash(data.new_password)
    t.used = True
    db.execute(delete(Session).where(Session.user_id == u.id))
    db.add(Audit(actor=u.id, action="user.reset_password", target=u.email))
    db.commit()
    return {"status": "ok", "message": "Password updated successfully. You can now sign in."}


@app.post("/api/auth/otp/send")
def send_otp(data: SendOTPRequest, request: Request, db=Depends(get_db)):
    throttle("otp-send:" + request.client.host, 10, 300)
    throttle("otp-phone:" + data.phone, 5, 300)
    code = f"{secrets.randbelow(900000) + 100000}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    db.execute(delete(OTPVerification).where(OTPVerification.phone == data.phone))
    db.add(OTPVerification(
        phone=data.phone,
        code_hash=code_hash,
        expires=now() + timedelta(minutes=10),
    ))
    db.commit()
    res = {"status": "ok", "message": "6-digit verification code sent to your phone number."}
    if ENV != "production":
        res["otp"] = code
    return res


@app.post("/api/auth/otp/verify")
def verify_otp(data: VerifyOTPRequest, request: Request, u=Depends(optional_user), db=Depends(get_db)):
    throttle("otp-verify:" + request.client.host, 15, 300)
    code_hash = hashlib.sha256(data.otp.encode()).hexdigest()
    v = db.scalar(
        select(OTPVerification).where(
            OTPVerification.phone == data.phone,
            OTPVerification.expires > now(),
            OTPVerification.verified == False,
        )
    )
    if not v:
        raise HTTPException(400, "No active OTP request found for this phone number")
    if v.attempts >= 5:
        raise HTTPException(429, "Too many failed attempts. Request a new code.")
    v.attempts += 1
    if not hmac.compare_digest(v.code_hash, code_hash):
        db.commit()
        raise HTTPException(400, "Incorrect verification code")
    v.verified = True
    if u:
        u.phone = data.phone
        u.phone_verified = True
    db.commit()
    return {"status": "ok", "verified": True, "phone": data.phone}


@app.get("/api/me")
def me(u=Depends(current), db=Depends(get_db)):
    t = db.scalar(
        select(Tenancy).where(Tenancy.user_id == u.id, Tenancy.active == True)
    )
    return dict(
        id=u.id,
        name=u.name,
        email=u.email,
        phone=u.phone or "",
        phone_verified=getattr(u, "phone_verified", False),
        owner_approved=u.owner_approved,
        tenant=bool(t),
        onboarding_intent=u.onboarding_intent,
        active_property={"id": t.property_id, "name": db.get(Property, t.property_id).name} if t else None,
        join_requests=[{"id": r.id, "property_id": p.id, "property_name": p.name, "status": r.status}
            for r, p in db.execute(select(JoinRequest, Property).join(Property, Property.id == JoinRequest.property_id)
                .where(JoinRequest.user_id == u.id).order_by(JoinRequest.id.desc()).limit(50))],
        properties=[
            {"id": p.id, "name": p.name, "published": p.published}
            for p in db.scalars(select(Property).where(Property.owner_id == u.id)).all()
        ],
    )


@app.delete("/api/account")
def delete_account(data: AccountDeletion, response: Response, u=Depends(current), db=Depends(get_db)):
    throttle("delete-account:" + str(u.id), 5, 300)
    if not verify(data.password, u.password):
        raise HTTPException(401, "Incorrect password")
    u = db.scalar(select(User).where(User.id == u.id).with_for_update())
    subscriptions = select(PushSubscription.id).where(PushSubscription.user_id == u.id)
    db.execute(delete(PushDelivery).where(PushDelivery.subscription_id.in_(subscriptions)))
    for model in (Session, PushSubscription, Saved, Enquiry, JoinRequest, Ticket):
        db.execute(delete(model).where(model.user_id == u.id))
    for t in db.scalars(select(Tenancy).where(Tenancy.user_id == u.id, Tenancy.active == True)):
        t.active = False
        t.moveout = ""
    for p in db.scalars(select(Property).where(Property.owner_id == u.id)):
        p.published = False
        p.phone = ""
        p.join_code = secrets.token_urlsafe(24)
        p.updated = now()
    u.email = f"deleted-{secrets.token_hex(16)}@example.invalid"
    u.name = "Deleted account"
    u.phone = ""
    u.password = PH.hash(secrets.token_urlsafe(48))
    u.owner_approved = False
    u.deleted = True
    audit(db, u, "account.deleted", u.id)
    db.commit()
    response.delete_cookie("staynest_session")
    return {"ok": True, "detail": "Account deleted. Invoice, tenancy and audit references are retained without your login details."}



@app.get("/api/properties")
def properties(offset: int = Query(0, ge=0), limit: int = Query(500, ge=1, le=500), db=Depends(get_db)):
    rows = db.scalars(select(Property).where(Property.published == True)
                      .order_by(Property.id).offset(offset).limit(limit)).all()
    ids = [p.id for p in rows]
    beds = {}
    for b in db.scalars(select(Bed).where(Bed.property_id.in_(ids), Bed.active == True)):
        beds.setdefault(b.property_id, []).append(b)
    used = set(db.scalars(select(Tenancy.bed_id).where(Tenancy.property_id.in_(ids), Tenancy.active == True)))
    return [public(p, db, (beds, used)) for p in rows]


@app.get("/api/invoices")
def my_invoices(offset: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100), u=Depends(current), db=Depends(get_db)):
    return [inv(i) for i in db.scalars(select(Invoice).where(Invoice.user_id == u.id)
            .order_by(Invoice.id.desc()).offset(offset).limit(limit))]


@app.post("/api/properties", status_code=201)
def create_property(data: PropertyInput, u=Depends(current), db=Depends(get_db)):
    p = Property(
        **data.model_dump(exclude={"lat", "lon"}),
        lat=str(data.lat),
        lon=str(data.lon),
        owner_id=u.id,
        join_code=secrets.token_urlsafe(24),
    )
    db.add(p)
    db.flush()
    audit(db, u, "property.create", p.id)
    db.commit()
    return public(p, db)


@app.put("/api/properties/{pid}")
def update_property(
    pid: int, data: PropertyInput, u=Depends(current), db=Depends(get_db)
):
    p = own(db, u, pid)
    for k, v in data.model_dump().items():
        setattr(p, k, str(v) if k in ("lat", "lon") else v)
    p.updated = now()
    audit(db, u, "property.update", pid)
    db.commit()
    return public(p, db)


@app.get("/api/saved")
def saved(u=Depends(current), db=Depends(get_db)):
    return list(db.scalars(select(Saved.property_id).where(Saved.user_id == u.id)))


@app.put("/api/saved/{pid}")
def save_place(pid: int, u=Depends(current), db=Depends(get_db)):
    p = need(db.get(Property, pid))
    if not p.published:
        raise HTTPException(404, "Listing unavailable")
    if not db.get(Saved, (u.id, pid)):
        db.add(Saved(user_id=u.id, property_id=pid))
        db.commit()
    return {"saved": True}


@app.delete("/api/saved/{pid}")
def unsave(pid: int, u=Depends(current), db=Depends(get_db)):
    db.execute(delete(Saved).where(Saved.user_id == u.id, Saved.property_id == pid))
    db.commit()
    return {"saved": False}


@app.post("/api/properties/{pid}/enquiries", status_code=201)
def enquire(pid: int, data: EnquiryInput, u=Depends(current), db=Depends(get_db)):
    p = need(db.get(Property, pid))
    throttle("enquiry:" + str(u.id), 10, 3600)
    if not p.published:
        raise HTTPException(404, "Listing unavailable")
    if data.date < date.today():
        raise HTTPException(422, "Choose a future date")
    e = Enquiry(
        user_id=u.id,
        property_id=pid,
        kind=data.kind,
        date=data.date.isoformat(),
        message=data.message,
    )
    db.add(e)
    db.commit()
    return {"id": e.id}


@app.get("/api/enquiries")
def my_enquiries(u=Depends(current), db=Depends(get_db)):
    return [
        enquiry_row(e, db)
        for e in db.scalars(
            select(Enquiry).where(Enquiry.user_id == u.id).order_by(Enquiry.id.desc())
        )
    ]


@app.patch("/api/enquiries/{eid}")
def change_enquiry(
    eid: int, data: EnquiryState, u=Depends(current), db=Depends(get_db)
):
    e = need(db.get(Enquiry, eid))
    own(db, u, e.property_id)
    e.status = data.status
    db.commit()
    return {"ok": True}


@app.get("/api/join/{code}")
def join_preview(code: str, db=Depends(get_db)):
    p = need(
        db.scalar(
            select(Property).where(
                Property.join_code == code, Property.published == True
            )
        )
    )
    return {"id": p.id, "name": p.name, "area": p.area}


@app.post("/api/join", status_code=201)
def join(data: JoinInput, u=Depends(current), db=Depends(get_db)):
    p = need(
        db.scalar(
            select(Property).where(
                Property.join_code == data.code, Property.published == True
            )
        )
    )
    if db.scalar(
        select(Tenancy).where(Tenancy.user_id == u.id, Tenancy.active == True)
    ):
        raise HTTPException(409, "You already have an active tenancy")
    r = db.scalar(
        select(JoinRequest).where(
            JoinRequest.user_id == u.id, JoinRequest.property_id == p.id
        )
    )
    if not r:
        r = JoinRequest(user_id=u.id, property_id=p.id)
        db.add(r)
    r.status = "Requested"
    db.commit()
    return {"status": r.status}


@app.get("/api/owner/{pid}/qr")
def qr(pid: int, u=Depends(current), db=Depends(get_db)):
    p = own(db, u, pid)
    b = io.BytesIO()
    qrcode.make(ORIGIN + "/?join=" + p.join_code).save(b, format="PNG")
    return Response(b.getvalue(), media_type="image/png")


@app.post("/api/owner/{pid}/join-code/rotate")
def rotate(pid: int, u=Depends(current), db=Depends(get_db)):
    p = own(db, u, pid)
    p.join_code = secrets.token_urlsafe(24)
    audit(db, u, "join.rotate", pid)
    db.commit()
    return {"ok": True}


@app.post("/api/owner/{pid}/beds", status_code=201)
def add_bed(pid: int, data: BedInput, u=Depends(current), db=Depends(get_db)):
    p = own(db, u, pid)
    b = Bed(property_id=pid, **data.model_dump())
    db.add(b)
    p.updated = now()
    db.commit()
    return {"id": b.id}


@app.patch("/api/beds/{bid}")
def bed_state(bid: int, data: BedState, u=Depends(current), db=Depends(get_db)):
    b = need(db.scalar(select(Bed).where(Bed.id == bid).with_for_update()))
    p = own(db, u, b.property_id)
    if not data.active and db.scalar(
        select(Tenancy).where(Tenancy.bed_id == bid, Tenancy.active == True)
    ):
        raise HTTPException(409, "Occupied bed cannot be disabled")
    b.active = data.active
    p.updated = now()
    db.commit()
    return {"ok": True}


@app.post("/api/joins/{jid}/approve")
def approve_join(jid: int, data: Approval, u=Depends(current), db=Depends(get_db)):
    r = need(
        db.scalar(select(JoinRequest).where(JoinRequest.id == jid).with_for_update())
    )
    p = own(db, u, r.property_id)
    if r.status != "Requested":
        raise HTTPException(409, "Request already processed")
    b = need(db.scalar(select(Bed).where(Bed.id == data.bed_id).with_for_update()))
    if b.property_id != p.id or not b.active:
        raise HTTPException(400, "Invalid bed")
    if db.scalar(select(Tenancy).where(Tenancy.bed_id == b.id, Tenancy.active == True)):
        raise HTTPException(409, "Bed occupied")
    t = Tenancy(user_id=r.user_id, property_id=p.id, bed_id=b.id)
    db.add(t)
    r.status = "Approved"
    for other in db.scalars(select(JoinRequest).where(JoinRequest.user_id == r.user_id,
            JoinRequest.id != r.id, JoinRequest.status == "Requested")):
        other.status = "Closed"
    p.updated = now()
    audit(db, u, "tenancy.approve", jid)
    db.commit()
    return {"id": t.id}


@app.post("/api/tenancies/{tid}/checkout")
def checkout(tid: int, u=Depends(current), db=Depends(get_db)):
    t = need(db.scalar(select(Tenancy).where(Tenancy.id == tid).with_for_update()))
    p = own(db, u, t.property_id)
    t.active = False
    p.updated = now()
    audit(db, u, "tenancy.checkout", tid)
    db.commit()
    return {"ok": True}


@app.get("/api/tenant")
def tenant_state(u=Depends(current), db=Depends(get_db)):
    t = tenancy(db, u)
    p = db.get(Property, t.property_id)
    b = db.get(Bed, t.bed_id)
    return dict(
        property=public(p, db),
        tenancy={"id": t.id, "room": b.room, "bed": b.label, "moveout": t.moveout},
        requests=[
            ticket(r)
            for r in db.scalars(
                select(Ticket)
                .where(Ticket.user_id == u.id, Ticket.property_id == p.id)
                .order_by(Ticket.id.desc())
                .limit(100)
            )
        ],
        announcements=[
            notice(n)
            for n in db.scalars(
                select(Notice)
                .where(Notice.property_id == p.id)
                .order_by(Notice.id.desc())
                .limit(100)
            )
        ],
        menu=p.menu,
        invoices=[
            inv(i)
            for i in db.scalars(
                select(Invoice)
                .where(Invoice.user_id == u.id)
                .order_by(Invoice.id.desc())
                .limit(100)
            )
        ],
    )


@app.post("/api/requests", status_code=201)
def request_create(data: TicketInput, u=Depends(current), db=Depends(get_db)):
    t = tenancy(db, u)
    throttle("ticket:" + str(u.id), 20, 3600)
    r = Ticket(user_id=u.id, property_id=t.property_id, **data.model_dump())
    db.add(r)
    db.commit()
    return {"id": r.id}


@app.patch("/api/requests/{rid}")
def request_update(
    rid: int, data: TicketUpdate, u=Depends(current), db=Depends(get_db)
):
    r = need(db.get(Ticket, rid))
    own(db, u, r.property_id)
    r.status = data.status
    r.reply = data.reply
    audit(db, u, "ticket.update", rid)
    db.commit()
    return {"ok": True}


@app.post("/api/moveout")
def moveout(data: Moveout, u=Depends(current), db=Depends(get_db)):
    t = tenancy(db, u)
    p = db.get(Property, t.property_id)
    if data.date < date.today() + timedelta(days=p.notice_days):
        raise HTTPException(422, f"Minimum notice is {p.notice_days} days")
    t.moveout = data.date.isoformat()
    audit(db, u, "moveout.request", t.id)
    db.commit()
    return {"ok": True}


@app.get("/api/owner/{pid}")
def owner_state(pid: int, offset: int = Query(0, ge=0), u=Depends(current), db=Depends(get_db)):
    p = own(db, u, pid)
    tenants = db.scalars(
        select(Tenancy).where(Tenancy.property_id == pid, Tenancy.active == True)
    ).all()
    occupied = {t.bed_id for t in tenants}
    return dict(
        property=public(p, db),
        join_url=ORIGIN + "/?join=" + p.join_code,
        history_offset=offset,
        rent_received=db.scalar(select(func.coalesce(func.sum(Invoice.amount), 0)).where(
            Invoice.property_id == pid, Invoice.status == "paid", Invoice.period == now().strftime("%Y-%m"))),
        open_requests=db.scalar(select(func.count(Ticket.id)).where(Ticket.property_id == pid, Ticket.status != "Resolved")),
        new_enquiries=db.scalar(select(func.count(Enquiry.id)).where(Enquiry.property_id == pid, Enquiry.status == "Requested")),
        menu=p.menu,
        beds=[
            {
                "id": b.id,
                "room": b.room,
                "label": b.label,
                "sharing": b.sharing,
                "active": b.active,
                "occupied": b.id in occupied,
            }
            for b in db.scalars(
                select(Bed).where(Bed.property_id == pid).order_by(Bed.room, Bed.label)
            )
        ],
        tenants=[
            {
                "id": t.id,
                "user_id": t.user_id,
                "name": db.get(User, t.user_id).name,
                "email": db.get(User, t.user_id).email,
                "bed_id": t.bed_id,
                "moveout": t.moveout,
            }
            for t in tenants
        ],
        joins=[
            {
                "id": r.id,
                "name": db.get(User, r.user_id).name,
                "email": db.get(User, r.user_id).email,
            }
            for r in db.scalars(
                select(JoinRequest).where(
                    JoinRequest.property_id == pid, JoinRequest.status == "Requested"
                )
            )
        ],
        requests=[
            ticket(r)
            for r in db.scalars(
                select(Ticket)
                .where(Ticket.property_id == pid)
                .order_by(Ticket.id.desc())
                .offset(offset).limit(100)
            )
        ],
        announcements=[
            notice(n)
            for n in db.scalars(
                select(Notice)
                .where(Notice.property_id == pid)
                .order_by(Notice.id.desc())
                .offset(offset)
                .limit(100)
            )
        ],
        enquiries=[
            enquiry_row(e, db)
            for e in db.scalars(
                select(Enquiry)
                .where(Enquiry.property_id == pid)
                .order_by(Enquiry.id.desc())
                .offset(offset).limit(100)
            )
        ],
        invoices=[
            inv(i)
            for i in db.scalars(
                select(Invoice)
                .where(Invoice.property_id == pid)
                .order_by(Invoice.id.desc())
                .offset(offset).limit(100)
            )
        ],
    )


@app.post("/api/owner/{pid}/announcements", status_code=201)
def announcement(pid: int, data: Announcement, u=Depends(current), db=Depends(get_db)):
    own(db, u, pid)
    n = Notice(property_id=pid, **data.model_dump())
    db.add(n)
    enqueue(db, n)
    db.commit()
    return {"id": n.id}


@app.put("/api/owner/{pid}/menu")
def menu(pid: int, data: Menu, u=Depends(current), db=Depends(get_db)):
    p = own(db, u, pid)
    p.menu = data.model_dump()
    db.commit()
    return {"ok": True}


@app.post("/api/owner/{pid}/invoices", status_code=201)
def invoice_create(pid: int, data: Billing, u=Depends(current), db=Depends(get_db)):
    own(db, u, pid)
    t = need(db.get(Tenancy, data.tenancy_id))
    if t.property_id != pid or not t.active:
        raise HTTPException(400, "Invalid tenancy")
    i = Invoice(
        user_id=t.user_id,
        property_id=pid,
        tenancy_id=t.id,
        period=data.period,
        amount=data.amount,
        due=data.due.isoformat(),
    )
    db.add(i)
    db.flush()
    audit(db, u, "invoice.create", i.id)
    db.commit()
    return inv(i)


@app.get("/api/invoices/{iid}/receipt")
def receipt(iid: int, u=Depends(current), db=Depends(get_db)):
    i = need(db.get(Invoice, iid))
    p = db.get(Property, i.property_id)
    if i.user_id != u.id and p.owner_id != u.id:
        raise HTTPException(403, "Receipt access denied")
    if i.status != "paid":
        raise HTTPException(409, "Invoice unpaid")
    return dict(
        invoice=inv(i),
        tenant=db.get(User, i.user_id).name,
        property=p.name,
        receipt_number=f"SN-{i.id:08d}",
        demonstration=bool(db.scalar(select(Audit.id).where(Audit.action == "demo.property", Audit.target == str(p.id)))),
    )


@app.post("/api/invoices/{iid}/order")
def create_order(iid: int, u=Depends(current), db=Depends(get_db)):
    i = need(db.scalar(select(Invoice).where(Invoice.id == iid).with_for_update()))
    if i.user_id != u.id:
        raise HTTPException(403, "Invoice access denied")
    if db.scalar(select(Audit.id).where(Audit.action == "demo.property", Audit.target == str(i.property_id))):
        raise HTTPException(409, "Demo invoices cannot collect real payments")
    if i.status == "paid":
        raise HTTPException(409, "Invoice already paid")
    prop = db.get(Property, i.property_id)
    keys = payments.config(i.property_id, getattr(prop, "merchant_account_id", None) if prop else None)
    if not i.order_id:
        recovered = payments.recover_order(i, keys)
        if recovered:
            i.order_id = recovered["id"]
            db.commit()
            return {"key": keys[0], "order_id": i.order_id, "amount": i.amount, "currency": "INR"}
        if db.scalar(select(Audit.id).where(Audit.action == "payment.order.attempt", Audit.target == str(i.id))):
            raise HTTPException(503, "Payment order is being reconciled. Retry shortly or contact support.")
        # Persist intent before the external side effect. An ambiguous timeout
        # must never silently create a second order, even if lookup is delayed.
        audit(db, u, "payment.order.attempt", i.id)
        db.commit()
        i = db.scalar(select(Invoice).where(Invoice.id == iid).with_for_update().execution_options(populate_existing=True))
        if i.order_id:
            return {"key": keys[0], "order_id": i.order_id, "amount": i.amount, "currency": "INR"}
        order = payments.gateway(
            "POST",
            "orders",
            keys,
            {
                "amount": i.amount,
                "currency": "INR",
                "receipt": f"staynest-{i.id}",
                "notes": {"invoice_id": str(i.id)},
            },
        )
        payments.validate_order(i, order)
        i.order_id = order["id"]
        db.commit()
    return {
        "key": keys[0],
        "order_id": i.order_id,
        "amount": i.amount,
        "currency": "INR",
    }


@app.post("/api/invoices/{iid}/verify")
def verify_payment(
    iid: int, data: PaymentVerify, u=Depends(current), db=Depends(get_db)
):
    i = need(db.scalar(select(Invoice).where(Invoice.id == iid).with_for_update()))
    if i.user_id != u.id:
        raise HTTPException(403, "Invoice access denied")
    keys = payments.config(i.property_id)
    if i.order_id != data.razorpay_order_id or not payments.signature(
        keys[1],
        f"{i.order_id}|{data.razorpay_payment_id}".encode(),
        data.razorpay_signature,
    ):
        raise HTTPException(400, "Invalid payment signature")
    p = payments.gateway("GET", "payments/" + data.razorpay_payment_id, keys)
    payments.capture(i, p)
    audit(db, u, "payment.captured", i.id)
    db.commit()
    return inv(i)


@app.post("/api/payments/webhook")
async def webhook(request: Request, db=Depends(get_db)):
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(503, "Webhook not configured")
    raw = await request.body()
    if len(raw) > 1000000:
        raise HTTPException(413, "Payload too large")
    if not payments.signature(
        secret, raw, request.headers.get("x-razorpay-signature", "")
    ):
        raise HTTPException(400, "Invalid signature")
    eid = request.headers.get("x-razorpay-event-id") or hashlib.sha256(raw).hexdigest()
    if len(eid) > 128:
        raise HTTPException(400, "Invalid event ID")
    if db.get(Webhook, eid):
        return {"ok": True}
    try:
        body = json.loads(raw)
    except ValueError:
        raise HTTPException(400, "Invalid JSON")
    if body.get("event") == "payment.captured":
        try:
            p = body["payload"]["payment"]["entity"]
        except (KeyError, TypeError):
            raise HTTPException(400, "Malformed event")
        i = db.scalar(
            select(Invoice)
            .where(Invoice.order_id == p.get("order_id"))
            .with_for_update()
        )
        if not i:
            # Do not permanently deduplicate a delivery racing the order commit.
            raise HTTPException(503, "Order not available yet; retry delivery")
        payments.config(i.property_id)
        payments.capture(i, p)
        audit(db, None, "webhook.captured", i.id)
    db.add(Webhook(event_id=eid))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if not db.get(Webhook, eid):
            raise
    return {"ok": True}


@app.post("/api/owner/{pid}/photo")
async def photo(
    pid: int, file: UploadFile = File(...), u=Depends(current), db=Depends(get_db)
):
    p = own(db, u, pid)
    raw = await file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(413, "Maximum photo size is 5 MB")
    try:
        image = Image.open(io.BytesIO(raw))
        if image.width * image.height > 20000000:
            raise HTTPException(422, "Image dimensions too large")
        image.load()
        image = image.convert("RGB")
        image.thumbnail((1600, 1600))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(422, "Invalid image")
    name = secrets.token_hex(20) + ".jpg"
    image.save(MEDIA / name, "JPEG", quality=85)
    photo_path = "/media/" + name
    p.photo = photo_path
    current_photos = list(p.photos) if (hasattr(p, "photos") and p.photos) else []
    if photo_path not in current_photos:
        current_photos.append(photo_path)
    p.photos = current_photos
    db.commit()
    return {"photo": p.photo, "photos": p.photos}


@app.get("/api/push/config")
def push_config():
    from .native_push import configured
    return {"public_key": os.getenv("VAPID_PUBLIC_KEY", ""), "native": {p: configured(p) for p in ("android", "ios")}}


@app.post("/api/push/native")
def native_subscribe(data: NativePushInput, u=Depends(current), db=Depends(get_db)):
    from .native_push import configured
    if not configured(data.platform):
        raise HTTPException(503, "Background notifications are not available yet")
    if data.platform == "ios" and (len(data.token) != 64 or any(c not in "0123456789abcdefABCDEF" for c in data.token)):
        raise HTTPException(422, "Invalid Apple notification token")
    throttle("push:" + str(u.id), 10, 3600)
    endpoint = f"native:{data.platform}:{data.token}"
    row = db.scalar(select(PushSubscription).where(PushSubscription.endpoint == endpoint))
    if row and row.user_id != u.id:
        raise HTTPException(409, "Turn off notifications for the previous account first")
    if not row:
        db.add(PushSubscription(user_id=u.id, endpoint=endpoint, keys={}))
    db.commit()
    return {"ok": True}


@app.post("/api/push/subscribe")
def subscribe(data: PushInput, u=Depends(current), db=Depends(get_db)):
    from urllib.parse import urlparse

    url = urlparse(data.endpoint)
    host = url.hostname or ""
    allowed = (
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
        "notify.windows.com",
    )
    if (
        url.scheme != "https"
        or url.port not in (None, 443)
        or url.username
        or url.password
        or not any(host == h or host.endswith("." + h) for h in allowed)
    ):
        raise HTTPException(422, "Unsupported push service endpoint")
    if not os.getenv("VAPID_PUBLIC_KEY"):
        raise HTTPException(503, "Push notifications are not configured")
    throttle("push:" + str(u.id), 10, 3600)
    row = db.scalar(
        select(PushSubscription).where(PushSubscription.endpoint == data.endpoint)
    )
    if row and row.user_id != u.id:
        raise HTTPException(
            409, "Unsubscribe this browser before using another account"
        )
    if row:
        row.keys = data.keys.model_dump()
    else:
        db.add(
            PushSubscription(
                user_id=u.id, endpoint=data.endpoint, keys=data.keys.model_dump()
            )
        )
    db.commit()
    return {"ok": True}


@app.delete("/api/push/subscriptions")
def unsubscribe(u=Depends(current), db=Depends(get_db)):
    ids = select(PushSubscription.id).where(PushSubscription.user_id == u.id)
    db.execute(delete(PushDelivery).where(PushDelivery.subscription_id.in_(ids)))
    db.execute(delete(PushSubscription).where(PushSubscription.user_id == u.id))
    db.commit()
    return {"ok": True}


app.mount("/media", StaticFiles(directory=MEDIA), name="media")
app.mount("/", StaticFiles(directory=WEB, html=True), name="web")

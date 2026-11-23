from datetime import datetime, timezone
from sqlalchemy import (
    String,
    Integer,
    Text,
    ForeignKey,
    DateTime,
    JSON,
    Boolean,
    UniqueConstraint,
    Index,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(80))
    password: Mapped[str] = mapped_column(Text)
    owner_approved: Mapped[bool] = mapped_column(default=False)
    phone: Mapped[str] = mapped_column(String(20), default="")
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    onboarding_intent: Mapped[str] = mapped_column(String(20), default="seeker", server_default="seeker")
    deleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))


class Session(Base):
    __tablename__ = "sessions"
    token: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    expires: Mapped[datetime] = mapped_column(DateTime)


class Property(Base):
    __tablename__ = "properties"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    area: Mapped[str] = mapped_column(String(80))
    address: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(20), default="Co-living")
    price: Mapped[int] = mapped_column(Integer)
    deposit: Mapped[int] = mapped_column(Integer, default=0)
    lat: Mapped[str] = mapped_column(String(32), default="17.4401")
    lon: Mapped[str] = mapped_column(String(32), default="78.3489")
    amen: Mapped[list] = mapped_column(JSON, default=list)
    photo: Mapped[str] = mapped_column(Text, default="")
    photos: Mapped[list] = mapped_column(JSON, default=list)
    video_url: Mapped[str] = mapped_column(String(500), default="")
    merchant_account_id: Mapped[str] = mapped_column(String(64), default="")
    published: Mapped[bool] = mapped_column(default=False)
    join_code: Mapped[str] = mapped_column(String(64), unique=True)
    phone: Mapped[str] = mapped_column(String(20), default="")
    closing: Mapped[str] = mapped_column(String(20), default="22:30")
    notice_days: Mapped[int] = mapped_column(default=30)
    rules: Mapped[str] = mapped_column(Text, default="")
    menu: Mapped[dict] = mapped_column(JSON, default=dict)
    updated: Mapped[datetime] = mapped_column(default=now)


class Bed(Base):
    __tablename__ = "beds"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    room: Mapped[str] = mapped_column(String(30))
    label: Mapped[str] = mapped_column(String(20))
    sharing: Mapped[int] = mapped_column(default=2)
    active: Mapped[bool] = mapped_column(default=True)
    __table_args__ = (UniqueConstraint("property_id", "room", "label"),)


class Tenancy(Base):
    __tablename__ = "tenancies"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    bed_id: Mapped[int] = mapped_column(ForeignKey("beds.id"))
    active: Mapped[bool] = mapped_column(default=True)
    joined: Mapped[datetime] = mapped_column(default=now)
    moveout: Mapped[str] = mapped_column(String(10), default="")
    __table_args__ = (
        Index(
            "one_active_bed",
            "bed_id",
            unique=True,
            postgresql_where=text("active = true"),
            sqlite_where=text("active = 1"),
        ),
        Index(
            "one_active_tenant",
            "user_id",
            unique=True,
            postgresql_where=text("active = true"),
            sqlite_where=text("active = 1"),
        ),
    )


class JoinRequest(Base):
    __tablename__ = "join_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"))
    status: Mapped[str] = mapped_column(String(20), default="Requested")
    __table_args__ = (UniqueConstraint("user_id", "property_id"),)


class Saved(Base):
    __tablename__ = "saved"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    property_id: Mapped[int] = mapped_column(
        ForeignKey("properties.id"), primary_key=True
    )


class Enquiry(Base):
    __tablename__ = "enquiries"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    kind: Mapped[str] = mapped_column(String(30))
    date: Mapped[str] = mapped_column(String(10))
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="Requested")


class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(30))
    detail: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="Open")
    reply: Mapped[str] = mapped_column(Text, default="")
    created: Mapped[datetime] = mapped_column(default=now)


class Notice(Base):
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    title: Mapped[str] = mapped_column(String(100))
    body: Mapped[str] = mapped_column(Text)
    type: Mapped[str] = mapped_column(String(30))
    created: Mapped[datetime] = mapped_column(default=now)


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    property_id: Mapped[int] = mapped_column(ForeignKey("properties.id"), index=True)
    tenancy_id: Mapped[int] = mapped_column(ForeignKey("tenancies.id"))
    period: Mapped[str] = mapped_column(String(7))
    amount: Mapped[int] = mapped_column(Integer)  # paise, never floating point
    due: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default="due")
    order_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    payment_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    __table_args__ = (UniqueConstraint("tenancy_id", "period"),)


class Webhook(Base):
    __tablename__ = "webhooks"
    event_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    created: Mapped[datetime] = mapped_column(default=now)


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    target: Mapped[str] = mapped_column(String(100))
    created: Mapped[datetime] = mapped_column(default=now)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    endpoint: Mapped[str] = mapped_column(Text, unique=True)
    keys: Mapped[dict] = mapped_column(JSON)


class PushDelivery(Base):
    __tablename__ = "push_deliveries"
    id: Mapped[int] = mapped_column(primary_key=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("push_subscriptions.id"), index=True
    )
    notice_id: Mapped[int] = mapped_column(ForeignKey("notices.id"))
    attempts: Mapped[int] = mapped_column(default=0)
    state: Mapped[str] = mapped_column(String(20), default="pending")
    next_attempt: Mapped[datetime] = mapped_column(default=now)
    __table_args__ = (UniqueConstraint("subscription_id", "notice_id"),)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires: Mapped[datetime] = mapped_column(DateTime)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created: Mapped[datetime] = mapped_column(default=now)


class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(20), index=True)
    code_hash: Mapped[str] = mapped_column(String(64))
    expires: Mapped[datetime] = mapped_column(DateTime)
    attempts: Mapped[int] = mapped_column(default=0)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created: Mapped[datetime] = mapped_column(default=now)

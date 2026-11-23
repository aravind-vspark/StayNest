from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Credentials(Strict):
    email: str = Field(
        min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    )
    password: str = Field(min_length=12, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize(cls, v):
        return v.strip().lower()


class Registration(Credentials):
    name: str = Field(min_length=2, max_length=80)
    onboarding_intent: Literal["seeker", "tenant", "owner"] = "seeker"


class AccountDeletion(Strict):
    password: str = Field(min_length=12, max_length=128)
    confirmation: Literal["DELETE"]


class PropertyInput(Strict):
    name: str = Field(min_length=2, max_length=80)
    area: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=500)
    type: Literal["Women", "Men", "Co-living"] = "Co-living"
    price: int = Field(ge=1000, le=100000)
    deposit: int = Field(ge=0, le=500000, default=0)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    amen: list[Literal["Wi-Fi", "Meals", "AC", "Laundry", "Gym"]] = Field(
        default_factory=list, max_length=5
    )
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    closing: str = Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$", default="22:30")
    notice_days: int = Field(ge=0, le=180, default=30)
    rules: str = Field(max_length=2000, default="")
    video_url: str = Field(max_length=500, default="")
    merchant_account_id: str = Field(max_length=64, default="")
    photos: list[str] = Field(default_factory=list, max_length=10)


class ForgotPasswordRequest(Strict):
    email: str = Field(
        min_length=5, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    )

    @field_validator("email")
    @classmethod
    def normalize(cls, v):
        return v.strip().lower()


class ResetPasswordRequest(Strict):
    token: str = Field(min_length=20, max_length=100)
    new_password: str = Field(min_length=12, max_length=128)


class SendOTPRequest(Strict):
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")


class VerifyOTPRequest(Strict):
    phone: str = Field(pattern=r"^\+?[0-9]{10,15}$")
    otp: str = Field(pattern=r"^[0-9]{6}$")


class BedInput(Strict):
    room: str = Field(min_length=1, max_length=30)
    label: str = Field(min_length=1, max_length=20)
    sharing: int = Field(ge=1, le=8)


class BedState(Strict):
    active: bool


class JoinInput(Strict):
    code: str = Field(min_length=20, max_length=64)


class Approval(Strict):
    bed_id: int


class EnquiryInput(Strict):
    kind: Literal["Video tour", "Booking enquiry"]
    date: date
    message: str = Field(max_length=500, default="")


class EnquiryState(Strict):
    status: Literal["Requested", "Confirmed", "Completed", "Cancelled"]


class TicketInput(Strict):
    title: str = Field(min_length=3, max_length=100)
    category: Literal[
        "Maintenance", "Internet", "Food", "Housekeeping", "Payment", "Other"
    ]
    detail: str = Field(min_length=3, max_length=1000)


class TicketUpdate(Strict):
    status: Literal["Open", "In progress", "Resolved"]
    reply: str = Field(min_length=1, max_length=1000)


class Announcement(Strict):
    title: str = Field(min_length=2, max_length=100)
    body: str = Field(min_length=2, max_length=1000)
    type: Literal["General update", "Food ready", "Gate timing", "Maintenance"]


class Menu(Strict):
    breakfast: str = Field(max_length=250)
    lunch: str = Field(max_length=250)
    dinner: str = Field(max_length=250)


class Moveout(Strict):
    date: date


class Billing(Strict):
    tenancy_id: int
    period: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    amount: int = Field(ge=100, le=10000000)
    due: date


class PaymentVerify(Strict):
    razorpay_order_id: str = Field(max_length=100)
    razorpay_payment_id: str = Field(max_length=100)
    razorpay_signature: str = Field(min_length=64, max_length=64)


class PushKeys(Strict):
    p256dh: str = Field(min_length=40, max_length=200, pattern=r"^[A-Za-z0-9_=-]+$")
    auth: str = Field(min_length=16, max_length=100, pattern=r"^[A-Za-z0-9_=-]+$")


class PushInput(Strict):
    endpoint: str = Field(min_length=20, max_length=2000)
    keys: PushKeys


class NativePushInput(Strict):
    platform: Literal["android", "ios"]
    token: str = Field(min_length=20, max_length=1024, pattern=r"^[A-Za-z0-9_:\-]+$")

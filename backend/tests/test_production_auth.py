import os
os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
os.environ["APP_ENV"] = "test"
os.environ["APP_ORIGIN"] = "http://testserver"
os.environ.pop("REDIS_URL", None)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.core import engine, DB, _local
from app.models import Base, User, Property

HEADERS = {"Origin": "http://testserver", "X-StayNest-Request": "1"}
PASSWORD = "test-password-long-enough"


@pytest.fixture(autouse=True)
def clean():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    _local.clear()
    yield


def test_password_recovery_lifecycle():
    client = TestClient(app, headers=HEADERS)
    email = "tenant@staynest.test"

    # Register user
    r = client.post("/api/auth/register", json={"email": email, "name": "Tenant One", "password": PASSWORD})
    assert r.status_code == 201

    # Request password reset
    r = client.post("/api/auth/forgot-password", json={"email": email})
    assert r.status_code == 200
    token = r.json().get("reset_token")
    assert token, "Development reset token should be returned"

    # Reset password with valid token
    new_password = "new-secure-password-1234"
    r = client.post("/api/auth/reset-password", json={"token": token, "new_password": new_password})
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    # Trying to reuse token must fail
    r = client.post("/api/auth/reset-password", json={"token": token, "new_password": new_password})
    assert r.status_code == 400

    # Old password fails login
    r = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert r.status_code == 401

    # New password succeeds login
    r = client.post("/api/auth/login", json={"email": email, "password": new_password})
    assert r.status_code == 200


def test_phone_otp_verification_flow():
    client = TestClient(app, headers=HEADERS)
    phone = "+919876543210"

    # Register user & verify initial phone_verified is False
    email = "user@staynest.test"
    r = client.post("/api/auth/register", json={"email": email, "name": "Phone User", "password": PASSWORD})
    assert r.status_code == 201

    r = client.get("/api/me")
    assert r.status_code == 200
    assert r.json()["phone_verified"] is False

    # Send OTP
    r = client.post("/api/auth/otp/send", json={"phone": phone})
    assert r.status_code == 200
    otp = r.json().get("otp")
    assert otp and len(otp) == 6

    # Verify with wrong OTP fails
    r = client.post("/api/auth/otp/verify", json={"phone": phone, "otp": "000000"})
    assert r.status_code == 400

    # Verify with correct OTP succeeds
    r = client.post("/api/auth/otp/verify", json={"phone": phone, "otp": otp})
    assert r.status_code == 200
    assert r.json()["verified"] is True

    # User profile reflects phone and verified status
    r = client.get("/api/me")
    assert r.status_code == 200
    assert r.json()["phone"] == phone
    assert r.json()["phone_verified"] is True


def test_property_video_and_merchant_fields():
    client = TestClient(app, headers=HEADERS)
    email = "owner@staynest.test"
    r = client.post("/api/auth/register", json={"email": email, "name": "Hostel Owner", "password": PASSWORD, "onboarding_intent": "owner"})
    assert r.status_code == 201

    prop_data = {
        "name": "Grand Green Stay",
        "area": "Gachibowli",
        "address": "Opposite Care Hospitals, Hyderabad",
        "type": "Co-living",
        "price": 9500,
        "deposit": 9500,
        "lat": 17.44,
        "lon": 78.35,
        "amen": ["Wi-Fi", "Meals", "AC"],
        "phone": "+919876543210",
        "closing": "22:30",
        "notice_days": 30,
        "rules": "Electricity extra",
        "video_url": "https://www.youtube.com/watch?v=sample123",
        "merchant_account_id": "acc_sample_owner_1",
    }
    r = client.post("/api/properties", json=prop_data)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["video_url"] == "https://www.youtube.com/watch?v=sample123"
    assert body["merchant_account_id"] == "acc_sample_owner_1"
    assert isinstance(body["photos"], list)

import os, json, hmac, hashlib, secrets

os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")
os.environ["APP_ENV"] = "test"
os.environ["APP_ORIGIN"] = "http://testserver"
os.environ.pop("REDIS_URL", None)
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.core import engine, DB, _local
from app.models import Base, User, Property, Invoice, Tenancy
from app import payments

HEADERS = {"Origin": "http://testserver", "X-StayNest-Request": "1"}
PASSWORD = "test-password-long-enough"


@pytest.fixture(autouse=True)
def clean():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    _local.clear()
    yield


def account(email):
    c = TestClient(app, headers=HEADERS)
    r = c.post(
        "/api/auth/register",
        json={"email": email, "name": "Test User", "password": PASSWORD},
    )
    assert r.status_code == 201, r.text
    return c


def property_for(c):
    r = c.post(
        "/api/properties",
        json={
            "name": "Test Hostel",
            "area": "Gachibowli",
            "address": "Test address Hyderabad",
            "price": 9500,
            "deposit": 9500,
            "lat": 17.44,
            "lon": 78.35,
            "phone": "9999999999",
            "amen": ["Wi-Fi"],
            "type": "Co-living",
        },
    )
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    with DB() as db:
        p = db.get(Property, pid)
        p.published = True
        db.get(User, p.owner_id).owner_approved = True
        code = p.join_code
        db.commit()
    return pid, code


def joined(owner, tenant, pid, code):
    r = owner.post(
        f"/api/owner/{pid}/beds", json={"room": "204", "label": "B", "sharing": 2}
    )
    assert r.status_code == 201, r.text
    bid = r.json()["id"]
    assert tenant.post("/api/join", json={"code": code}).status_code == 201
    j = owner.get(f"/api/owner/{pid}").json()["joins"][0]
    r = owner.post(f"/api/joins/{j['id']}/approve", json={"bed_id": bid})
    assert r.status_code == 200, r.text
    return bid, r.json()["id"]


def setup_invoice():
    owner = account("owner@example.test")
    tenant = account("tenant@example.test")
    pid, code = property_for(owner)
    bid, tid = joined(owner, tenant, pid, code)
    r = owner.post(
        f"/api/owner/{pid}/invoices",
        json={
            "tenancy_id": tid,
            "period": "2026-11",
            "amount": 950000,
            "due": "2026-11-05",
        },
    )
    assert r.status_code == 201, r.text
    return owner, tenant, pid, r.json()["id"]


def test_auth_csrf_and_private_data():
    owner = account("owner@example.test")
    outsider = account("other@example.test")
    pid, code = property_for(owner)
    assert outsider.get(f"/api/owner/{pid}").status_code == 403
    assert (
        outsider.post(
            f"/api/owner/{pid}/beds", json={"room": "1", "label": "A", "sharing": 2}
        ).status_code
        == 403
    )
    assert outsider.get("/api/tenant").status_code == 404
    assert (
        owner.post(
            "/api/auth/logout", headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )
    assert owner.get("/api/me").status_code == 200
    assert owner.post("/api/auth/logout").status_code == 200
    assert owner.get("/api/me").status_code == 401
    assert (
        owner.post(
            "/api/auth/login",
            json={"email": "owner@example.test", "password": "incorrect-password"},
        ).status_code
        == 401
    )


def test_join_requires_approval_and_bed_cannot_be_double_assigned():
    owner = account("owner@example.test")
    a = account("a@example.test")
    b = account("b@example.test")
    pid, code = property_for(owner)
    bid = owner.post(
        f"/api/owner/{pid}/beds", json={"room": "204", "label": "B", "sharing": 2}
    ).json()["id"]
    for c in [a, b]:
        assert c.post("/api/join", json={"code": code}).status_code == 201
    assert a.get("/api/tenant").status_code == 404
    joins = owner.get(f"/api/owner/{pid}").json()["joins"]
    assert (
        owner.post(
            f"/api/joins/{joins[0]['id']}/approve", json={"bed_id": bid}
        ).status_code
        == 200
    )
    assert (
        owner.post(
            f"/api/joins/{joins[1]['id']}/approve", json={"bed_id": bid}
        ).status_code
        == 409
    )
    assert owner.patch(f"/api/beds/{bid}", json={"active": False}).status_code == 409
    assert owner.get("/api/properties").json()[0]["beds"] == 0
    with DB() as db:
        t = db.scalar(select(Tenancy))
        uid = db.scalar(select(User.id).where(User.email == "b@example.test"))
        from sqlalchemy.exc import IntegrityError

        db.add(Tenancy(user_id=uid, property_id=pid, bed_id=bid))
        with pytest.raises(IntegrityError):
            db.commit()


def test_requests_menu_notices_and_checkout():
    owner = account("owner@example.test")
    tenant = account("tenant@example.test")
    outsider = account("other@example.test")
    pid, code = property_for(owner)
    bid, tid = joined(owner, tenant, pid, code)
    r = tenant.post(
        "/api/requests",
        json={
            "title": "Fan broken",
            "category": "Maintenance",
            "detail": "The fan has stopped working",
        },
    )
    assert r.status_code == 201
    rid = r.json()["id"]
    data = {"status": "Resolved", "reply": "Fan repaired"}
    assert outsider.patch(f"/api/requests/{rid}", json=data).status_code == 403
    assert tenant.patch(f"/api/requests/{rid}", json=data).status_code == 403
    assert owner.patch(f"/api/requests/{rid}", json=data).status_code == 200
    assert tenant.get("/api/tenant").json()["requests"][0]["reply"] == "Fan repaired"
    assert (
        owner.put(
            f"/api/owner/{pid}/menu",
            json={"breakfast": "Idli", "lunch": "Rice", "dinner": "Chapati"},
        ).status_code
        == 200
    )
    assert (
        owner.post(
            f"/api/owner/{pid}/announcements",
            json={
                "title": "Lunch ready",
                "body": "Join us in the dining hall",
                "type": "Food ready",
            },
        ).status_code
        == 201
    )
    state = tenant.get("/api/tenant").json()
    assert state["menu"]["lunch"] == "Rice"
    assert state["announcements"][0]["title"] == "Lunch ready"
    assert owner.post(f"/api/tenancies/{tid}/checkout").status_code == 200
    assert tenant.get("/api/tenant").status_code == 404
    assert owner.get("/api/properties").json()[0]["beds"] == 1


def test_invoice_access_and_gateway_is_not_simulated():
    owner, tenant, pid, iid = setup_invoice()
    other = account("other@example.test")
    assert other.post(f"/api/invoices/{iid}/order").status_code == 403
    assert tenant.post(f"/api/invoices/{iid}/order").status_code == 503
    assert other.get(f"/api/invoices/{iid}/receipt").status_code == 403
    assert tenant.get(f"/api/invoices/{iid}/receipt").status_code == 409
    assert (
        owner.post(
            f"/api/owner/{pid}/invoices",
            json={
                "tenancy_id": 1,
                "period": "2026-11",
                "amount": 950000,
                "due": "2026-11-05",
            },
        ).status_code
        == 409
    )


def test_payment_verification_and_idempotent_webhook(monkeypatch):
    owner, tenant, pid, iid = setup_invoice()
    monkeypatch.setenv("PAYMENT_PROPERTY_ID", str(pid))
    monkeypatch.setenv("RAZORPAY_KEY_ID", "test")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "websecret")
    calls = []

    def gateway(method, path, keys, data=None):
        calls.append(path)
        if method == "GET":
            return {"items": []}
        return {"id": "order_test", "receipt": f"staynest-{iid}", "amount": 950000, "currency": "INR"}

    monkeypatch.setattr(payments, "gateway", gateway)
    assert tenant.post(f"/api/invoices/{iid}/order").json()["order_id"] == "order_test"
    assert tenant.post(f"/api/invoices/{iid}/order").json()["order_id"] == "order_test"
    assert calls == [f"orders?receipt=staynest-{iid}&count=100", "orders"]
    forged = {
        "razorpay_order_id": "order_test",
        "razorpay_payment_id": "pay_test",
        "razorpay_signature": "0" * 64,
    }
    assert tenant.post(f"/api/invoices/{iid}/verify", json=forged).status_code == 400
    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test",
                    "order_id": "order_test",
                    "amount": 950000,
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    raw = json.dumps(payload).encode()
    sig = hmac.new(b"websecret", raw, hashlib.sha256).hexdigest()
    assert (
        tenant.post(
            "/api/payments/webhook",
            content=raw,
            headers={"x-razorpay-signature": "bad"},
        ).status_code
        == 400
    )
    for _ in range(2):
        assert (
            tenant.post(
                "/api/payments/webhook",
                content=raw,
                headers={"x-razorpay-signature": sig, "x-razorpay-event-id": "event_1"},
            ).status_code
            == 200
        )
    receipt = tenant.get(f"/api/invoices/{iid}/receipt")
    assert receipt.status_code == 200
    assert receipt.json()["invoice"]["status"] == "paid"


def test_wrong_amount_never_marks_paid(monkeypatch):
    owner, tenant, pid, iid = setup_invoice()
    monkeypatch.setenv("PAYMENT_PROPERTY_ID", str(pid))
    monkeypatch.setenv("RAZORPAY_KEY_ID", "test")
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "secret")
    monkeypatch.setenv("RAZORPAY_WEBHOOK_SECRET", "websecret")
    with DB() as db:
        i = db.get(Invoice, iid)
        i.order_id = "order_test"
        db.commit()
    body = json.dumps(
        {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test",
                        "order_id": "order_test",
                        "amount": 1,
                        "currency": "INR",
                        "status": "captured",
                    }
                }
            },
        }
    ).encode()
    sig = hmac.new(b"websecret", body, hashlib.sha256).hexdigest()
    assert (
        tenant.post(
            "/api/payments/webhook", content=body, headers={"x-razorpay-signature": sig}
        ).status_code
        == 400
    )
    assert tenant.get(f"/api/invoices/{iid}/receipt").status_code == 409


def test_listing_visibility_qr_and_bad_upload():
    owner = account("owner@example.test")
    other = account("other@example.test")
    pid, code = property_for(owner)
    assert owner.get(f"/api/owner/{pid}/qr").headers["content-type"] == "image/png"
    assert other.get(f"/api/owner/{pid}/qr").status_code == 403
    assert (
        owner.post(
            f"/api/owner/{pid}/photo",
            files={"file": ("x.html", b"<script>alert(1)</script>", "text/html")},
        ).status_code
        == 422
    )
    assert owner.post(f"/api/owner/{pid}/join-code/rotate").status_code == 200
    assert other.get("/api/join/" + code).status_code == 404
    with DB() as db:
        p = db.get(Property, pid)
        p.published = False
        db.commit()
    assert owner.get("/api/properties").json() == []


def test_enquiry_and_saved_are_user_scoped():
    from datetime import date

    owner = account("owner@example.test")
    tenant = account("tenant@example.test")
    other = account("other@example.test")
    pid, code = property_for(owner)
    assert tenant.put(f"/api/saved/{pid}").status_code == 200
    assert tenant.get("/api/saved").json() == [pid]
    assert other.get("/api/saved").json() == []
    r = tenant.post(
        f"/api/properties/{pid}/enquiries",
        json={
            "kind": "Video tour",
            "date": date.today().isoformat(),
            "message": "Please show room",
        },
    )
    assert r.status_code == 201
    assert other.get("/api/enquiries").json() == []
    assert (
        owner.patch(
            f"/api/enquiries/{r.json()['id']}", json={"status": "Confirmed"}
        ).status_code
        == 200
    )
    assert tenant.get("/api/enquiries").json()[0]["status"] == "Confirmed"


def test_order_recovery_after_lost_provider_response(monkeypatch):
    from fastapi import HTTPException
    from app.models import Audit
    owner, tenant, pid, iid = setup_invoice()
    for key, value in {"PAYMENT_PROPERTY_ID": str(pid), "RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "secret"}.items():
        monkeypatch.setenv(key, value)
    created = []
    visible = False
    order = {"id": "order_recovered", "receipt": f"staynest-{iid}", "amount": 950000, "currency": "INR"}

    def gateway(method, path, keys, data=None):
        if method == "GET":
            return {"items": [order] if visible else []}
        created.append(order)
        raise HTTPException(502, "Lost provider response")

    monkeypatch.setattr(payments, "gateway", gateway)
    assert tenant.post(f"/api/invoices/{iid}/order").status_code == 502
    # A delayed lookup must not result in a second external creation.
    assert tenant.post(f"/api/invoices/{iid}/order").status_code == 503
    assert len(created) == 1
    visible = True
    result = tenant.post(f"/api/invoices/{iid}/order")
    assert result.status_code == 200
    assert result.json()["order_id"] == order["id"]
    assert len(created) == 1


def test_unknown_webhook_is_retryable_until_order_is_saved(monkeypatch):
    from app.models import Webhook
    owner, tenant, pid, iid = setup_invoice()
    for key, value in {"PAYMENT_PROPERTY_ID": str(pid), "RAZORPAY_KEY_ID": "test", "RAZORPAY_KEY_SECRET": "secret", "RAZORPAY_WEBHOOK_SECRET": "websecret"}.items():
        monkeypatch.setenv(key, value)
    raw = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": "pay_race", "order_id": "order_race", "amount": 950000, "currency": "INR", "status": "captured"
    }}}}).encode()
    headers = {"x-razorpay-signature": hmac.new(b"websecret", raw, hashlib.sha256).hexdigest(), "x-razorpay-event-id": "race_event"}
    assert tenant.post("/api/payments/webhook", content=raw, headers=headers).status_code == 503
    with DB() as db:
        assert db.get(Webhook, "race_event") is None
        db.get(Invoice, iid).order_id = "order_race"
        db.commit()
    for _ in range(2):
        assert tenant.post("/api/payments/webhook", content=raw, headers=headers).status_code == 200
    assert tenant.get(f"/api/invoices/{iid}/receipt").status_code == 200


def test_former_tenant_keeps_scoped_billing_access():
    owner, tenant, pid, iid = setup_invoice()
    outsider = account("outsider@example.test")
    tid = owner.get(f"/api/owner/{pid}").json()["tenants"][0]["id"]
    assert owner.post(f"/api/tenancies/{tid}/checkout").status_code == 200
    assert tenant.get("/api/tenant").status_code == 404
    assert tenant.get("/api/me").json()["tenant"] is False
    assert [i["id"] for i in tenant.get("/api/invoices").json()] == [iid]
    assert outsider.get("/api/invoices").json() == []
    assert tenant.get("/api/invoices?offset=1").json() == []
    assert tenant.get("/api/invoices?limit=101").status_code == 422


def test_history_and_listing_pagination():
    owner = account("owner@example.test")
    pid, _ = property_for(owner)
    assert len(owner.get("/api/properties?limit=1").json()) == 1
    assert owner.get("/api/properties?offset=1").json() == []
    assert owner.get("/api/properties?limit=501").status_code == 422
    for n in range(101):
        assert owner.post(f"/api/owner/{pid}/announcements", json={"title": f"Notice {n}", "body": "Test announcement", "type": "General update"}).status_code == 201
    first = owner.get(f"/api/owner/{pid}").json()
    second = owner.get(f"/api/owner/{pid}?offset=100").json()
    assert len(first["announcements"]) == 100
    assert len(second["announcements"]) == 1
    assert first["announcements"][0]["id"] > second["announcements"][0]["id"]

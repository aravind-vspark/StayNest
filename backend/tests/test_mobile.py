from test_flows import clean, account, setup_invoice, PASSWORD
from app.core import DB, verify
from app.models import User, Session, Invoice, Tenancy, Property, PushDelivery
from sqlalchemy import select


def test_account_deletion_requires_password_and_revokes_access():
    owner, tenant, pid, iid = setup_invoice()
    before = tenant.get("/api/me").json()
    assert tenant.request("DELETE", "/api/account", json={"password": "incorrect-password", "confirmation": "DELETE"}).status_code == 401
    assert tenant.get("/api/me").status_code == 200
    assert tenant.request("DELETE", "/api/account", json={"password": PASSWORD, "confirmation": "DELETE"}).status_code == 200
    assert tenant.get("/api/me").status_code == 401
    assert tenant.post("/api/auth/login", json={"email": before["email"], "password": PASSWORD}).status_code == 401
    with DB() as db:
        u = db.get(User, before["id"])
        assert u.deleted and u.email != before["email"] and u.name == "Deleted account"
        assert not verify(PASSWORD, u.password)
        assert db.scalar(select(Session).where(Session.user_id == u.id)) is None
        assert db.get(Invoice, iid).user_id == u.id
        assert not db.scalar(select(Tenancy).where(Tenancy.user_id == u.id)).active
        assert db.get(Property, pid).published


def test_owner_deletion_unpublishes_properties():
    owner, tenant, pid, iid = setup_invoice()
    assert owner.request("DELETE", "/api/account", json={"password": PASSWORD, "confirmation": "DELETE"}).status_code == 200
    assert owner.get("/api/me").status_code == 401
    assert tenant.get("/api/properties").json() == []
    with DB() as db:
        assert not db.get(Property, pid).published
        assert db.get(Property, pid).phone == ""


def test_native_push_uses_outbox_and_rechecks_tenancy(monkeypatch):
    from app import worker
    owner, tenant, pid, iid = setup_invoice()
    monkeypatch.setenv("FCM_SERVICE_ACCOUNT_FILE", "test-only-not-read.json")
    assert tenant.post("/api/push/native", json={"platform": "android", "token": "test_token_" + "a" * 50}).status_code == 200
    assert tenant.post("/api/push/native", json={"platform": "ios", "token": "a" * 64}).status_code == 503
    sent = []
    monkeypatch.setattr(worker, "native_send", lambda endpoint, notice_id: sent.append(notice_id))
    assert owner.post(f"/api/owner/{pid}/announcements", json={"title": "Dinner ready", "body": "Please join us", "type": "Food ready"}).status_code == 201
    assert worker.deliver_once() is True
    assert len(sent) == 1
    assert owner.post(f"/api/owner/{pid}/announcements", json={"title": "Later update", "body": "Test announcement", "type": "General update"}).status_code == 201
    tid = owner.get(f"/api/owner/{pid}").json()["tenants"][0]["id"]
    assert owner.post(f"/api/tenancies/{tid}/checkout").status_code == 200
    assert worker.deliver_once() is True
    assert len(sent) == 1
    with DB() as db:
        assert set(db.scalars(select(PushDelivery.state))) == {"sent", "cancelled"}

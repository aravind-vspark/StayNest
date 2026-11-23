from test_flows import account, property_for, joined, clean
from app.core import DB
from app.models import PushDelivery, PushSubscription
from sqlalchemy import select


def test_push_endpoint_allowlist_and_delivery_outbox(monkeypatch):
    monkeypatch.setenv("VAPID_PUBLIC_KEY", "test-public-key")
    owner = account("owner@example.test")
    tenant = account("tenant@example.test")
    pid, code = property_for(owner)
    joined(owner, tenant, pid, code)
    payload = {
        "endpoint": "https://127.0.0.1/private",
        "keys": {"p256dh": "a" * 87, "auth": "b" * 22},
    }
    assert tenant.post("/api/push/subscribe", json=payload).status_code == 422
    payload["endpoint"] = "https://fcm.googleapis.com/fcm/send/test-endpoint"
    assert tenant.post("/api/push/subscribe", json=payload).status_code == 200
    assert (
        owner.post(
            f"/api/owner/{pid}/announcements",
            json={
                "title": "Dinner ready",
                "body": "Dinner is served",
                "type": "Food ready",
            },
        ).status_code
        == 201
    )
    with DB() as db:
        assert len(db.scalars(select(PushDelivery)).all()) == 1
    assert tenant.delete("/api/push/subscriptions").status_code == 200
    with DB() as db:
        assert not db.scalars(select(PushDelivery)).all()
        assert not db.scalars(select(PushSubscription)).all()

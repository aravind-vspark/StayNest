import pytest
from sqlalchemy import select, func
from fastapi.testclient import TestClient
from test_flows import clean, account, HEADERS, PASSWORD
from app.core import DB
from app.main import app
from app.models import User, Property, Tenancy, Invoice, Bed
from app.demo import seed_demo
from app import core


def test_demo_is_additive_idempotent_and_connected():
    real = account("existing@example.test")
    original = real.get("/api/me").json()["id"]
    with DB() as db:
        assert seed_demo(db, PASSWORD) is True
        counts = [db.scalar(select(func.count(model.id))) for model in (User, Property, Tenancy, Invoice, Bed)]
        assert counts == [19, 6, 12, 24, 57]
        assert seed_demo(db, "different-password-long") is False
        assert counts == [db.scalar(select(func.count(model.id))) for model in (User, Property, Tenancy, Invoice, Bed)]
    tenant = TestClient(app, headers=HEADERS)
    assert tenant.post("/api/auth/login", json={"email": "tenant@example.test", "password": PASSWORD}).status_code == 200
    state = tenant.get("/api/tenant").json()
    assert state["property"]["name"] == "The Green House"
    assert len(state["invoices"]) == 2
    due = next(i for i in state["invoices"] if i["status"] == "due")
    assert tenant.post(f"/api/invoices/{due['id']}/order").status_code == 409
    paid = next(i for i in state["invoices"] if i["status"] == "paid")
    assert tenant.get(f"/api/invoices/{paid['id']}/receipt").status_code == 200
    owner = TestClient(app, headers=HEADERS)
    assert owner.post("/api/auth/login", json={"email": "owner@example.test", "password": PASSWORD}).status_code == 200
    owner_state = owner.get(f"/api/owner/{state['property']['id']}").json()
    assert len(owner_state["tenants"]) == 2
    assert len(owner_state["joins"]) == 1
    assert len(owner.get("/api/properties").json()) == 6
    assert real.get("/api/me").json()["id"] == original
    added = account("new@example.test")
    assert added.get("/api/me").json()["id"] != original
    with DB() as db:
        assert db.scalar(select(func.count(User.id))) == 20


def test_demo_refuses_email_collisions_without_changing_users():
    existing = account("owner@example.test")
    with DB() as db:
        user = db.scalar(select(User))
        stored = user.password
        with pytest.raises(SystemExit, match="already exists"):
            seed_demo(db, PASSWORD)
        assert db.scalar(select(func.count(Property.id))) == 0
        assert db.get(User, user.id).password == stored
        assert not db.get(User, user.id).owner_approved


def test_demo_is_disabled_in_production(monkeypatch):
    monkeypatch.setattr(core, "ENV", "production")
    with DB() as db:
        with pytest.raises(SystemExit, match="disabled in production"):
            seed_demo(db, PASSWORD)
        assert db.scalar(select(func.count(User.id))) == 0

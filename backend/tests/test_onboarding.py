from test_flows import clean, account, property_for, HEADERS, PASSWORD
from fastapi.testclient import TestClient
from app.main import app


def test_seeker_becomes_tenant_without_losing_account_history():
    owner = account("owner@example.test")
    pid, code = property_for(owner)
    seeker = TestClient(app, headers=HEADERS)
    assert seeker.post("/api/auth/register", json={"name": "Future Resident", "email": "seeker@example.test",
        "password": PASSWORD, "onboarding_intent": "seeker"}).status_code == 201
    before = seeker.get("/api/me").json()
    assert before["onboarding_intent"] == "seeker"
    assert before["tenant"] is False
    assert before["active_property"] is None
    assert seeker.put(f"/api/saved/{pid}").status_code == 200
    from datetime import date
    assert seeker.post(f"/api/properties/{pid}/enquiries", json={"kind": "Video tour", "date": date.today().isoformat()}).status_code == 201
    assert seeker.post("/api/join", json={"code": code}).status_code == 201
    pending = seeker.get("/api/me").json()
    assert pending["join_requests"][0]["status"] == "Requested"
    assert seeker.get("/api/tenant").status_code == 404
    bid = owner.post(f"/api/owner/{pid}/beds", json={"room": "101", "label": "A", "sharing": 2}).json()["id"]
    jid = pending["join_requests"][0]["id"]
    assert owner.post(f"/api/joins/{jid}/approve", json={"bed_id": bid}).status_code == 200
    after = seeker.get("/api/me").json()
    assert after["id"] == before["id"]
    assert after["tenant"] is True
    assert after["active_property"]["id"] == pid
    assert after["join_requests"][0]["status"] == "Approved"
    assert seeker.get("/api/saved").json() == [pid]
    assert len(seeker.get("/api/enquiries").json()) == 1
    assert seeker.get("/api/tenant").status_code == 200


def test_owner_intent_never_grants_verification_or_tenant_access():
    c = TestClient(app, headers=HEADERS)
    assert c.post("/api/auth/register", json={"name": "New Owner", "email": "owner@example.test", "password": PASSWORD,
        "onboarding_intent": "owner"}).status_code == 201
    me = c.get("/api/me").json()
    assert me["onboarding_intent"] == "owner"
    assert me["owner_approved"] is False
    assert me["tenant"] is False
    assert c.get("/api/tenant").status_code == 404
    assert c.post("/api/auth/register", json={"name": "Bad Role", "email": "bad@example.test", "password": PASSWORD,
        "onboarding_intent": "admin"}).status_code == 422

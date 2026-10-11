"""Tests for the weekly code rotation cron endpoints and subscriber eligibility."""
import os
import time
import uuid
import pytest
import requests
import pymongo
from datetime import datetime, timedelta, timezone

def _frontend_env(key: str) -> str:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line.strip().split('=', 1)[1].strip('"').strip("'")
    return os.environ[key]


BASE_URL = _frontend_env('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "abpt2025"


def _env(key: str, default=None):
    try:
        with open('/app/backend/.env') as f:
            for line in f:
                if line.startswith(f"{key}="):
                    return line.strip().split('=', 1)[1].strip('"').strip("'")
    except Exception:
        pass
    return os.environ.get(key, default)


WEBHOOK_SECRET = _env("WEBHOOK_CRON_SECRET")
MONGO_URL = _env("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = _env("DB_NAME", "test_database")


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def admin_headers(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def db():
    mc = pymongo.MongoClient(MONGO_URL)
    yield mc[DB_NAME]
    mc.close()


# ---- Cron auth ----
class TestCronAuth:
    def test_missing_auth_rejected(self, s):
        r = s.post(f"{API}/cron/rotate-codes", json={})
        assert r.status_code == 401

    def test_wrong_token_rejected(self, s):
        r = s.post(f"{API}/cron/rotate-codes",
                   json={}, headers={"Authorization": "Bearer wrong"})
        assert r.status_code == 401

    def test_valid_token_accepted(self, s):
        assert WEBHOOK_SECRET, "WEBHOOK_CRON_SECRET not loaded"
        wid = f"test-{uuid.uuid4()}"
        r = s.post(f"{API}/cron/rotate-codes",
                   json={},
                   headers={"Authorization": f"Bearer {WEBHOOK_SECRET}",
                            "X-Webhook-Id": wid})
        assert r.status_code == 200, r.text
        j = r.json()
        assert j.get("ok") is True
        assert j.get("run_id") == wid

    def test_idempotent_duplicate(self, s):
        wid = f"test-dup-{uuid.uuid4()}"
        hdrs = {"Authorization": f"Bearer {WEBHOOK_SECRET}", "X-Webhook-Id": wid}
        r1 = s.post(f"{API}/cron/rotate-codes", json={}, headers=hdrs)
        assert r1.status_code == 200
        # Let background task settle before duplicate
        time.sleep(1.5)
        r2 = s.post(f"{API}/cron/rotate-codes", json={}, headers=hdrs)
        assert r2.status_code == 200
        assert r2.json().get("duplicate") is True


# ---- Fresh run rotates codes ----
class TestRotationApplies:
    def test_fresh_run_rotates_active_clients(self, s, admin_headers, db):
        # Create an admin-source client
        email = f"TEST_rot_{int(time.time())}@example.com"
        r = s.post(f"{API}/admin/clients",
                   json={"name": "TEST Rot", "email": email}, headers=admin_headers)
        assert r.status_code == 200
        c = r.json()
        old_code = c["code"]

        # Clear rotation marker so maybe_rotate_codes doesn't short-circuit
        db.system.delete_one({"key": "last_code_rotation"})

        wid = f"test-fresh-{uuid.uuid4()}"
        hdrs = {"Authorization": f"Bearer {WEBHOOK_SECRET}", "X-Webhook-Id": wid}
        r2 = s.post(f"{API}/cron/rotate-codes", json={}, headers=hdrs)
        assert r2.status_code == 200
        # Wait for background rotation to complete
        time.sleep(3)

        after = db.clients.find_one({"id": c["id"]}, {"_id": 0})
        assert after["code"] != old_code, "Code did not change after fresh cron run"
        assert len(after["code"]) == 4 and after["code"].isdigit()
        # Expiry must be a valid ISO datetime in the future
        exp = datetime.fromisoformat(after["code_expires_at"])
        assert exp > datetime.now(timezone.utc)
        # Cleanup
        s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_lapsed_subscriber_skipped(self, s, admin_headers, db):
        """A stripe-source client with lapsed subscription must NOT get a new code."""
        past = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        future = (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()
        # Create admin-source clients and then force them into stripe source via DB
        email = f"TEST_lapsed_{int(time.time())}@example.com"
        r = s.post(f"{API}/admin/clients",
                   json={"name": "Lapsed Sub", "email": email}, headers=admin_headers)
        assert r.status_code == 200
        cid = r.json()["id"]
        db.clients.update_one(
            {"id": cid},
            {"$set": {
                "source": "stripe",
                "subscription_expires_at": past,
                "code": "9999",
                "code_expires_at": past,
            }},
        )
        email_live = f"TEST_live_{int(time.time())}@example.com"
        r2 = s.post(f"{API}/admin/clients",
                    json={"name": "Live Sub", "email": email_live}, headers=admin_headers)
        assert r2.status_code == 200
        live_id = r2.json()["id"]
        db.clients.update_one(
            {"id": live_id},
            {"$set": {"source": "stripe", "subscription_expires_at": future,
                      "code": "1111", "code_expires_at": past}},
        )
        live = {"id": live_id}

        # Trigger fresh rotation
        db.system.delete_one({"key": "last_code_rotation"})
        hdrs = {"Authorization": f"Bearer {WEBHOOK_SECRET}",
                "X-Webhook-Id": f"test-skip-{uuid.uuid4()}"}
        r3 = s.post(f"{API}/cron/rotate-codes", json={}, headers=hdrs)
        assert r3.status_code == 200
        time.sleep(3)

        lapsed_after = db.clients.find_one({"id": cid}, {"_id": 0})
        live_after = db.clients.find_one({"id": live["id"]}, {"_id": 0})
        assert lapsed_after["code"] == "9999", \
            f"Lapsed subscriber was rotated (code={lapsed_after['code']})"
        assert live_after["code"] != "1111", \
            "Active subscriber was NOT rotated"

        # Cleanup
        for e in (email, email_live):
            for row in db.clients.find({"email": e}):
                s.delete(f"{API}/admin/clients/{row['id']}", headers=admin_headers)

    def test_expiry_is_next_sunday_dublin(self, s, admin_headers, db):
        """code_expires_at must be the upcoming Sunday 06:00 Europe/Dublin."""
        email = f"TEST_exp_{int(time.time())}@example.com"
        r = s.post(f"{API}/admin/clients",
                   json={"name": "Exp", "email": email}, headers=admin_headers)
        assert r.status_code == 200
        c = r.json()
        exp = datetime.fromisoformat(c["code_expires_at"]).astimezone(timezone.utc)
        # Dublin anchor: convert to Dublin, check it's Sunday 06:00
        try:
            from zoneinfo import ZoneInfo
            dub = exp.astimezone(ZoneInfo("Europe/Dublin"))
            assert dub.weekday() == 6, f"expiry {dub} not a Sunday"
            assert dub.hour == 6 and dub.minute == 0, f"expiry {dub} not 06:00"
        except ImportError:
            pass
        s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)


# ---- Admin rotation-status ----
class TestRotationStatus:
    def test_requires_admin(self, s):
        r = s.get(f"{API}/admin/rotation-status")
        assert r.status_code == 401

    def test_shape(self, s, admin_headers):
        r = s.get(f"{API}/admin/rotation-status", headers=admin_headers)
        assert r.status_code == 200, r.text
        j = r.json()
        for key in ("last_rotated_at", "last_rotated_count", "rotated_this_week",
                    "next_rotation_at", "cron_configured"):
            assert key in j, f"missing key {key}"
        assert j["cron_configured"] is True


# ---- Admin force rotate + per-client regen ----
class TestAdminRotation:
    def test_admin_force_rotate(self, s, admin_headers):
        r = s.post(f"{API}/admin/rotate-codes", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json().get("rotated"), list)

    def test_regen_single_client(self, s, admin_headers):
        email = f"TEST_regen_{int(time.time())}@example.com"
        r = s.post(f"{API}/admin/clients",
                   json={"name": "Regen", "email": email}, headers=admin_headers)
        assert r.status_code == 200
        c = r.json()
        old = c["code"]
        r2 = s.post(f"{API}/admin/clients/{c['id']}/regenerate-code",
                    headers=admin_headers)
        assert r2.status_code == 200
        new = r2.json()["code"]
        assert new != old
        assert len(new) == 4
        s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_admin_created_client_has_source_admin(self, s, admin_headers, db):
        email = f"TEST_src_{int(time.time())}@example.com"
        r = s.post(f"{API}/admin/clients",
                   json={"name": "Src", "email": email}, headers=admin_headers)
        assert r.status_code == 200
        cid = r.json()["id"]
        row = db.clients.find_one({"id": cid}, {"_id": 0})
        assert row.get("source") == "admin"
        assert row.get("code") and len(row["code"]) == 4
        s.delete(f"{API}/admin/clients/{cid}", headers=admin_headers)


# ---- Regression: login + menu ----
class TestClientLoginRegression:
    def test_nut_test_login_or_regen(self, s, admin_headers):
        """nut_test@example.com must be able to log in with its current rotated code."""
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        nut = next((c for c in clients if c["email"] == "nut_test@example.com"), None)
        assert nut is not None, "seed client missing"
        # Regenerate to guarantee a fresh non-expired code (clock may be ahead)
        r = s.post(f"{API}/admin/clients/{nut['id']}/regenerate-code",
                   headers=admin_headers)
        assert r.status_code == 200
        code = r.json()["code"]
        r2 = s.post(f"{API}/auth/login",
                    json={"email": "nut_test@example.com", "code": code})
        assert r2.status_code == 200, r2.text
        token = r2.json()["token"]
        # menu + shopping list
        hdrs = {"Authorization": f"Bearer {token}"}
        m = s.get(f"{API}/menu/current", headers=hdrs)
        assert m.status_code == 200
        mj = m.json()
        assert "days" in mj and len(mj["days"]) == 7
        # targets + day_scales must exist
        assert "targets" in mj, "targets missing from /menu/current"
        assert "day_scales" in mj, "day_scales missing from /menu/current"
        sl = s.get(f"{API}/menu/shopping-list", headers=hdrs)
        assert sl.status_code == 200
        assert isinstance(sl.json().get("items"), list)

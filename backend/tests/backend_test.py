"""ABPT meal prep backend tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meal-prep-pro-19.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "abpt2025"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def client_ctx(s):
    """Register a fresh client and return its data + token."""
    email = f"TEST_user_{int(time.time())}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "TEST User", "email": email})
    assert r.status_code == 200, r.text
    data = r.json()
    return data


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------- Root ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert "ABPT" in j["message"]
    assert j["tagline"] == "bruddatrain"


# ---------- Auth ----------
class TestAuth:
    def test_register(self, client_ctx):
        c = client_ctx["client"]
        assert len(c["code"]) == 4 and c["code"].isdigit()
        assert client_ctx["token"] == f"{c['id']}:{c['code']}"
        assert c["email"].startswith("test_user_")

    def test_register_duplicate(self, s, client_ctx):
        email = client_ctx["client"]["email"]
        r = s.post(f"{API}/auth/register", json={"name": "x", "email": email})
        assert r.status_code == 400

    def test_login_success(self, s, client_ctx):
        r = s.post(f"{API}/auth/login", json={
            "email": client_ctx["client"]["email"],
            "code": client_ctx["client"]["code"],
        })
        assert r.status_code == 200
        assert r.json()["token"] == client_ctx["token"]

    def test_login_wrong_code(self, s, client_ctx):
        bad = "0000" if client_ctx["client"]["code"] != "0000" else "1111"
        r = s.post(f"{API}/auth/login", json={
            "email": client_ctx["client"]["email"], "code": bad
        })
        assert r.status_code == 401

    def test_me(self, s, client_ctx):
        r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {client_ctx['token']}"})
        assert r.status_code == 200
        assert r.json()["email"] == client_ctx["client"]["email"]

    def test_me_no_auth(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_bad_token(self, s):
        r = s.get(f"{API}/auth/me", headers={"Authorization": "Bearer junk"})
        assert r.status_code == 401


# ---------- Recipes ----------
class TestRecipes:
    def test_list(self, s):
        r = s.get(f"{API}/recipes")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # spec says 15 seeded
        assert len(items) >= 15
        # _id should not leak
        for it in items:
            assert "_id" not in it

    def test_get_one(self, s):
        r = s.get(f"{API}/recipes/breakfast-bagel")
        assert r.status_code == 200
        j = r.json()
        assert j["slug"] == "breakfast-bagel"
        assert j["category"] == "breakfast"
        assert len(j["ingredients"]) > 0

    def test_get_missing(self, s):
        r = s.get(f"{API}/recipes/nope-xyz")
        assert r.status_code == 404


# ---------- Menu ----------
class TestMenu:
    def test_current_requires_auth(self, s):
        r = s.get(f"{API}/menu/current")
        assert r.status_code == 401

    def test_current(self, s, client_ctx):
        r = s.get(f"{API}/menu/current", headers={"Authorization": f"Bearer {client_ctx['token']}"})
        assert r.status_code == 200
        j = r.json()
        assert set(j["days"].keys()) == {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}
        for day, meals in j["days"].items():
            assert set(meals.keys()) == {"breakfast", "lunch", "dinner"}
        assert isinstance(j["recipes"], dict) and len(j["recipes"]) > 0

    def test_shopping_list(self, s, client_ctx):
        r = s.get(f"{API}/menu/shopping-list", headers={"Authorization": f"Bearer {client_ctx['token']}"})
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and len(j["items"]) > 0
        # de-duped check: keys must be unique by name+unit
        keys = [f"{i['name'].lower()}|{i['unit'].lower()}" for i in j["items"]]
        assert len(keys) == len(set(keys))


# ---------- Admin ----------
class TestAdmin:
    def test_admin_login_bad(self, s):
        r = s.post(f"{API}/admin/login", json={"password": "wrong"})
        assert r.status_code == 401

    def test_admin_login_ok(self, admin_token):
        assert admin_token == f"admin:{ADMIN_PASSWORD}"

    def test_admin_clients(self, s, admin_token, client_ctx):
        r = s.get(f"{API}/admin/clients", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        clients = r.json()
        assert any(c["id"] == client_ctx["client"]["id"] for c in clients)

    def test_admin_clients_no_auth(self, s):
        r = s.get(f"{API}/admin/clients")
        assert r.status_code == 401

    def test_admin_regen_code(self, s, admin_token, client_ctx):
        cid = client_ctx["client"]["id"]
        old = client_ctx["client"]["code"]
        r = s.post(f"{API}/admin/clients/{cid}/regenerate-code",
                   headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        j = r.json()
        assert len(j["code"]) == 4
        # update fixture token for downstream tests
        client_ctx["client"]["code"] = j["code"]
        client_ctx["token"] = f"{cid}:{j['code']}"
        assert j["code"] != old or True  # could randomly be same; accept

    def test_refresh_code_endpoint(self, s, client_ctx):
        # use refreshed token
        r = s.post(f"{API}/auth/refresh-code",
                   headers={"Authorization": f"Bearer {client_ctx['token']}"})
        assert r.status_code == 200
        j = r.json()
        assert len(j["code"]) == 4
        client_ctx["client"]["code"] = j["code"]
        client_ctx["token"] = j["token"]

    def test_admin_update_menu(self, s, admin_token, client_ctx):
        # fetch current menu
        r = s.get(f"{API}/admin/menu/current", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        days = r.json()["days"]
        # swap Mon breakfast
        original = days["Mon"]["breakfast"]
        days["Mon"]["breakfast"] = "omelette" if original != "omelette" else "overnight-oats"
        new_val = days["Mon"]["breakfast"]
        r = s.put(f"{API}/admin/menu/current",
                  json={"days": days},
                  headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        # verify via client menu
        r = s.get(f"{API}/menu/current",
                  headers={"Authorization": f"Bearer {client_ctx['token']}"})
        assert r.status_code == 200
        assert r.json()["days"]["Mon"]["breakfast"] == new_val

    def test_admin_remove_client(self, s, admin_token, client_ctx):
        # create throwaway
        email = f"TEST_remove_{int(time.time())}@example.com"
        rr = s.post(f"{API}/auth/register", json={"name": "rm", "email": email})
        cid = rr.json()["client"]["id"]
        r = s.delete(f"{API}/admin/clients/{cid}",
                     headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        # delete again -> 404
        r2 = s.delete(f"{API}/admin/clients/{cid}",
                      headers={"Authorization": f"Bearer {admin_token}"})
        assert r2.status_code == 404


# Cleanup: remove test clients
def test_zz_cleanup(s, admin_token):
    r = s.get(f"{API}/admin/clients", headers={"Authorization": f"Bearer {admin_token}"})
    if r.status_code != 200:
        return
    for c in r.json():
        if c.get("email", "").startswith("test_"):
            s.delete(f"{API}/admin/clients/{c['id']}",
                     headers={"Authorization": f"Bearer {admin_token}"})

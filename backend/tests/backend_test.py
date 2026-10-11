"""ABPT meal prep backend tests - covers admin client mgmt, code-only auth, Stripe checkout, recipes & menu."""
import os
import time
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "abpt2025"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def created_client(s, admin_headers):
    """Admin creates a client; yields {client_dict} and cleans up afterwards."""
    email = f"test_client_{int(time.time())}@example.com"
    r = s.post(f"{API}/admin/clients", json={"name": "TEST User", "email": email}, headers=admin_headers)
    assert r.status_code == 200, r.text
    client = r.json()
    yield client
    try:
        s.delete(f"{API}/admin/clients/{client['id']}", headers=admin_headers)
    except Exception:
        pass


# ---------- Root & Pricing ----------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    assert j["tagline"] == "bruddatrain"


def test_pricing(s):
    r = s.get(f"{API}/pricing")
    assert r.status_code == 200
    j = r.json()
    assert j["price"] == 14.99
    assert j["currency"] == "eur"
    assert j["period_days"] == 30
    assert "label" in j


# ---------- Admin Auth ----------
class TestAdminAuth:
    def test_admin_login_success(self, s):
        r = s.post(f"{API}/admin/login", json={"password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["token"].startswith("admin:")

    def test_admin_login_wrong_password(self, s):
        r = s.post(f"{API}/admin/login", json={"password": "wrong"})
        assert r.status_code == 401

    def test_admin_clients_requires_auth(self, s):
        r = s.get(f"{API}/admin/clients")
        assert r.status_code == 401


# ---------- Admin Client Mgmt ----------
class TestAdminClients:
    def test_create_client(self, created_client):
        c = created_client
        assert c["code"] is not None and len(c["code"]) == 4 and c["code"].isdigit()
        assert c["code_expires_at"] is not None
        assert c["is_subscribed"] is False

    def test_list_clients_contains_created(self, s, admin_headers, created_client):
        r = s.get(f"{API}/admin/clients", headers=admin_headers)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert created_client["id"] in ids
        # is_subscribed flag present
        for c in r.json():
            assert "is_subscribed" in c

    def test_regenerate_code(self, s, admin_headers, created_client):
        old_code = created_client["code"]
        r = s.post(f"{API}/admin/clients/{created_client['id']}/regenerate-code", headers=admin_headers)
        assert r.status_code == 200
        new_code = r.json()["code"]
        assert len(new_code) == 4 and new_code.isdigit()
        # update the fixture in-place so later tests use new code
        created_client["code"] = new_code

    def test_rotate_codes(self, s, admin_headers, created_client):
        r = s.post(f"{API}/admin/rotate-codes", headers=admin_headers)
        assert r.status_code == 200
        rotated = r.json()["rotated"]
        assert isinstance(rotated, list)
        # the created (non-subscribed) client should be in rotated set
        emails = [c["email"] for c in rotated]
        assert created_client["email"] in emails
        # update local code
        for c in rotated:
            if c["email"] == created_client["email"]:
                created_client["code"] = c["code"]

    def test_create_duplicate_email(self, s, admin_headers, created_client):
        r = s.post(f"{API}/admin/clients",
                   json={"name": "x", "email": created_client["email"]},
                   headers=admin_headers)
        assert r.status_code == 400


# ---------- Auth (code login) ----------
class TestAuthLogin:
    def test_login_success(self, s, created_client):
        r = s.post(f"{API}/auth/login",
                   json={"email": created_client["email"], "code": created_client["code"]})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["token"].startswith(created_client["id"] + ":")
        assert data["client"]["email"] == created_client["email"]

    def test_login_wrong_code(self, s, created_client):
        wrong = "0000" if created_client["code"] != "0000" else "1111"
        r = s.post(f"{API}/auth/login", json={"email": created_client["email"], "code": wrong})
        assert r.status_code == 401

    def test_login_no_account(self, s):
        r = s.post(f"{API}/auth/login", json={"email": "nobody_unknown@example.com", "code": "1234"})
        assert r.status_code == 401

    def test_login_rejects_subscription_only_client(self, s, admin_headers):
        """A client created via /payments/checkout (subscription path) has no code → login must reject."""
        email = f"test_subonly_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Sub Only", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200
        # Now try logging in with empty/any code — should fail (no code on client)
        r2 = s.post(f"{API}/auth/login", json={"email": email, "code": "1234"})
        assert r2.status_code == 401
        # Cleanup: find & delete
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)


# ---------- Recipes ----------
class TestRecipes:
    def test_list_recipes(self, s):
        r = s.get(f"{API}/recipes")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 15
        first = items[0]
        for key in ("slug", "name", "ingredients", "instructions", "macros"):
            assert key in first

    def test_get_recipe_by_slug(self, s):
        # Use first listed slug (the literal 'meal-prep-pro-19' in spec is the host slug, not a recipe slug)
        items = s.get(f"{API}/recipes").json()
        slug = items[0]["slug"]
        r = s.get(f"{API}/recipes/{slug}")
        assert r.status_code == 200
        assert r.json()["slug"] == slug

    def test_get_recipe_404(self, s):
        r = s.get(f"{API}/recipes/does-not-exist")
        assert r.status_code == 404


# ---------- Menu (auth required) ----------
class TestMenu:
    def _client_headers(self, created_client):
        token = f"{created_client['id']}:{created_client['code']}"
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def test_menu_current_requires_auth(self, s):
        r = s.get(f"{API}/menu/current")
        assert r.status_code == 401

    def test_menu_current_ok(self, s, created_client):
        r = s.get(f"{API}/menu/current", headers=self._client_headers(created_client))
        assert r.status_code == 200, r.text
        data = r.json()
        assert "days" in data and "recipes" in data
        # 7 days
        assert len(data["days"]) == 7

    def test_shopping_list_requires_auth(self, s):
        r = s.get(f"{API}/menu/shopping-list")
        assert r.status_code == 401

    def test_shopping_list_ok(self, s, created_client):
        r = s.get(f"{API}/menu/shopping-list", headers=self._client_headers(created_client))
        assert r.status_code == 200
        data = r.json()
        assert "items" in data and isinstance(data["items"], list)
        assert len(data["items"]) > 0

    def test_invalid_token_rejected(self, s):
        r = s.get(f"{API}/menu/current",
                  headers={"Authorization": "Bearer invalid:token"})
        assert r.status_code == 401


# ---------- Payments / Stripe ----------
class TestPayments:
    def test_create_checkout(self, s, admin_headers):
        email = f"test_pay_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Pay User", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert "stripe.com" in data["url"]
        # Verify a payment_transactions row was created via status endpoint
        sid = data["session_id"]
        r2 = s.get(f"{API}/payments/checkout/status/{sid}")
        assert r2.status_code == 200, r2.text
        st = r2.json()
        assert st["payment_status"] in ("pending", "unpaid", "paid")
        # Cleanup
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_checkout_status_returns_pending_not_500(self, s, admin_headers):
        """REGRESSION FIX: get_checkout_status fails in emergent sandbox → must return HTTP 200 pending, NOT 500."""
        email = f"test_pending_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Pending User", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        # Immediately poll status (before Stripe session matures in sandbox)
        r2 = s.get(f"{API}/payments/checkout/status/{sid}")
        assert r2.status_code == 200, f"Expected 200 pending, got {r2.status_code}: {r2.text}"
        st = r2.json()
        assert st["payment_status"] == "pending", f"Expected pending, got: {st}"
        assert st["status"] in ("pending", "initiated", "open")
        # Cleanup
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_checkout_status_idempotent_pending(self, s, admin_headers):
        """Calling status repeatedly with non-paid session keeps returning pending without error."""
        email = f"test_idem_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Idem User", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200
        sid = r.json()["session_id"]
        for i in range(3):
            r2 = s.get(f"{API}/payments/checkout/status/{sid}")
            assert r2.status_code == 200, f"Call #{i}: {r2.status_code} - {r2.text}"
            assert r2.json()["payment_status"] == "pending"
        # Cleanup
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_status_unknown_session_returns_404(self, s):
        """Unknown session_id returns 404, never 500."""
        r = s.get(f"{API}/payments/checkout/status/nonexistent_session_xyz_12345")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"

    def test_checkout_creates_tx_with_webhook_url(self, s, admin_headers):
        """payment_transactions row must store webhook_url (used for status fallback)."""
        import pymongo
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'test_database')
        # Default DB_NAME might not match; try reading from backend .env
        try:
            with open('/app/backend/.env') as f:
                for line in f:
                    if line.startswith('DB_NAME='):
                        db_name = line.strip().split('=', 1)[1].strip('"').strip("'")
                    if line.startswith('MONGO_URL='):
                        mongo_url = line.strip().split('=', 1)[1].strip('"').strip("'")
        except Exception:
            pass
        email = f"test_webhook_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Webhook User", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # Direct DB check
        mc = pymongo.MongoClient(mongo_url)
        tx = mc[db_name].payment_transactions.find_one({"session_id": sid})
        assert tx is not None, "payment_transactions row missing"
        assert tx.get("webhook_url"), "webhook_url not stored on tx"
        assert "/api/webhook/stripe" in tx["webhook_url"]
        assert tx.get("payment_status") == "pending"
        mc.close()
        # Cleanup
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)

    def test_status_short_circuits_when_granted(self, s, admin_headers):
        """When tx.granted=True in DB, status endpoint returns paid+client+token without calling Stripe."""
        import pymongo, uuid as _uuid
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = 'test_database'
        try:
            with open('/app/backend/.env') as f:
                for line in f:
                    if line.startswith('DB_NAME='):
                        db_name = line.strip().split('=', 1)[1].strip('"').strip("'")
                    if line.startswith('MONGO_URL='):
                        mongo_url = line.strip().split('=', 1)[1].strip('"').strip("'")
        except Exception:
            pass
        email = f"test_granted_{int(time.time())}@example.com"
        r = s.post(f"{API}/payments/checkout",
                   json={"name": "Granted User", "email": email, "origin_url": BASE_URL})
        assert r.status_code == 200
        sid = r.json()["session_id"]
        # Manually flip granted=True (simulating webhook delivery)
        mc = pymongo.MongoClient(mongo_url)
        res = mc[db_name].payment_transactions.update_one(
            {"session_id": sid},
            {"$set": {"granted": True, "payment_status": "paid", "status": "complete"}},
        )
        assert res.modified_count == 1
        mc.close()
        # Status endpoint should now short-circuit
        r2 = s.get(f"{API}/payments/checkout/status/{sid}")
        assert r2.status_code == 200, r2.text
        st = r2.json()
        assert st["payment_status"] == "paid"
        assert st["status"] == "complete"
        # client + token must be returned (note: short-circuit branch doesn't grant subscription, only returns client)
        assert "client" in st and st["client"] is not None
        assert st["client"]["email"] == email
        # token may be empty string since _grant_subscription wasn't called in short-circuit; just verify key exists
        assert "token" in st
        # Cleanup
        clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
        for c in clients:
            if c["email"] == email:
                s.delete(f"{API}/admin/clients/{c['id']}", headers=admin_headers)


# ---------- Stripe Webhook ----------
class TestStripeWebhook:
    def test_webhook_endpoint_exists_rejects_invalid(self, s):
        """POST /api/webhook/stripe exists and returns 400 on missing/invalid signature."""
        r = s.post(f"{API}/webhook/stripe", data="", headers={"Content-Type": "application/json"})
        # Must NOT be 404 (endpoint exists). 400 expected for invalid sig.
        assert r.status_code != 404, "webhook endpoint missing"
        assert r.status_code == 400, f"Expected 400 invalid sig, got {r.status_code}: {r.text}"

    def test_webhook_invalid_body_rejected(self, s):
        r = s.post(f"{API}/webhook/stripe",
                   data='{"type":"checkout.session.completed"}',
                   headers={"Content-Type": "application/json", "Stripe-Signature": "t=1,v1=fake"})
        assert r.status_code == 400


# ---------- Snacks (40 healthy snacks feature) ----------
class TestSnacks:
    def test_recipes_contain_40_snacks(self, s):
        r = s.get(f"{API}/recipes")
        assert r.status_code == 200
        items = r.json()
        snacks = [x for x in items if x.get("category") == "snack"]
        assert len(snacks) == 40, f"Expected 40 snacks, got {len(snacks)}. Total recipes={len(items)}"
        # Every snack has one of the goal tags
        goal_tags = {"lean", "bulk", "balanced"}
        for sn in snacks:
            tags = set(sn.get("tags") or [])
            assert tags & goal_tags, f"Snack {sn.get('slug')} missing goal tag: tags={tags}"

    def test_total_recipes_at_least_123(self, s):
        r = s.get(f"{API}/recipes")
        items = r.json()
        # Feature spec says total ~123 (83 existing + 40 snacks)
        assert len(items) >= 123, f"Expected >=123 total, got {len(items)}"

    def _login_client(self, s, admin_headers, name, goal):
        email = f"test_snack_{goal}_{int(time.time()*1000)}@example.com"
        r = s.post(f"{API}/admin/clients", json={"name": name, "email": email}, headers=admin_headers)
        assert r.status_code == 200
        c = r.json()
        headers = {"Authorization": f"Bearer {c['id']}:{c['code']}", "Content-Type": "application/json"}
        # Set goal via client profile update
        prof = {"goal": goal, "sex": "male", "age": 30, "height_cm": 175,
                "weight_kg": 80, "activity_level": "moderate"}
        pr = s.put(f"{API}/client/profile", json=prof, headers=headers)
        assert pr.status_code == 200, pr.text
        return c, headers

    def _fetch_menu(self, s, headers):
        r = s.get(f"{API}/menu/current", headers=headers)
        assert r.status_code == 200, r.text
        return r.json()

    def _cleanup(self, s, admin_headers, cid):
        try:
            s.delete(f"{API}/admin/clients/{cid}", headers=admin_headers)
        except Exception:
            pass

    def test_lose_client_snacks_filled_no_bulk_only(self, s, admin_headers):
        c, headers = self._login_client(s, admin_headers, "Lean Lisa", "lose")
        try:
            menu = self._fetch_menu(s, headers)
            recipes = menu["recipes"]
            snacks_used = []
            for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
                slug = menu["days"][d].get("snack")
                assert slug, f"Snack missing for {d}"
                snacks_used.append(recipes[slug])
            # None should be tagged ONLY 'bulk' without 'balanced' or 'lean'
            for r in snacks_used:
                tags = set(r.get("tags") or [])
                assert "bulk" not in tags or (tags & {"lean", "balanced"}), \
                    f"lose client got bulk-only snack: {r['slug']} tags={tags}"
        finally:
            self._cleanup(s, admin_headers, c["id"])

    def test_gain_client_snacks_filled_no_lean_only(self, s, admin_headers):
        c, headers = self._login_client(s, admin_headers, "Bulk Bob", "gain")
        try:
            menu = self._fetch_menu(s, headers)
            recipes = menu["recipes"]
            for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
                slug = menu["days"][d].get("snack")
                assert slug, f"Snack missing for {d}"
                tags = set(recipes[slug].get("tags") or [])
                assert "lean" not in tags or (tags & {"bulk", "balanced"}), \
                    f"gain client got lean-only snack: {slug} tags={tags}"
        finally:
            self._cleanup(s, admin_headers, c["id"])

    def test_maintain_client_snacks_filled(self, s, admin_headers):
        c, headers = self._login_client(s, admin_headers, "Maintain Mo", "maintain")
        try:
            menu = self._fetch_menu(s, headers)
            for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
                assert menu["days"][d].get("snack"), f"Snack missing for {d}"
        finally:
            self._cleanup(s, admin_headers, c["id"])

    def test_two_clients_same_goal_get_different_snacks(self, s, admin_headers):
        c1, h1 = self._login_client(s, admin_headers, "A One", "maintain")
        c2, h2 = self._login_client(s, admin_headers, "B Two", "maintain")
        try:
            m1 = self._fetch_menu(s, h1)
            m2 = self._fetch_menu(s, h2)
            s1 = [m1["days"][d]["snack"] for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]]
            s2 = [m2["days"][d]["snack"] for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]]
            assert s1 != s2, f"Two different clients got IDENTICAL snack week: {s1}"
        finally:
            self._cleanup(s, admin_headers, c1["id"])
            self._cleanup(s, admin_headers, c2["id"])

    def test_shopping_list_includes_snack_ingredients(self, s, admin_headers, created_client):
        # Fetch client menu first so ingredients are known
        headers = {"Authorization": f"Bearer {created_client['id']}:{created_client['code']}",
                   "Content-Type": "application/json"}
        menu = s.get(f"{API}/menu/current", headers=headers).json()
        snack_ingredient_names = set()
        for d, meals in menu["days"].items():
            slug = meals.get("snack")
            if slug and slug in menu["recipes"]:
                for ing in menu["recipes"][slug]["ingredients"]:
                    snack_ingredient_names.add(ing["name"].lower())
        assert snack_ingredient_names, "No snack ingredients found in menu"
        r = s.get(f"{API}/menu/shopping-list", headers=headers)
        assert r.status_code == 200
        shop_names = {i["name"].lower() for i in r.json()["items"]}
        # At least one snack ingredient must appear in shopping list
        overlap = snack_ingredient_names & shop_names
        assert overlap, f"Shopping list missing snack ingredients. Snack ingredients: {snack_ingredient_names}"

    def test_admin_get_client_menu_has_snack_each_day(self, s, admin_headers, created_client):
        r = s.get(f"{API}/admin/clients/{created_client['id']}/menu", headers=admin_headers)
        assert r.status_code == 200
        days = r.json()["days"]
        for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
            assert "snack" in days[d], f"'snack' key missing from admin menu day {d}"
            assert days[d]["snack"], f"snack slot empty for {d}"

    def test_admin_put_client_menu_persists_snack(self, s, admin_headers, created_client):
        # Get a valid snack slug
        recipes = s.get(f"{API}/recipes").json()
        snack_slug = next(r["slug"] for r in recipes if r.get("category") == "snack")
        breakfast_slug = next(r["slug"] for r in recipes if r.get("category") == "breakfast")
        lunch_slug = next(r["slug"] for r in recipes if r.get("category") == "lunch")
        dinner_slug = next(r["slug"] for r in recipes if r.get("category") == "dinner")
        days = {d: {"breakfast": breakfast_slug, "lunch": lunch_slug, "dinner": dinner_slug, "snack": snack_slug}
                for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}
        r = s.put(f"{API}/admin/clients/{created_client['id']}/menu",
                  json={"days": days}, headers=admin_headers)
        assert r.status_code == 200, r.text
        # Verify via GET
        r2 = s.get(f"{API}/admin/clients/{created_client['id']}/menu", headers=admin_headers)
        got = r2.json()["days"]
        for d in ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]:
            assert got[d]["snack"] == snack_slug, f"Snack didn't persist for {d}"


# ---------- Admin Delete ----------
def test_admin_delete_client(s, admin_headers):
    email = f"test_del_{int(time.time())}@example.com"
    r = s.post(f"{API}/admin/clients", json={"name": "Del", "email": email}, headers=admin_headers)
    assert r.status_code == 200
    cid = r.json()["id"]
    r2 = s.delete(f"{API}/admin/clients/{cid}", headers=admin_headers)
    assert r2.status_code == 200
    # Confirm gone
    clients = s.get(f"{API}/admin/clients", headers=admin_headers).json()
    assert cid not in [c["id"] for c in clients]

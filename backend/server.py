from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Depends,
    Header,
    Request,
    UploadFile,
    File,
    BackgroundTasks,
)
import hmac
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from recipes_seed import RECIPES_SEED, WEEKLY_TEMPLATE
from recipes_extra_seed import EXTRA_RECIPES
from snacks_seed import SNACKS
from email_service import send_code_email, send_admin_digest
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutStatusResponse,
)
from stripe_service import (
    verify_webhook,
    create_portal_session,
    retrieve_session_customer,
    STRIPE_PAYMENT_LINK,
)
from site_content_defaults import SITE_CONTENT_DEFAULTS, deep_merge
from storage_service import init_storage, put_object, get_object
from nutrition import compute_targets, day_scale_factor

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'abpt2025'
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_NOTIFY_EMAIL', 'abpt@apttrains.com')
ADMIN_SESSION_HOURS = 8
WEBHOOK_CRON_SECRET = os.environ.get('WEBHOOK_CRON_SECRET')

# Weekly 4-digit codes are issued every Sunday 06:00 Irish time and run for a full week.
CODE_TZ = ZoneInfo('Europe/Dublin')

# Single product: monthly access (€14.99). Defined server-side ONLY.
SUBSCRIPTION_PRICE = 14.99
SUBSCRIPTION_CURRENCY = "eur"
SUBSCRIPTION_DAYS = 30

logger = logging.getLogger(__name__)

# ---------- helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def gen_code() -> str:
    return ''.join(random.choices(string.digits, k=4))

def week_start() -> datetime:
    t = now_utc()
    monday = t.date() - timedelta(days=t.weekday())
    return datetime(monday.year, monday.month, monday.day, tzinfo=timezone.utc)

def _dublin_anchor(d) -> datetime:
    """06:00 Europe/Dublin on date `d`, returned as an aware UTC datetime."""
    return datetime(d.year, d.month, d.day, 6, 0, tzinfo=CODE_TZ).astimezone(timezone.utc)

def code_week_start() -> datetime:
    """Start of the current code week — the most recent Sunday 06:00 Europe/Dublin."""
    today = now_utc().astimezone(CODE_TZ).date()
    sunday = today - timedelta(days=(today.weekday() + 1) % 7)
    anchor = _dublin_anchor(sunday)
    if anchor > now_utc():
        anchor = _dublin_anchor(sunday - timedelta(days=7))
    return anchor

def next_code_expiry() -> datetime:
    """End of the current code week — next Sunday 06:00 Europe/Dublin."""
    start_local = code_week_start().astimezone(CODE_TZ).date()
    return _dublin_anchor(start_local + timedelta(days=7))

def fmt_expiry(dt: datetime) -> str:
    return dt.astimezone(CODE_TZ).strftime("%a %d %b %Y, %H:%M")

def has_active_subscription(c: dict) -> bool:
    if not c.get("subscription_expires_at"):
        return False
    try:
        exp = datetime.fromisoformat(c["subscription_expires_at"])
        return exp > now_utc()
    except Exception:
        return False

def has_valid_code(c: dict, code: Optional[str] = None) -> bool:
    if not c.get("code") or not c.get("code_expires_at"):
        return False
    if code is not None and c["code"] != code:
        return False
    try:
        exp = datetime.fromisoformat(c["code_expires_at"])
        return exp > now_utc()
    except Exception:
        return False

# ---------- models ----------
class LoginIn(BaseModel):
    email: EmailStr
    code: str

class AdminLoginIn(BaseModel):
    password: str

class AdminCreateClientIn(BaseModel):
    name: str
    email: EmailStr

class CheckoutIn(BaseModel):
    name: str
    email: EmailStr
    origin_url: str

def _goal_tag_for(recipe: dict) -> str:
    """Auto-tag legacy recipes by macros so goal-based menu picking works uniformly."""
    kcal = (recipe.get("macros") or {}).get("kcal", 0)
    protein = (recipe.get("macros") or {}).get("protein", 0)
    protein_density = protein / kcal if kcal else 0
    if kcal <= 450 and protein_density >= 0.06:
        return "lean"
    if kcal >= 600 and protein >= 25:
        return "bulk"
    return "balanced"

# ---------- startup ----------
@app.on_event("startup")
async def startup_seed():
    try:
        init_storage()
    except Exception as e:
        logging.getLogger(__name__).warning("storage init failed at startup: %s", e)
    # Seed core recipes + auto-attach a goal tag when missing
    for r in RECIPES_SEED:
        auto_tag = _goal_tag_for(r)
        tags = list(r.get("tags") or [])
        if not any(t in tags for t in ("lean", "bulk", "balanced")):
            tags.append(auto_tag)
        payload = {**r, "tags": tags}
        await db.recipes.update_one({"slug": r["slug"]}, {"$set": payload}, upsert=True)
    # Seed 48 extra easy recipes (each ships with a lean/bulk/balanced tag already)
    for r in EXTRA_RECIPES:
        # only upsert if slug doesn't already exist to respect admin edits
        existing = await db.recipes.find_one({"slug": r["slug"]}, {"_id": 0})
        if existing:
            continue
        await db.recipes.insert_one({**r})
    # Seed 40 healthy snacks (category="snack")
    for r in SNACKS:
        existing = await db.recipes.find_one({"slug": r["slug"]}, {"_id": 0})
        if existing:
            continue
        await db.recipes.insert_one({**r})
    ws = week_start().date().isoformat()
    existing = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not existing:
        await db.menus.insert_one({
            "week_start": ws,
            "days": WEEKLY_TEMPLATE,
            "created_at": now_utc().isoformat(),
        })
    # Weekly code rotation is driven by the platform cron (.emergent/crons.yml
    # -> POST /api/cron/rotate-codes). A catch-up call also runs whenever an
    # admin opens the clients list, so a missed fire self-heals.


def eligible_for_weekly_code(c: dict) -> bool:
    """Coaching clients always get a weekly code. Subscriber-created accounts get
    one too, but only while their subscription is live."""
    if c.get("active") is False:
        return False
    if c.get("source") == "stripe" and not has_active_subscription(c):
        return False
    return True

async def issue_code(client_id: str) -> dict:
    """Gives a client a fresh code for the current code week."""
    new_code = gen_code()
    new_exp = next_code_expiry().isoformat()
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {"code": new_code, "code_expires_at": new_exp}},
    )
    return {"code": new_code, "code_expires_at": new_exp}

async def maybe_rotate_codes(force: bool = False) -> Optional[List[dict]]:
    ws_iso = code_week_start().isoformat()
    marker = await db.system.find_one({"key": "last_code_rotation"}, {"_id": 0})
    if not force and marker and marker.get("week_start") == ws_iso:
        return None  # already rotated this code week
    clients = await db.clients.find({"active": {"$ne": False}}, {"_id": 0}).to_list(2000)
    rotated = []
    new_exp = next_code_expiry().isoformat()
    for c in clients:
        if not eligible_for_weekly_code(c):
            continue
        new_code = gen_code()
        await db.clients.update_one(
            {"id": c["id"]},
            {"$set": {"code": new_code, "code_expires_at": new_exp}},
        )
        rotated.append({"name": c["name"], "email": c["email"], "code": new_code, "expires_at": new_exp})
    await db.system.update_one(
        {"key": "last_code_rotation"},
        {"$set": {"week_start": ws_iso, "rotated_at": now_utc().isoformat(), "count": len(rotated)}},
        upsert=True,
    )
    if rotated:
        try:
            await send_admin_digest(ADMIN_NOTIFY_EMAIL, rotated, fmt_expiry(next_code_expiry()))
        except Exception as e:
            logger.warning("admin digest email failed: %s", e)
    return rotated

# ---------- auth helpers ----------
async def get_current_client(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        cid, secret = token.split(":", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    c = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not c or not c.get("active", True):
        raise HTTPException(status_code=401, detail="Account not found or removed")
    # Token is valid if either: matches code AND code not expired, OR client has active subscription
    if has_active_subscription(c) and secret == c.get("subscription_token", ""):
        return c
    if has_valid_code(c, secret):
        return c
    raise HTTPException(status_code=401, detail="Access expired. Subscribe or get a new code from your coach.")

async def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin auth required")
    token = authorization.split(" ", 1)[1]
    if not token.startswith("admin:"):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    session_id = token.split(":", 1)[1]
    sess = await db.admin_sessions.find_one({"id": session_id}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Admin session not found")
    try:
        exp = datetime.fromisoformat(sess["expires_at"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin session")
    if exp < now_utc():
        await db.admin_sessions.delete_one({"id": session_id})
        raise HTTPException(status_code=401, detail="Admin session expired")
    return True

def client_public(c: dict) -> dict:
    profile = c.get("profile")
    return {
        "id": c["id"],
        "name": c["name"],
        "email": c["email"],
        "code": c.get("code"),
        "code_expires_at": c.get("code_expires_at"),
        "subscription_expires_at": c.get("subscription_expires_at"),
        "is_subscribed": has_active_subscription(c),
        "created_at": c["created_at"],
        "profile": profile,
        "profile_completed_at": c.get("profile_completed_at"),
        "targets": compute_targets(profile),
    }

def make_token(c: dict) -> str:
    """Returns auth token: subscription token if active, else id:code."""
    if has_active_subscription(c) and c.get("subscription_token"):
        return f"{c['id']}:{c['subscription_token']}"
    return f"{c['id']}:{c.get('code', '')}"

# ---------- public routes ----------
@api_router.get("/")
async def root():
    return {"message": "APT meal prep API", "tagline": "bruddatrain"}

@api_router.get("/pricing")
async def pricing():
    return {
        "price": SUBSCRIPTION_PRICE,
        "currency": SUBSCRIPTION_CURRENCY,
        "period_days": SUBSCRIPTION_DAYS,
        "label": "€14.99 / month",
        "payment_link": STRIPE_PAYMENT_LINK,
    }

class LookupIn(BaseModel):
    email: EmailStr

@api_router.post("/payments/lookup")
async def lookup_subscription(payload: LookupIn):
    """Looks up a client by email and returns auth credentials if they have an active subscription.
    Used by the /subscribe/success page after a user pays via the Stripe Payment Link."""
    email = payload.email.lower().strip()
    c = await db.clients.find_one({"email": email}, {"_id": 0})
    if not c or not c.get("active", True):
        return {"found": False, "active": False, "message": "No account yet. Webhook may not have processed — please wait a few seconds and try again."}
    if not has_active_subscription(c):
        return {"found": True, "active": False, "message": "We don't see an active subscription for this email yet. If you just paid, refresh in a few seconds."}
    # ensure subscription_token exists
    if not c.get("subscription_token"):
        new_token = uuid.uuid4().hex[:24]
        await db.clients.update_one({"id": c["id"]}, {"$set": {"subscription_token": new_token}})
        c["subscription_token"] = new_token
    return {
        "found": True,
        "active": True,
        "client": client_public(c),
        "token": f"{c['id']}:{c['subscription_token']}",
    }

@api_router.post("/payments/portal")
async def portal(request: Request, client_in: dict = Depends(get_current_client)):
    """Creates a Stripe Customer Portal session for the authenticated subscriber."""
    customer_id = client_in.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer on file. Subscribe first.")
    body = {}
    try:
        body = await request.json()
    except Exception:
        body = {}
    return_url = body.get("return_url") or "/dashboard"
    url = await create_portal_session(customer_id, return_url)
    if not url:
        raise HTTPException(status_code=500, detail="Could not create portal session")
    return {"url": url}

@api_router.post("/auth/login")
async def login(payload: LoginIn):
    c = await db.clients.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=401, detail="No account found for that email")
    if not c.get("active", True):
        raise HTTPException(status_code=403, detail="Account removed. Contact your coach.")
    if not has_valid_code(c, payload.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    return {"client": client_public(c), "token": make_token(c)}

@api_router.get("/auth/me")
async def me(client_in: dict = Depends(get_current_client)):
    return client_public(client_in)

# ---------- client profile / macros ----------
class ProfileIn(BaseModel):
    sex: str  # "male" or "female"
    age: int = Field(ge=10, le=100)
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=30, le=300)
    activity_level: str  # sedentary | light | moderate | active | very_active
    goal: str  # lose | maintain | gain

@api_router.get("/client/profile")
async def get_profile(client_in: dict = Depends(get_current_client)):
    profile = client_in.get("profile")
    return {"profile": profile, "targets": compute_targets(profile)}

@api_router.put("/client/profile")
async def update_profile(payload: ProfileIn, client_in: dict = Depends(get_current_client)):
    sex = payload.sex.lower()
    if sex not in ("male", "female"):
        raise HTTPException(status_code=400, detail="sex must be 'male' or 'female'")
    if payload.activity_level not in ACTIVITY_ALLOWED:
        raise HTTPException(status_code=400, detail="Invalid activity_level")
    if payload.goal not in ("lose", "maintain", "gain"):
        raise HTTPException(status_code=400, detail="Invalid goal")
    profile = {
        "sex": sex,
        "age": payload.age,
        "height_cm": payload.height_cm,
        "weight_kg": payload.weight_kg,
        "activity_level": payload.activity_level,
        "goal": payload.goal,
        "updated_at": now_utc().isoformat(),
    }
    await db.clients.update_one(
        {"id": client_in["id"]},
        {"$set": {"profile": profile, "profile_completed_at": now_utc().isoformat()}},
    )
    # If the goal or key stats changed, drop this week's cached menu so it
    # re-generates against the new goal (admin-saved menus keep priority).
    prev_goal = ((client_in.get("profile") or {}).get("goal"))
    if prev_goal != profile["goal"]:
        ws_iso = week_start().date().isoformat()
        # Only clear auto-generated menus, not admin overrides / manual edits
        await db.client_menus.delete_many({
            "client_id": client_in["id"],
            "week_start": ws_iso,
            "source": {"$regex": "^random"},
        })
    return {"profile": profile, "targets": compute_targets(profile)}

ACTIVITY_ALLOWED = {"sedentary", "light", "moderate", "active", "very_active"}

# ---------- weigh-ins / progress ----------
class WeighInIn(BaseModel):
    weight_kg: float = Field(ge=30, le=300)
    date: Optional[str] = None  # ISO date; defaults to today (UTC)
    note: Optional[str] = None

@api_router.get("/client/weigh-ins")
async def list_weigh_ins(client_in: dict = Depends(get_current_client)):
    entries = await db.weigh_ins.find(
        {"client_id": client_in["id"]}, {"_id": 0}
    ).sort("date", 1).to_list(500)
    return {"entries": entries}

@api_router.post("/client/weigh-ins")
async def create_weigh_in(payload: WeighInIn, client_in: dict = Depends(get_current_client)):
    date = payload.date or now_utc().date().isoformat()
    entry = {
        "id": str(uuid.uuid4()),
        "client_id": client_in["id"],
        "weight_kg": round(float(payload.weight_kg), 2),
        "date": date,
        "note": (payload.note or "").strip() or None,
        "created_at": now_utc().isoformat(),
    }
    # If a log already exists for this date, overwrite it (idempotent daily logging)
    await db.weigh_ins.update_one(
        {"client_id": client_in["id"], "date": date},
        {"$set": entry},
        upsert=True,
    )
    # Update the client's current weight in their profile so targets auto-recalc
    profile = client_in.get("profile") or {}
    if profile:
        profile["weight_kg"] = entry["weight_kg"]
        profile["updated_at"] = now_utc().isoformat()
        await db.clients.update_one(
            {"id": client_in["id"]},
            {"$set": {"profile": profile}},
        )
    return {"entry": entry, "targets": compute_targets(profile) if profile else None}

@api_router.delete("/client/weigh-ins/{entry_id}")
async def delete_weigh_in(entry_id: str, client_in: dict = Depends(get_current_client)):
    res = await db.weigh_ins.delete_one({"id": entry_id, "client_id": client_in["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ---------- payments ----------
@api_router.post("/payments/checkout")
async def create_checkout(payload: CheckoutIn, request: Request):
    """Creates a Stripe Checkout session for €14.99 one-month access."""
    email = payload.email.lower().strip()
    name = payload.name.strip()
    existing = await db.clients.find_one({"email": email}, {"_id": 0})
    if existing:
        client_id = existing["id"]
        await db.clients.update_one({"id": client_id}, {"$set": {"name": name, "active": True}})
    else:
        client_id = str(uuid.uuid4())
        await db.clients.insert_one({
            "id": client_id,
            "name": name,
            "email": email,
            "created_at": now_utc().isoformat(),
            "active": True,
            "source": "stripe",
            "code": None,
            "code_expires_at": None,
        })

    success_url = f"{payload.origin_url.rstrip('/')}/subscribe/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payload.origin_url.rstrip('/')}/subscribe?cancelled=1"
    metadata = {"client_id": client_id, "email": email, "purpose": "monthly_access"}

    webhook_url = f"{payload.origin_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    req = CheckoutSessionRequest(
        amount=float(SUBSCRIPTION_PRICE),
        currency=SUBSCRIPTION_CURRENCY,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "client_id": client_id,
        "email": email,
        "amount": float(SUBSCRIPTION_PRICE),
        "currency": SUBSCRIPTION_CURRENCY,
        "status": "initiated",
        "payment_status": "pending",
        "metadata": metadata,
        "webhook_url": webhook_url,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}

async def _grant_subscription(client_id: str, session_id: str) -> Optional[dict]:
    """Idempotently grants subscription access for a paid session. Returns updated client doc."""
    # mark tx granted (single-writer)
    res = await db.payment_transactions.update_one(
        {"session_id": session_id, "granted": {"$ne": True}},
        {"$set": {"granted": True, "payment_status": "paid", "status": "complete",
                  "updated_at": now_utc().isoformat()}},
    )
    if res.modified_count == 0:
        # already granted; just return current client
        return await db.clients.find_one({"id": client_id}, {"_id": 0})
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        return None
    current_exp = None
    if c.get("subscription_expires_at"):
        try:
            current_exp = datetime.fromisoformat(c["subscription_expires_at"])
        except Exception:
            current_exp = None
    base = current_exp if (current_exp and current_exp > now_utc()) else now_utc()
    new_exp = base + timedelta(days=SUBSCRIPTION_DAYS)
    sub_token = uuid.uuid4().hex[:24]
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {
            "subscription_expires_at": new_exp.isoformat(),
            "subscription_token": sub_token,
            "last_payment_session_id": session_id,
        }},
    )
    return await db.clients.find_one({"id": client_id}, {"_id": 0})

@api_router.get("/payments/checkout/status/{session_id}")
async def checkout_status(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")

    # If already granted via webhook, return the cached state immediately
    if tx.get("granted"):
        c = await db.clients.find_one({"id": tx["client_id"]}, {"_id": 0})
        return {
            "status": "complete",
            "payment_status": "paid",
            "amount_total": int(tx.get("amount", 0) * 100),
            "currency": tx.get("currency", SUBSCRIPTION_CURRENCY),
            "client": client_public(c) if c else None,
            "token": f"{c['id']}:{c.get('subscription_token','')}" if c else None,
        }

    # Otherwise try Stripe (might fail in emergent sandbox until session matures or webhook arrives)
    webhook_url = tx.get("webhook_url") or ""
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        new_status = status.status
        new_payment_status = status.payment_status
        amount_total = status.amount_total
        currency = status.currency
    except Exception as e:
        logger.warning("get_checkout_status failed for %s: %s", session_id, e)
        return {
            "status": tx.get("status", "pending"),
            "payment_status": tx.get("payment_status", "pending"),
            "amount_total": int(tx.get("amount", 0) * 100),
            "currency": tx.get("currency", SUBSCRIPTION_CURRENCY),
        }

    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"status": new_status, "payment_status": new_payment_status,
                  "updated_at": now_utc().isoformat()}},
    )

    response: Dict = {"status": new_status, "payment_status": new_payment_status,
                      "amount_total": amount_total, "currency": currency}

    if new_payment_status == "paid":
        c = await _grant_subscription(tx.get("client_id"), session_id)
        if c:
            response["client"] = client_public(c)
            response["token"] = f"{c['id']}:{c.get('subscription_token','')}"
    return response

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    event = verify_webhook(body, signature)
    if not event:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"] if "type" in event else ""
    data_obj = event["data"]["object"] if event.get("data") else {}
    # Convert StripeObject to plain dict for downstream code
    try:
        data_obj = dict(data_obj)
    except Exception:
        pass
    logger.info("stripe webhook: %s id=%s", event_type, data_obj.get("id") if isinstance(data_obj, dict) else "?")

    # Payment completed via Payment Link or Checkout
    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data_obj)
    elif event_type == "invoice.paid":
        # Recurring subscription renewal
        customer_id = data_obj.get("customer")
        if customer_id:
            await _extend_subscription_by_customer(customer_id)
    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = data_obj.get("customer")
        if customer_id:
            await _revoke_subscription_by_customer(customer_id)
    return {"ok": True}

async def _handle_checkout_completed(session: dict):
    """Handles a paid Stripe Checkout / Payment Link session."""
    email = (session.get("customer_email")
             or (session.get("customer_details") or {}).get("email") or "").lower().strip()
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    name = ((session.get("customer_details") or {}).get("name") or email.split("@")[0] or "Subscriber").strip()
    if not email:
        logger.warning("checkout.session.completed without email: %s", session.get("id"))
        return
    # Upsert client
    c = await db.clients.find_one({"email": email}, {"_id": 0})
    if not c:
        client_id = str(uuid.uuid4())
        await db.clients.insert_one({
            "id": client_id,
            "name": name,
            "email": email,
            "created_at": now_utc().isoformat(),
            "active": True,
            "source": "stripe",
            "code": None,
            "code_expires_at": None,
        })
    else:
        client_id = c["id"]
    # Grant subscription (30 days; renewals will extend via invoice.paid)
    sub_token = uuid.uuid4().hex[:24]
    new_exp = (now_utc() + timedelta(days=SUBSCRIPTION_DAYS)).isoformat()
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {
            "subscription_expires_at": new_exp,
            "subscription_token": sub_token,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "active": True,
        }},
    )
    # Subscribers get a 4-digit code too — a convenience alongside their token
    fresh = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not has_valid_code(fresh or {}):
        issued = await issue_code(client_id)
        try:
            await send_code_email(
                ADMIN_NOTIFY_EMAIL, name, issued["code"], fmt_expiry(next_code_expiry())
            )
        except Exception as e:
            logger.warning("subscriber code email failed: %s", e)
    # Persist transaction
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.get("id"),
        "client_id": client_id,
        "email": email,
        "amount": (session.get("amount_total") or 0) / 100,
        "currency": session.get("currency", SUBSCRIPTION_CURRENCY),
        "status": "complete",
        "payment_status": "paid",
        "granted": True,
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    })
    logger.info("granted subscription for %s (client_id=%s)", email, client_id)

async def _extend_subscription_by_customer(customer_id: str):
    c = await db.clients.find_one({"stripe_customer_id": customer_id}, {"_id": 0})
    if not c:
        return
    base = now_utc()
    if c.get("subscription_expires_at"):
        try:
            cur = datetime.fromisoformat(c["subscription_expires_at"])
            if cur > base:
                base = cur
        except Exception:
            pass
    new_exp = (base + timedelta(days=SUBSCRIPTION_DAYS)).isoformat()
    await db.clients.update_one({"id": c["id"]}, {"$set": {"subscription_expires_at": new_exp}})

async def _revoke_subscription_by_customer(customer_id: str):
    res = await db.clients.update_one(
        {"stripe_customer_id": customer_id},
        {"$set": {"subscription_expires_at": (now_utc() - timedelta(seconds=1)).isoformat()}},
    )
    logger.info("revoked subscription for customer %s (matched=%d)", customer_id, res.matched_count)

# ---------- recipes & menu ----------
@api_router.get("/recipes")
async def list_recipes():
    items = await db.recipes.find({}, {"_id": 0}).to_list(200)
    return items

@api_router.get("/recipes/{slug}")
async def get_recipe(slug: str):
    r = await db.recipes.find_one({"slug": slug}, {"_id": 0})
    if not r:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return r

async def get_or_create_client_menu(client_id: str) -> dict:
    """Returns the client's personalised weekly menu, generating it if missing.
    If admin has saved a menu template, use that. Otherwise randomise from the recipe pool
    filtered to match the client's goal (lose → lean, gain → bulk, maintain → balanced)."""
    ws_iso = week_start().date().isoformat()
    existing = await db.client_menus.find_one({"client_id": client_id, "week_start": ws_iso}, {"_id": 0})
    if existing:
        return existing
    # Prefer the admin-saved menu for this week (so admin's "Save menu" applies automatically)
    admin_menu = await db.menus.find_one({"week_start": ws_iso}, {"_id": 0})
    if admin_menu and admin_menu.get("days"):
        days = admin_menu["days"]
        menu = {
            "client_id": client_id,
            "week_start": ws_iso,
            "days": days,
            "created_at": now_utc().isoformat(),
            "source": "admin",
        }
        await db.client_menus.insert_one(menu.copy())
        return menu
    # Otherwise randomise per-client with goal-aware filtering
    client = await db.clients.find_one({"id": client_id}, {"_id": 0}) or {}
    goal = ((client.get("profile") or {}).get("goal")) or "maintain"
    # Preferred tags per goal — always include "balanced" as a safety net
    if goal == "lose":
        preferred = {"lean", "balanced"}
    elif goal == "gain":
        preferred = {"bulk", "balanced"}
    else:
        preferred = {"balanced", "lean", "bulk"}

    recipes = await db.recipes.find({}, {"_id": 0}).to_list(500)
    by_cat: Dict[str, List[dict]] = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    by_cat_all: Dict[str, List[dict]] = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    for r in recipes:
        cat = r.get("category", "lunch")
        if cat not in by_cat:
            continue
        by_cat_all[cat].append(r["slug"])
        tags = set(r.get("tags") or [])
        if tags & preferred:
            by_cat[cat].append(r["slug"])
    last = await db.client_menus.find_one(
        {"client_id": client_id, "week_start": {"$lt": ws_iso}},
        sort=[("week_start", -1)],
        projection={"_id": 0},
    )
    last_slugs_per_meal: Dict[str, set] = {"breakfast": set(), "lunch": set(), "dinner": set(), "snack": set()}
    if last:
        for d in DAY_KEYS:
            for meal in last_slugs_per_meal.keys():
                s = last.get("days", {}).get(d, {}).get(meal)
                if s:
                    last_slugs_per_meal[meal].add(s)
    days = {}
    rng = random.Random(f"{client_id}:{ws_iso}:{goal}")
    for meal in ("breakfast", "lunch", "dinner", "snack"):
        # Prefer goal-tagged pool; fall back to all recipes if we somehow lack coverage
        pool = list(by_cat.get(meal, []))
        if len(pool) < 7:
            pool = list(by_cat_all.get(meal, []))
        fresh = [s for s in pool if s not in last_slugs_per_meal[meal]]
        if len(fresh) >= 7:
            pool = fresh
        rng.shuffle(pool)
        for i, day in enumerate(DAY_KEYS):
            slug = pool[i % len(pool)] if pool else None
            days.setdefault(day, {})[meal] = slug
    menu = {
        "client_id": client_id,
        "week_start": ws_iso,
        "days": days,
        "created_at": now_utc().isoformat(),
        "source": f"random:{goal}",
    }
    await db.client_menus.insert_one(menu.copy())
    return menu

DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

@api_router.get("/menu/current")
async def current_menu(client_in: dict = Depends(get_current_client)):
    menu = await get_or_create_client_menu(client_in["id"])
    slugs = set()
    for day, meals in menu["days"].items():
        for s in meals.values():
            if s:
                slugs.add(s)
    recipes_list = await db.recipes.find({"slug": {"$in": list(slugs)}}, {"_id": 0}).to_list(200)
    recipes_map = {r["slug"]: r for r in recipes_list}

    targets = compute_targets(client_in.get("profile"))
    day_scales: Dict[str, float] = {}
    if targets:
        for day, meals in menu["days"].items():
            day_recipes = [recipes_map.get(s) for s in meals.values() if s]
            day_scales[day] = day_scale_factor(targets, day_recipes)

    return {
        "week_start": menu["week_start"],
        "days": menu["days"],
        "recipes": recipes_map,
        "targets": targets,
        "day_scales": day_scales,
    }

@api_router.get("/menu/shopping-list")
async def shopping_list(client_in: dict = Depends(get_current_client)):
    menu = await get_or_create_client_menu(client_in["id"])
    recipes_list = await db.recipes.find({}, {"_id": 0}).to_list(500)
    recipes_map = {r["slug"]: r for r in recipes_list}

    targets = compute_targets(client_in.get("profile"))
    agg: Dict[str, Dict] = {}
    for day, meals in menu["days"].items():
        day_recipes = [recipes_map.get(s) for s in meals.values() if s]
        scale = day_scale_factor(targets, day_recipes) if targets else 1.0
        for r in day_recipes:
            if not r:
                continue
            for ingred in r["ingredients"]:
                key = f"{ingred['name'].lower()}|{ingred['unit'].lower()}"
                if key not in agg:
                    agg[key] = {"name": ingred["name"], "unit": ingred["unit"], "quantity": 0.0}
                agg[key]["quantity"] += float(ingred["quantity"]) * scale
    # Round quantities to 1 decimal
    for v in agg.values():
        v["quantity"] = round(v["quantity"], 1)
    items = sorted(agg.values(), key=lambda x: x["name"].lower())
    return {"week_start": menu["week_start"], "items": items, "targets": targets}

@api_router.post("/menu/reshuffle")
async def reshuffle_menu(client_in: dict = Depends(get_current_client)):
    """Regenerates the current week's menu for this client (deletes and recreates)."""
    ws_iso = week_start().date().isoformat()
    await db.client_menus.delete_many({"client_id": client_in["id"], "week_start": ws_iso})
    menu = await get_or_create_client_menu(client_in["id"])
    return {"ok": True, "week_start": menu["week_start"]}

# ---------- admin ----------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginIn):
    if not ADMIN_PASSWORD or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Wrong admin password")
    session_id = uuid.uuid4().hex
    expires_at = (now_utc() + timedelta(hours=ADMIN_SESSION_HOURS)).isoformat()
    await db.admin_sessions.insert_one({
        "id": session_id,
        "created_at": now_utc().isoformat(),
        "expires_at": expires_at,
    })
    return {"token": f"admin:{session_id}", "expires_at": expires_at}

@api_router.post("/admin/logout")
async def admin_logout(_: bool = Depends(require_admin), authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer admin:"):
        session_id = authorization.split("admin:", 1)[1]
        await db.admin_sessions.delete_one({"id": session_id})
    return {"ok": True}

@api_router.get("/admin/ping")
async def admin_ping(_: bool = Depends(require_admin)):
    return {"ok": True}

@api_router.get("/admin/clients")
async def admin_clients(_: bool = Depends(require_admin)):
    # catch-up: if the Sunday schedule was missed, bring this week's codes up to date
    try:
        await maybe_rotate_codes()
    except Exception as e:
        logger.warning("auto rotate failed: %s", e)
    clients = await db.clients.find({}, {"_id": 0}).to_list(2000)
    out = []
    for c in clients:
        cp = client_public(c)
        cp["active"] = c.get("active", True)
        out.append(cp)
    return out

@api_router.post("/admin/clients")
async def admin_create_client(payload: AdminCreateClientIn, _: bool = Depends(require_admin)):
    email = payload.email.lower().strip()
    existing = await db.clients.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    code = gen_code()
    new_exp = next_code_expiry().isoformat()
    c = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": email,
        "code": code,
        "code_expires_at": new_exp,
        "created_at": now_utc().isoformat(),
        "active": True,
        "source": "admin",
    }
    await db.clients.insert_one(c)
    # email admin (not the client) so admin can share with them
    try:
        await send_code_email(ADMIN_NOTIFY_EMAIL, c["name"], code, fmt_expiry(next_code_expiry()))
    except Exception as e:
        logger.warning("admin email failed: %s", e)
    return client_public(c)

@api_router.delete("/admin/clients/{client_id}")
async def admin_remove_client(client_id: str, _: bool = Depends(require_admin)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}

@api_router.post("/admin/clients/{client_id}/regenerate-code")
async def admin_regen_code(client_id: str, _: bool = Depends(require_admin)):
    new_code = gen_code()
    new_exp = next_code_expiry().isoformat()
    res = await db.clients.update_one(
        {"id": client_id},
        {"$set": {"code": new_code, "code_expires_at": new_exp}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if c:
        try:
            await send_code_email(ADMIN_NOTIFY_EMAIL, c["name"], new_code, fmt_expiry(next_code_expiry()))
        except Exception as e:
            logger.warning("admin email failed: %s", e)
    return {"code": new_code, "code_expires_at": new_exp}

@api_router.post("/admin/rotate-codes")
async def admin_rotate_all(_: bool = Depends(require_admin)):
    rotated = await maybe_rotate_codes(force=True)
    return {"rotated": rotated or []}

@api_router.get("/admin/rotation-status")
async def admin_rotation_status(_: bool = Depends(require_admin)):
    marker = await db.system.find_one({"key": "last_code_rotation"}, {"_id": 0}) or {}
    last_run = await db.cron_runs.find_one(
        {"job": "rotate-codes"}, {"_id": 0}, sort=[("received_at", -1)]
    )
    return {
        "last_rotated_at": marker.get("rotated_at"),
        "last_rotated_count": marker.get("count"),
        "rotated_this_week": marker.get("week_start") == code_week_start().isoformat(),
        "next_rotation_at": next_code_expiry().isoformat(),
        "last_cron_run": last_run,
        "cron_configured": bool(WEBHOOK_CRON_SECRET),
    }

# ---------- platform cron (weekly code rotation) ----------
async def run_weekly_rotation(run_id: str):
    try:
        rotated = await maybe_rotate_codes(force=True)
        await db.cron_runs.update_one(
            {"run_id": run_id},
            {"$set": {"completed_at": now_utc().isoformat(), "rotated": len(rotated or [])}},
        )
    except Exception as e:
        logger.warning("cron rotation failed: %s", e)
        await db.cron_runs.update_one({"run_id": run_id}, {"$set": {"error": str(e)}})

@api_router.post("/cron/rotate-codes")
async def cron_rotate_codes(
    request: Request,
    background: BackgroundTasks,
    authorization: Optional[str] = Header(None),
    x_webhook_id: Optional[str] = Header(None),
):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    if not WEBHOOK_CRON_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not hmac.compare_digest(authorization.split(" ", 1)[1], WEBHOOK_CRON_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        envelope = await request.json()
    except Exception:
        envelope = {}
    if not isinstance(envelope, dict):
        raise HTTPException(status_code=400, detail="Invalid webhook body")
    run_id = x_webhook_id or envelope.get("run_id") or str(uuid.uuid4())
    if await db.cron_runs.find_one({"run_id": run_id}, {"_id": 0}):
        return {"ok": True, "duplicate": True, "run_id": run_id}
    await db.cron_runs.insert_one(
        {"run_id": run_id, "job": "rotate-codes", "received_at": now_utc().isoformat()}
    )
    background.add_task(run_weekly_rotation, run_id)
    return {"ok": True, "queued": True, "run_id": run_id}

# ---------- per-client menu ----------
@api_router.get("/admin/clients/{client_id}/menu")
async def admin_get_client_menu(client_id: str, _: bool = Depends(require_admin)):
    """Return the client's current-week menu. Creates one if missing (same logic as client dashboard)."""
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    menu = await get_or_create_client_menu(client_id)
    return {
        "client": {"id": c["id"], "name": c["name"], "email": c["email"]},
        "week_start": menu["week_start"],
        "days": menu["days"],
    }

class ClientMenuUpdateIn(BaseModel):
    days: Dict[str, Dict[str, str]]

@api_router.put("/admin/clients/{client_id}/menu")
async def admin_update_client_menu(
    client_id: str,
    payload: ClientMenuUpdateIn,
    _: bool = Depends(require_admin),
):
    """Overwrite ONLY this client's menu for the current week — does not affect other clients."""
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    ws_iso = week_start().date().isoformat()
    await db.client_menus.update_one(
        {"client_id": client_id, "week_start": ws_iso},
        {"$set": {
            "client_id": client_id,
            "week_start": ws_iso,
            "days": payload.days,
            "updated_at": now_utc().isoformat(),
            "manually_edited": True,
        }},
        upsert=True,
    )
    return {"ok": True, "client_id": client_id, "week_start": ws_iso, "days": payload.days}

@api_router.get("/admin/clients/{client_id}/profile")
async def admin_get_client_profile(client_id: str, _: bool = Depends(require_admin)):
    """Admin — full client profile, computed targets, and weigh-in history."""
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    profile = c.get("profile")
    weigh_ins = await db.weigh_ins.find(
        {"client_id": client_id}, {"_id": 0}
    ).sort("date", 1).to_list(500)
    return {
        "client": {
            "id": c["id"],
            "name": c["name"],
            "email": c["email"],
            "is_subscribed": has_active_subscription(c),
            "code": c.get("code"),
            "code_expires_at": c.get("code_expires_at"),
            "created_at": c["created_at"],
        },
        "profile": profile,
        "profile_completed_at": c.get("profile_completed_at"),
        "targets": compute_targets(profile),
        "weigh_ins": weigh_ins,
    }


@api_router.get("/site")
async def get_site_content():
    """Public — returns merged site content (defaults + admin overrides)."""
    doc = await db.site_content.find_one({"key": "main"}, {"_id": 0})
    override = (doc or {}).get("content", {})
    return deep_merge(SITE_CONTENT_DEFAULTS, override)

@api_router.put("/admin/site")
async def update_site_content(payload: dict, _: bool = Depends(require_admin)):
    """Admin — replace site content overrides (deep-merged with defaults on read)."""
    content = payload.get("content") if isinstance(payload, dict) else None
    if content is None:
        raise HTTPException(status_code=400, detail="Missing 'content' object")
    await db.site_content.update_one(
        {"key": "main"},
        {"$set": {"key": "main", "content": content, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return {"ok": True}

class RecipeUpdateIn(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    prep_time: Optional[int] = None
    servings: Optional[int] = None
    ingredients: Optional[List[dict]] = None
    instructions: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    macros: Optional[dict] = None

@api_router.put("/admin/recipes/{slug}")
async def admin_update_recipe(slug: str, payload: RecipeUpdateIn, _: bool = Depends(require_admin)):
    existing = await db.recipes.find_one({"slug": slug}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Recipe not found")
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if update:
        await db.recipes.update_one({"slug": slug}, {"$set": update})
    return await db.recipes.find_one({"slug": slug}, {"_id": 0})

class RecipeCreateIn(BaseModel):
    slug: str
    name: str
    category: str
    image_url: str = ""
    prep_time: int = 15
    servings: int = 1
    ingredients: List[dict] = []
    instructions: List[str] = []
    tags: List[str] = []
    macros: dict = {"kcal": 0, "protein": 0, "carbs": 0, "fat": 0}

@api_router.post("/admin/recipes")
async def admin_create_recipe(payload: RecipeCreateIn, _: bool = Depends(require_admin)):
    existing = await db.recipes.find_one({"slug": payload.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="A recipe with this slug already exists")
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.recipes.insert_one(dict(doc))
    return doc

@api_router.delete("/admin/recipes/{slug}")
async def admin_delete_recipe(slug: str, _: bool = Depends(require_admin)):
    res = await db.recipes.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"ok": True}

class MenuUpdateIn(BaseModel):
    days: Dict[str, Dict[str, str]]
    apply_to_all: bool = True

@api_router.put("/admin/menu/current")
async def admin_update_menu(payload: MenuUpdateIn, _: bool = Depends(require_admin)):
    ws = week_start().date().isoformat()
    await db.menus.update_one(
        {"week_start": ws},
        {"$set": {"days": payload.days, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    # Also persist as the canonical template for future weeks
    await db.system.update_one(
        {"key": "menu_template"},
        {"$set": {"days": payload.days, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    applied = 0
    if payload.apply_to_all:
        # Push the saved menu to every existing client_menus for this week,
        # AND seed it for every active client who doesn't yet have one.
        await db.client_menus.update_many(
            {"week_start": ws},
            {"$set": {"days": payload.days, "updated_at": now_utc().isoformat()}},
        )
        clients = await db.clients.find({"active": True}, {"_id": 0, "id": 1}).to_list(2000)
        for c in clients:
            existing = await db.client_menus.find_one({"client_id": c["id"], "week_start": ws}, {"_id": 0})
            if not existing:
                await db.client_menus.insert_one({
                    "client_id": c["id"],
                    "week_start": ws,
                    "days": payload.days,
                    "created_at": now_utc().isoformat(),
                })
            applied += 1
    return {"ok": True, "week_start": ws, "days": payload.days, "applied_to_clients": applied}

@api_router.get("/admin/menu/current")
async def admin_get_menu(_: bool = Depends(require_admin)):
    ws = week_start().date().isoformat()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        menu = {"week_start": ws, "days": WEEKLY_TEMPLATE}
    return menu

# ---------- file uploads ----------
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB

@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), _: bool = Depends(require_admin)):
    """Admin uploads an image; returns a public URL the frontend can save into image_url fields."""
    ct = (file.content_type or "").lower()
    if ct not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 8 MB)")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "bin"
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = ct.split("/")[-1].replace("jpeg", "jpg")
    path = f"apt-meal-prep/uploads/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, ct)
    except Exception as e:
        logger.exception("upload failed")
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")
    stored_path = result.get("path", path)
    await db.uploads.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored_path,
        "original_filename": file.filename,
        "content_type": ct,
        "size": len(data),
        "is_deleted": False,
        "created_at": now_utc().isoformat(),
    })
    # Public URL — clients view meal/site images without auth
    return {"url": f"/api/files/{stored_path}", "path": stored_path, "size": len(data)}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    """Public read-through cache for uploaded images (referenced by image_url fields)."""
    record = await db.uploads.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=data,
        media_type=record.get("content_type") or content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from recipes_seed import RECIPES_SEED, WEEKLY_TEMPLATE
from email_service import send_code_email, send_admin_digest
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutStatusResponse,
)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'abpt2025')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_NOTIFY_EMAIL', 'abpt@apttrains.com')

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

def next_monday() -> datetime:
    """Returns next Monday 00:00 UTC."""
    t = now_utc()
    days_ahead = (7 - t.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    nm = (t.date() + timedelta(days=days_ahead))
    return datetime(nm.year, nm.month, nm.day, tzinfo=timezone.utc)

def fmt_expiry(dt: datetime) -> str:
    return dt.strftime("%a %d %b %Y")

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

# ---------- startup ----------
@app.on_event("startup")
async def startup_seed():
    for r in RECIPES_SEED:
        await db.recipes.update_one({"slug": r["slug"]}, {"$set": r}, upsert=True)
    ws = week_start().date().isoformat()
    existing = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not existing:
        await db.menus.insert_one({
            "week_start": ws,
            "days": WEEKLY_TEMPLATE,
            "created_at": now_utc().isoformat(),
        })
    # spawn auto-rotation background task
    asyncio.create_task(weekly_rotation_loop())

async def weekly_rotation_loop():
    """Checks every hour; on Monday auto-rotates codes and emails admin digest (once per week)."""
    while True:
        try:
            await maybe_rotate_codes()
        except Exception as e:
            logger.warning("rotation loop error: %s", e)
        await asyncio.sleep(3600)

async def maybe_rotate_codes(force: bool = False) -> Optional[List[dict]]:
    ws_iso = week_start().isoformat()
    marker = await db.system.find_one({"key": "last_code_rotation"}, {"_id": 0})
    if not force and marker and marker.get("week_start") == ws_iso:
        return None  # already rotated this week
    # Only rotate for active non-subscribed clients
    clients = await db.clients.find({"active": True}, {"_id": 0}).to_list(2000)
    rotated = []
    new_exp = next_monday().isoformat()
    for c in clients:
        if has_active_subscription(c):
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
            await send_admin_digest(ADMIN_NOTIFY_EMAIL, rotated, fmt_expiry(next_monday()))
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
    if token != f"admin:{ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

def client_public(c: dict) -> dict:
    return {
        "id": c["id"],
        "name": c["name"],
        "email": c["email"],
        "code": c.get("code"),
        "code_expires_at": c.get("code_expires_at"),
        "subscription_expires_at": c.get("subscription_expires_at"),
        "is_subscribed": has_active_subscription(c),
        "created_at": c["created_at"],
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
    }

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

# ---------- payments ----------
@api_router.post("/payments/checkout")
async def create_checkout(payload: CheckoutIn, request: Request):
    """Creates a Stripe Checkout session for €14.99 one-month access."""
    email = payload.email.lower().strip()
    name = payload.name.strip()
    # Upsert client (subscribed flag set on completion)
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
            "code": None,
            "code_expires_at": None,
        })

    success_url = f"{payload.origin_url.rstrip('/')}/subscribe/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{payload.origin_url.rstrip('/')}/subscribe?cancelled=1"
    metadata = {"client_id": client_id, "email": email, "purpose": "monthly_access"}

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
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
        "created_at": now_utc().isoformat(),
        "updated_at": now_utc().isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/checkout/status/{session_id}")
async def checkout_status(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")

    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    new_status = status.status
    new_payment_status = status.payment_status
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": new_status,
            "payment_status": new_payment_status,
            "updated_at": now_utc().isoformat(),
        }},
    )

    # On first successful payment, grant subscription access (idempotent)
    response: Dict = {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }
    if new_payment_status == "paid" and not tx.get("granted"):
        # mark granted to prevent double-application
        await db.payment_transactions.update_one(
            {"session_id": session_id, "granted": {"$ne": True}},
            {"$set": {"granted": True}},
        )
        client_id = tx.get("client_id")
        c = await db.clients.find_one({"id": client_id}, {"_id": 0})
        if c:
            # extend or set subscription
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
            updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
            response["client"] = client_public(updated)
            response["token"] = f"{client_id}:{sub_token}"
    return response

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

@api_router.get("/menu/current")
async def current_menu(client_in: dict = Depends(get_current_client)):
    ws = week_start().date().isoformat()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        menu = {"week_start": ws, "days": WEEKLY_TEMPLATE, "created_at": now_utc().isoformat()}
        await db.menus.insert_one(menu.copy())
    slugs = set()
    for day, meals in menu["days"].items():
        for s in meals.values():
            slugs.add(s)
    recipes_list = await db.recipes.find({"slug": {"$in": list(slugs)}}, {"_id": 0}).to_list(200)
    recipes_map = {r["slug"]: r for r in recipes_list}
    return {"week_start": menu["week_start"], "days": menu["days"], "recipes": recipes_map}

@api_router.get("/menu/shopping-list")
async def shopping_list(client_in: dict = Depends(get_current_client)):
    ws = week_start().date().isoformat()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        raise HTTPException(status_code=404, detail="No menu set")
    slugs = []
    for day, meals in menu["days"].items():
        for s in meals.values():
            slugs.append(s)
    recipes_list = await db.recipes.find({"slug": {"$in": slugs}}, {"_id": 0}).to_list(200)
    recipes_map = {r["slug"]: r for r in recipes_list}
    agg: Dict[str, Dict] = {}
    for slug in slugs:
        r = recipes_map.get(slug)
        if not r:
            continue
        for ing in r["ingredients"]:
            key = f"{ing['name'].lower()}|{ing['unit'].lower()}"
            if key not in agg:
                agg[key] = {"name": ing["name"], "unit": ing["unit"], "quantity": 0.0}
            agg[key]["quantity"] += float(ing["quantity"])
    items = sorted(agg.values(), key=lambda x: x["name"].lower())
    return {"week_start": menu["week_start"], "items": items}

# ---------- admin ----------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginIn):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Wrong admin password")
    return {"token": f"admin:{ADMIN_PASSWORD}"}

@api_router.get("/admin/clients")
async def admin_clients(_: bool = Depends(require_admin)):
    # auto-rotate codes if Monday hit
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
    new_exp = next_monday().isoformat()
    c = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": email,
        "code": code,
        "code_expires_at": new_exp,
        "created_at": now_utc().isoformat(),
        "active": True,
    }
    await db.clients.insert_one(c)
    # email admin (not the client) so admin can share with them
    try:
        await send_code_email(ADMIN_NOTIFY_EMAIL, c["name"], code, fmt_expiry(next_monday()))
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
    new_exp = next_monday().isoformat()
    res = await db.clients.update_one(
        {"id": client_id},
        {"$set": {"code": new_code, "code_expires_at": new_exp}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if c:
        try:
            await send_code_email(ADMIN_NOTIFY_EMAIL, c["name"], new_code, fmt_expiry(next_monday()))
        except Exception as e:
            logger.warning("admin email failed: %s", e)
    return {"code": new_code, "code_expires_at": new_exp}

@api_router.post("/admin/rotate-codes")
async def admin_rotate_all(_: bool = Depends(require_admin)):
    rotated = await maybe_rotate_codes(force=True)
    return {"rotated": rotated or []}

class MenuUpdateIn(BaseModel):
    days: Dict[str, Dict[str, str]]

@api_router.put("/admin/menu/current")
async def admin_update_menu(payload: MenuUpdateIn, _: bool = Depends(require_admin)):
    ws = week_start().date().isoformat()
    await db.menus.update_one(
        {"week_start": ws},
        {"$set": {"days": payload.days, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return {"ok": True, "week_start": ws, "days": payload.days}

@api_router.get("/admin/menu/current")
async def admin_get_menu(_: bool = Depends(require_admin)):
    ws = week_start().date().isoformat()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        menu = {"week_start": ws, "days": WEEKLY_TEMPLATE}
    return menu

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

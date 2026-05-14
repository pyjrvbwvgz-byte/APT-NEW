from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta

from recipes_seed import RECIPES_SEED, WEEKLY_TEMPLATE
from email_service import send_code_email

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'abpt2025')

# ---------- helpers ----------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def gen_code() -> str:
    return ''.join(random.choices(string.digits, k=4))

def week_start_iso() -> str:
    """Returns the Monday 00:00 UTC of the current week as ISO date string."""
    today = now_utc().date()
    monday = today - timedelta(days=today.weekday())
    return monday.isoformat()

# ---------- models ----------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr

class LoginIn(BaseModel):
    email: EmailStr
    code: str

class AdminLoginIn(BaseModel):
    password: str

class ClientOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    code: str
    code_expires_at: str
    created_at: str

class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

class Recipe(BaseModel):
    id: str
    slug: str
    name: str
    category: str  # breakfast | lunch | dinner
    image_url: str
    prep_time: int  # minutes
    servings: int
    ingredients: List[Ingredient]
    instructions: List[str]
    tags: List[str] = []

# ---------- startup: seed recipes + ensure current menu ----------
@app.on_event("startup")
async def startup_seed():
    # seed recipes (upsert by slug)
    for r in RECIPES_SEED:
        await db.recipes.update_one(
            {"slug": r["slug"]},
            {"$set": r},
            upsert=True,
        )
    # ensure current week menu exists
    ws = week_start_iso()
    existing = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not existing:
        await db.menus.insert_one({
            "week_start": ws,
            "days": WEEKLY_TEMPLATE,  # {Mon: {breakfast,lunch,dinner: slug}, ...}
            "created_at": now_utc().isoformat(),
        })

# ---------- auth helpers ----------
async def get_current_client(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    # token format: <client_id>:<code>
    try:
        cid, code = token.split(":", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    c = await db.clients.find_one({"id": cid, "code": code}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    # check expiry
    exp = datetime.fromisoformat(c["code_expires_at"])
    if exp < now_utc():
        raise HTTPException(status_code=401, detail="Code expired. Please refresh your code.")
    return c

async def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin auth required")
    token = authorization.split(" ", 1)[1]
    if token != f"admin:{ADMIN_PASSWORD}":
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    return True

# ---------- routes ----------
@api_router.get("/")
async def root():
    return {"message": "APT meal prep API", "tagline": "bruddatrain"}

def _expires_label(iso: str) -> str:
    return datetime.fromisoformat(iso).strftime("%a %d %b %Y")

@api_router.post("/auth/register")
async def register(payload: RegisterIn):
    existing = await db.clients.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please log in.")
    code = gen_code()
    now = now_utc()
    expires = now + timedelta(days=7)
    c = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "email": payload.email.lower(),
        "code": code,
        "code_expires_at": expires.isoformat(),
        "created_at": now.isoformat(),
        "active": True,
    }
    await db.clients.insert_one(c)
    # fire-and-forget email (do not block response on email errors)
    try:
        await send_code_email(c["email"], c["name"], code, _expires_label(c["code_expires_at"]))
    except Exception as e:
        logger.warning("email send failed: %s", e)
    return {
        "client": {k: c[k] for k in ("id", "name", "email", "code", "code_expires_at", "created_at")},
        "token": f"{c['id']}:{c['code']}",
    }

@api_router.post("/auth/login")
async def login(payload: LoginIn):
    c = await db.clients.find_one({"email": payload.email.lower(), "code": payload.code}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=401, detail="Invalid email or code")
    if not c.get("active", True):
        raise HTTPException(status_code=403, detail="Account removed. Contact admin.")
    exp = datetime.fromisoformat(c["code_expires_at"])
    if exp < now_utc():
        raise HTTPException(status_code=401, detail="Code expired. Please regenerate.")
    return {
        "client": {k: c[k] for k in ("id", "name", "email", "code", "code_expires_at", "created_at")},
        "token": f"{c['id']}:{c['code']}",
    }

@api_router.post("/auth/refresh-code")
async def refresh_code(client_in: dict = Depends(get_current_client)):
    new_code = gen_code()
    new_exp = (now_utc() + timedelta(days=7)).isoformat()
    await db.clients.update_one(
        {"id": client_in["id"]},
        {"$set": {"code": new_code, "code_expires_at": new_exp}},
    )
    try:
        await send_code_email(client_in["email"], client_in["name"], new_code, _expires_label(new_exp))
    except Exception as e:
        logger.warning("email send failed: %s", e)
    return {"code": new_code, "code_expires_at": new_exp, "token": f"{client_in['id']}:{new_code}"}

@api_router.get("/auth/me")
async def me(client_in: dict = Depends(get_current_client)):
    return {k: client_in[k] for k in ("id", "name", "email", "code", "code_expires_at", "created_at")}

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
    ws = week_start_iso()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        menu = {"week_start": ws, "days": WEEKLY_TEMPLATE, "created_at": now_utc().isoformat()}
        await db.menus.insert_one(menu.copy())
    # enrich with recipe data
    slugs = set()
    for day, meals in menu["days"].items():
        for slug in meals.values():
            slugs.add(slug)
    recipes_list = await db.recipes.find({"slug": {"$in": list(slugs)}}, {"_id": 0}).to_list(200)
    recipes_map = {r["slug"]: r for r in recipes_list}
    return {"week_start": menu["week_start"], "days": menu["days"], "recipes": recipes_map}

@api_router.get("/menu/shopping-list")
async def shopping_list(client_in: dict = Depends(get_current_client)):
    ws = week_start_iso()
    menu = await db.menus.find_one({"week_start": ws}, {"_id": 0})
    if not menu:
        raise HTTPException(status_code=404, detail="No menu set")
    slugs = []
    for day, meals in menu["days"].items():
        for slug in meals.values():
            slugs.append(slug)
    recipes_list = await db.recipes.find({"slug": {"$in": slugs}}, {"_id": 0}).to_list(200)
    recipes_map = {r["slug"]: r for r in recipes_list}
    # aggregate ingredients by (name, unit)
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
    # group by simple category heuristic
    return {"week_start": menu["week_start"], "items": items}

# ---------- admin routes ----------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLoginIn):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Wrong admin password")
    return {"token": f"admin:{ADMIN_PASSWORD}"}

@api_router.get("/admin/clients")
async def admin_clients(_: bool = Depends(require_admin)):
    clients = await db.clients.find({}, {"_id": 0}).to_list(1000)
    return clients

@api_router.delete("/admin/clients/{client_id}")
async def admin_remove_client(client_id: str, _: bool = Depends(require_admin)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"ok": True}

@api_router.post("/admin/clients/{client_id}/regenerate-code")
async def admin_regen_code(client_id: str, _: bool = Depends(require_admin)):
    new_code = gen_code()
    new_exp = (now_utc() + timedelta(days=7)).isoformat()
    res = await db.clients.update_one(
        {"id": client_id},
        {"$set": {"code": new_code, "code_expires_at": new_exp}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    c = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if c:
        try:
            await send_code_email(c["email"], c["name"], new_code, _expires_label(new_exp))
        except Exception as e:
            logger.warning("email send failed: %s", e)
    return {"code": new_code, "code_expires_at": new_exp}

class MenuUpdateIn(BaseModel):
    days: Dict[str, Dict[str, str]]

@api_router.put("/admin/menu/current")
async def admin_update_menu(payload: MenuUpdateIn, _: bool = Depends(require_admin)):
    ws = week_start_iso()
    await db.menus.update_one(
        {"week_start": ws},
        {"$set": {"days": payload.days, "updated_at": now_utc().isoformat()}},
        upsert=True,
    )
    return {"ok": True, "week_start": ws, "days": payload.days}

@api_router.get("/admin/menu/current")
async def admin_get_menu(_: bool = Depends(require_admin)):
    ws = week_start_iso()
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
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

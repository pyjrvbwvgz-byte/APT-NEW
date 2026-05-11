# ABPT — bruddatrain · Product Requirements Document

## Original problem statement
Create a professional meal prep website with weekly menus, the option of client profiles aswell, I want a custom domain, make the meal plans viable to download via pdf, incorporate foods such as breakfast bagel, chicken stir fry with rice, burrito bowl, 100% Irish beef burger with sweet potato fries, Greek yogurt with granola and fruit (strawberries, blueberries, bananas, kiwis), a chicken salad, omelette, avocado toast with fried egg, spaghetti Alfredo, potatoes salmon and broccoli with rice and asparagus, steak, banana pancakes, oats — plus a shopping list for all items mentioned in the recipes.

## Brand
- Name: **ABPT**
- Tagline: **bruddatrain**
- Target domain: **apt_train.ie**
- Vibe: simplistic, green, encouraging.

## User choices captured
- 4-digit code auth (client self-register, code regenerates every 7 days, admin can remove clients).
- Single rotating weekly menu (Mon–Sun · breakfast/lunch/dinner).
- Auto-generated shopping list from the active week.
- Combined PDF: meal plan + recipes + shopping list.
- No prices/currency.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/api`. Recipes seeded on startup.
- **Frontend**: React (CRA + craco), TailwindCSS, shadcn/ui, lucide-react icons, sonner toasts. PDF via `jspdf` + `jspdf-autotable`.
- **Auth**: client token = `<client_id>:<code>` (Bearer). Admin token = `admin:<password>`.

## Personas
1. **Client (member)** — receives a 4-digit code, views weekly plan, downloads PDF.
2. **Admin (coach)** — logs in, manages clients (remove / regenerate code), edits the weekly menu.

## Implemented (2026-02)
- Landing page (hero, How it works, CTA) — green/earthy aesthetic, Outfit/Manrope fonts.
- Registration / login (OTP-style 4-digit input).
- Client dashboard: Mon–Sun grid (21 meals), recipe cards with images, countdown badge, refresh-code button.
- Recipe detail page with ingredients & step-by-step instructions.
- Shopping list (aggregated, de-duped by name+unit) with checkable items.
- Combined PDF (cover · weekly table · per-recipe pages · shopping list).
- Admin panel: password login (`abpt2025` default), client table (regen code, remove), weekly menu editor with shadcn Select per slot, Save.
- 15 seeded recipes covering every food user listed + mix-ins (tuna wrap, smoothie bowl, overnight oats).

## Backlog
- **P1**: connect real custom domain `apt_train.ie` after deployment via Emergent dashboard.
- **P1**: email the 4-digit code to clients on register (Resend/SendGrid integration).
- **P2**: weekly auto-rotation cron — at week_start, shuffle templates so the plan feels fresh.
- **P2**: macros (kcal/protein/carbs/fat) per recipe + weekly totals.
- **P2**: client favourite / dislike list to personalise the weekly plan.
- **P3**: Stripe subscription gating (optional).

## Test credentials
See `/app/memory/test_credentials.md`.

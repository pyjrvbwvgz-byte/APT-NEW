# APT — bruddatrain · Product Requirements Document

## Brand
- Name: **APT** (Abraham's Personal Training)
- Tagline: **bruddatrain**
- Domain: **apttrains.com** (production)
- Vibe: simplistic, green, encouraging.

## Access model (two paths)
1. **Stripe Subscription** — €14.99/month, 30-day access pass. Cancel anytime, immediate loss of access on expiry.
2. **Admin-issued 4-digit code** — created by Abraham for active coaching clients; auto-rotates every Monday; codes emailed to admin (`abpt@apttrains.com`) for distribution. Stops working when admin stops sharing/regenerating.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/api`. Stripe via `emergentintegrations.payments.stripe.checkout`. Email via Resend.
- **Frontend**: React (CRA+craco) + Tailwind + shadcn/ui + lucide-react + jsPDF.
- **Auth**: token = `<client_id>:<secret>` (Bearer). Secret = subscription_token if subscribed, else weekly code. Admin token = `admin:<password>`.
- **Webhook**: POST /api/webhook/stripe for production payment confirmation.
- **Background**: weekly_rotation_loop runs hourly to auto-rotate Monday and email admin digest.

## Personas
1. **Subscriber** — pays €14.99/mo, instant access via Stripe Checkout.
2. **Coaching client** — receives weekly 4-digit code from Abraham, loses access if not coaching anymore.
3. **Admin (Abraham)** — creates clients, rotates codes, edits weekly menu, removes clients.

## Implemented (2026-02)
- Landing page with dual CTAs + pricing cards
- **Stripe Payment Link** flow (€14.99/mo) — user clicks Subscribe → Stripe-hosted checkout → returns to /subscribe/success → activates by email lookup
- **Real Stripe SDK** webhook receiver (`/api/webhook/stripe`): handles `checkout.session.completed` (grant), `invoice.paid` (extend), `customer.subscription.deleted`/`paused` (immediate revoke)
- **Stripe Customer Portal** — subscribers click "Manage subscription" on dashboard → opens Stripe-hosted portal for self-service cancel/update card/invoices
- Admin-issued 4-digit code system with weekly Monday auto-rotation
- Admin client CRUD: create (emails code to admin), remove, regenerate, rotate-all
- Per-recipe macros (kcal/protein/carbs/fat) + dashboard weekly totals + daily kcal
- Combined PDF (cover + weekly grid + per-recipe + shopping list, with macros)
- Auto-aggregated shopping list (dedup by name+unit)
- 15 seeded recipes covering all foods user listed + mix-ins
- Branded HTML email templates (code + admin digest)
- APT logo (light version) in header/footer/favicon/PDF
- Emergent attribution badge hidden

## Backlog
- **P1**: Configure Stripe payment link in Stripe dashboard → redirect to `https://apttrains.com/subscribe/success` after success
- **P1**: Configure Stripe webhook in Stripe dashboard → `https://apttrains.com/api/webhook/stripe` with events `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted`
- **P1**: Enable Stripe Customer Portal (Stripe → Settings → Customer Portal → Activate)
- **P1**: Verify a sender domain in Resend (e.g. `coach@apttrains.com`) and switch SENDER_EMAIL
- **P2**: Email subscribers their renewal date 3 days before expiry
- **P3**: Macros customisation per client (calorie target, dietary tags)

## Test credentials
See `/app/memory/test_credentials.md`.

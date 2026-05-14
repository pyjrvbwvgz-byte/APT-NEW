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
- Stripe €14.99/mo subscription flow (checkout → success polling → idempotent grant)
- Stripe webhook receiver for production confirmation
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
- **P1**: Verify a sender domain in Resend (e.g. `coach@apttrains.com`) so emails reach all clients/admin
- **P1**: Production env vars on deployment: ensure STRIPE_API_KEY, RESEND_API_KEY, SENDER_EMAIL, ADMIN_PASSWORD, ADMIN_NOTIFY_EMAIL are set in Emergent dashboard
- **P1**: Switch to a real (non-test) Stripe key once live billing required
- **P2**: True recurring Stripe subscription (current model is monthly access passes; user pays each month)
- **P2**: Subscriber self-service portal (cancel, change card, view invoices)
- **P2**: Email subscribers their renewal date 3 days before expiry
- **P3**: Macros customisation per client (calorie target, dietary tags)
- **P3**: "Resend my code" button for clients on the login screen

## Test credentials
See `/app/memory/test_credentials.md`.

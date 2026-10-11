# APT — Meal Prep Platform

## Original Problem
Professional meal prep website with weekly menus, client profiles, PDF download, shopping lists, dual auth, personalized calories/macros, and progress tracking.

## Current Status
- Dual auth: 4-digit weekly code + €14.99/mo Stripe subscription
- 35 recipes, per-client randomized weekly menus
- PDF meal plan + auto shopping list
- Resend email digests to admin
- Admin CMS: Clients / Weekly menu / Meals / Website (4 tabs, image uploads via Emergent Object Storage)
- Personalized nutrition — Mifflin-St Jeor BMR, day-scale meal portioning, mandatory intake modal
- **NEW: Progress log** — weekly weigh-in tracker with line chart, start/current/change/on-track badges, auto-recalibrates daily targets when weight changes

## Recent Timeline
- 2026-02-28: AdminPage.jsx fix, 4 admin tabs live
- 2026-02-28: Emergent Object Storage image uploads (meals + website)
- 2026-07-01: Client profile intake → Mifflin-St Jeor → day-scale meal portioning
- 2026-07-01: Progress log with weigh-in history, chart, and auto plan recalibration

## Architecture
- Backend: nutrition.py (compute_targets + day_scale_factor), server.py endpoints:
  - `GET/PUT /api/client/profile`
  - `GET/POST/DELETE /api/client/weigh-ins`
  - `/menu/current` + `/menu/shopping-list` return `targets` + `day_scales`
  - weigh-in POST updates `profile.weight_kg` → targets recalc
- Frontend components: ProfileIntakeModal, ProgressLog (recharts line chart)

## P0/P1 Backlog
- P1: Scale RecipePage kcal/macros/ingredients to client's day-scale
- P1: Include daily targets on the downloadable PDF
- P1: Admin — view/edit each client's profile + weigh-ins
- P1: Theme color picker in Website tab
- P2: "Pick from existing uploads" image gallery
- P2: Goal weight field so chart can show a reference line

## 2026-02 — Public site redesign (dark reference-style)
Request: "completely change the website layout" to match a dark, bold fitness marketing reference.
User choices: dark theme on PUBLIC pages only; accent electric blue #38bdf8; nothing from the reference avoided.

Implemented (2026-02, tested — iteration_6.json, 100% frontend pass):
- `index.css`: dark root theme (Schibsted Grotesk / IBM Plex Sans / PT Serif), grain + skew-clip + marquee + rise-in utilities,
  `.theme-light` escape hatch (dashboard/recipe/admin stay light) and `.theme-dark-bar` (header/footer keep dark tokens inside light pages),
  `.logo-on-dark` (inverts the black .VPT mark on dark surfaces).
- `Layout.jsx`: new dark Header (scrolling announcement bar + CMS nav links + mobile menu, `marketing` prop) and big dark Footer with marquee strapline.
- `LandingPage.jsx`: rebuilt — full-bleed hero, stats band, alternating feature rows (circle/rounded/skew image shapes), 4-up how-it-works grid, extras gallery, closing CTA. All content from `GET /api/site`.
- `AuthPage`/`SubscribePage`/`SubscribeSuccessPage`: dark restyle.
- `site_content_defaults.py`: new editable shape — announcement, nav.links, landing.hero(kicker/title_prefix/title_highlight/subtitle/bg_image_url/CTAs), stats.items, features.items(+shape), how.steps, cta, footer(brand/tagline/support/lines/copyright/strapline), extras.
- `AdminContentTab.jsx`: CMS editor rewritten for the new shape (incl. nav-link editor, stat/feature/step repeaters, image-shape dropdown, footer fields).
- `server.py`: fixed ObjectId serialisation in `admin_create_recipe`.

Note: preview only — user must redeploy for apttrains.com to pick this up.

## P0/P1 Backlog (updated)
- P1: Scale RecipePage kcal/macros/ingredients to client's day-scale
- P1: Include daily targets on the downloadable PDF
- P1: Theme accent-colour picker in the Website tab (CSS var driven)
- P2: Dark pass over the client dashboard + admin (currently `.theme-light`)
- P2: "Pick from existing uploads" image gallery
- P2: Goal weight field so chart can show a reference line

## 2026-02 — Mobile-first pass + weekly code fix (tested: iteration_7.json, 100% backend 13/13 + 100% frontend)

### Weekly access codes — root cause & fix
Root cause: rotation ran in an in-process `asyncio` loop (`weekly_rotation_loop`), so it only fired
while the server happened to be awake — deployed instances sleep, hence Mondays were missed live.
- Loop deleted. Rotation now driven by the platform scheduler: `.emergent/crons.yml` → `weekly-codes`,
  `cron: "0 6 * * 0"`, `timezone: Europe/Dublin` → `POST /api/cron/rotate-codes`.
- Cron endpoint: constant-time Bearer check against `WEBHOOK_CRON_SECRET` (backend/.env),
  idempotent on `X-Webhook-Id` (`db.cron_runs`), acks 2xx immediately and rotates in a BackgroundTask.
- Code week is now **Sunday 06:00 → following Sunday 06:00 Europe/Dublin** (`code_week_start()`,
  `next_code_expiry()`, `_dublin_anchor()`), replacing "expires Monday 00:00 UTC".
- Subscribers now get a 4-digit code too: issued the moment the Stripe grant lands, and included in
  every weekly renewal. `eligible_for_weekly_code()` skips `source == "stripe"` accounts whose
  subscription has lapsed. New clients are tagged `source: admin | stripe`.
- Self-heal: `maybe_rotate_codes()` catch-up still runs when the coach opens the client list.
- `GET /api/admin/rotation-status` + new `admin/CodeStatusPanel.jsx` (last sent / count / next batch /
  scheduler configured) with the manual "Renew all codes now" button.
- Members see their own code + expiry in the dashboard (`components/AccessCard.jsx`, copy-to-clipboard).

### Mobile-first
- Public: hero headline clamped, full-width CTAs, Subscribe always visible in the header, tuned
  section rhythm, marquees slowed on small screens + `prefers-reduced-motion`, responsive
  `srcSet`/width-capped stock images (`lib/img.js`), `viewport-fit=cover`, theme-color.
- Dashboard rebuilt: Plan / Shopping / Progress tabs; `DayPlan.jsx` = sticky Mon–Sun selector
  defaulting to today, swipe + prev/next, day totals vs target, full-width meal cards.
- `ShoppingList.jsx`: aisle grouping (`lib/aisles.js`), tick persistence per week in localStorage,
  x/y progress, reset.
- `ProfileIntakeModal.jsx`: 3-step bottom-sheet intake; `ProgressLog.jsx` mobile form + legible chart.
- Admin: client list becomes tappable cards under md, scrollable tab bar, 48px actions; heavy CMS
  editing stays a desktop job (Phase 2).
- Regression suite: `backend/tests/test_cron_rotation.py` (13 tests).

### Release status
- GitHub `main` could NOT be pulled — this workspace has **no git remote configured**, so the owner's
  merged tweaks must be brought in via the platform's GitHub integration (or re-applied here).
- Preview verified healthy; the owner presses Deploy for apttrains.com.

## P0/P1 Backlog (updated 2026-02)
- P1: Bring in GitHub `main` tweaks (needs platform GitHub integration — no remote in pod)
- P1: Scale RecipePage kcal/macros/ingredients to the client's day-scale
- P1: Include daily targets on the downloadable PDF
- P2 (Phase 2): PWA — installable, offline current week, weekly "new code + menu" reminders
- P2 (Phase 2): Full admin CMS usable on a phone
- P2 (Phase 2): Verified Resend sending domain so codes reach members directly
- P2 (Phase 3): Progress photos, meal swapping / "cook tonight" mode, share-a-plan + referrals

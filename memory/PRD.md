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

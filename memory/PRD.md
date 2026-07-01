# APT — Meal Prep Platform

## Original Problem
Professional meal prep website with weekly menus, client profiles, PDF download, shopping lists, dual auth (code + Stripe), and personalized calorie/macro targets.

## Current Status
- Dual auth: 4-digit weekly code + €14.99/mo Stripe subscription
- 35 recipes, per-client randomized weekly menus
- PDF meal plan + auto shopping list
- Resend email digests to admin
- Admin CMS: Clients / Weekly menu / Meals / Website (4 tabs, image uploads working)
- Emergent Object Storage — image upload for meals + website
- **NEW: Personalized nutrition** — Mifflin-St Jeor BMR, per-day meal portion scaling, mandatory intake modal on first dashboard visit

## Implemented (recent)
- 2026-02-28: Fixed AdminPage.jsx broken refactor; 4 tabs live
- 2026-02-28: Emergent Object Storage image uploads (meals + website hero/extras)
- 2026-07-01: Client profile intake (sex/age/height/weight/activity/goal) → Mifflin-St Jeor calc → daily kcal + macros → per-day scale factor applied to meals and shopping list

## Architecture
- Backend: /app/backend/nutrition.py (compute_targets + day_scale_factor), server.py (/client/profile GET/PUT, /menu/current & /menu/shopping-list now return targets + day_scales)
- Frontend: /app/frontend/src/components/ProfileIntakeModal.jsx (mandatory), DashboardPage.jsx (targets banner + ×n scale badge per day)

## P0/P1 Backlog
- P1: Reflect scale factor on individual meal cards in Dashboard/RecipePage (show scaled kcal/macros)
- P1: Reflect scaled ingredients on RecipePage
- P1: Include daily targets on the PDF
- P1: Admin — view/edit each client's profile
- P1: Theme color picker in Website tab
- P2: "Pick from existing uploads" image gallery

# APT — Meal Prep Platform

## Original Problem
Professional meal prep website with weekly menus, client profiles, PDF download, shopping lists, with all listed foods (breakfast bagel, chicken stir-fry, burrito bowl, Irish beef burger, etc.).

## Current Status
- Dual auth: weekly 4-digit code + Stripe €14.99/mo subscription
- 35 recipes, per-client randomized weekly menus
- PDF download (jsPDF) + auto shopping list
- Resend emails for code digests
- Admin CMS with 4 tabs: Clients, Weekly menu, Meals, Website content
- "Save & apply to all clients" pushes menu to every active client (verified 10 clients updated)
- Dynamic landing page content via /api/site
- Stripe webhooks + customer portal

## Implemented (this session)
- 2026-02-28: Fixed broken AdminPage.jsx (stripped 200 lines of orphaned JSX)
- Tabs: Clients / Weekly menu / Meals / Website all rendering
- Backend menu save apply_to_all verified working (10 clients pushed)
- Landing page reads live content from /api/site

## P0/P1 Backlog
- P1: Theme color picker in Website tab (let admin change primary green)
- P1: Per-client menu override editor (currently uniform pushes only)
- P2: Image upload to object storage instead of URL paste

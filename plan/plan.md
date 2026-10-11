# APT Meal Prep — Mobile-First Pass, Weekly Code Fix, and Live Release

A weekly meal-prep service where coaching clients and paying subscribers unlock a personalised 28-meal week with macros, a shopping list and a printable plan.
This round makes the whole thing feel right on a phone, fixes weekly access codes so every member gets a fresh one on schedule, and gets the result onto the live site.

## Who it's for

- **Phone-first visitors** landing on the homepage from a link, a bio or a story — most of them never see a desktop version.
- **Coaching clients** who get a 4-digit code each week and check their plan from the kitchen, the gym or a supermarket aisle.
- **Paying subscribers** (€14.99/month) who expect the same weekly access without chasing anyone for a code.
- **The coach** running the whole thing from the admin area, often from a phone between sessions.

## Core features and experience

### 1. Weekly access codes that actually renew

- **New codes are issued once a week, Sunday at 06:00 (Irish time)**, ready before the week starts. The schedule is handled by the platform's own scheduler, so it runs whether or not anyone is using the site — the current setup only renewed codes while the server happened to be awake, which is why Mondays were being missed on the live site.
- **Subscribers get a code too.** Today a subscriber is let in silently with no 4-digit code of their own; from now on a new subscriber receives a code the moment their payment lands, and is included in every weekly renewal for as long as the subscription is active.
- A code stays valid for a full week — from the Sunday it is issued to the following Sunday morning — so nobody is locked out on a Sunday evening.
- Every member can see their own current code and its expiry inside their dashboard, so a lost email is never a dead end.
- The coach keeps a manual "renew all codes now" button, plus a plain-language panel showing when codes were last renewed, how many went out, and when the next renewal is due.
- A missed renewal self-heals: if the scheduled run is ever skipped, the next time codes are needed or the coach opens the client list, the week's codes are brought up to date.
- The weekly code digest email continues to go out to the coach. Direct emails to members stay limited until the sending domain is verified — worth doing, and called out below.

### 2. A phone-first public site

- Every public page — homepage, code entry, subscribe, payment confirmation — reviewed at real phone widths and rebuilt where it falls short: no sideways scrolling, no clipped headlines, no text smaller than comfortable reading size.
- Headlines, section spacing and the oversized type of the new dark design are re-tuned for small screens rather than simply shrunk.
- Buttons, links and the menu become thumb-sized, with the main call to action always reachable without a stretch.
- Images are served and cropped for phones so the homepage opens quickly on mobile data.
- The scrolling banner and marquee stay, but are calmed down on small screens so they never hijack a swipe.

### 3. A client dashboard built for one hand

- **One day at a time.** The weekly plan opens on today, with a sticky day selector (Mon–Sun) pinned at the top that can be tapped or swiped between days.
- Each day shows its four meals as full-width cards with the calorie and macro numbers readable at a glance.
- The shopping list becomes a tickable, grouped list that survives scrolling and stays usable while standing in a shop.
- Downloading the weekly plan works from a phone, with clear progress and a clear result rather than a silent wait.
- Weigh-ins and the progress chart are reworked for a narrow screen — easy number entry, a chart that is legible without pinching.
- The profile intake form becomes a short, step-by-step flow instead of one long page.

### 4. Admin, workable from a phone

- The admin area stays on its lighter look, but the parts the coach needs on the move — client list, codes, weekly menu — become readable and tappable on a phone. Heavier editing (content, recipes, uploads) remains a desktop job in this round.

### 5. Getting it live

- Changes merged on GitHub `main` are pulled into the working copy first, so the live release includes both those tweaks and the new work.
- Once the pulled version is confirmed healthy, the site is released to apttrains.com.
- Publishing to the live domain is a button the owner presses; the preview is prepared and verified so that press is safe.

## User flow

**New visitor on a phone**
Lands on the homepage → reads a hero that fits the screen → taps **Subscribe** → pays → is returned and activated → receives a 4-digit code and lands in the dashboard on today's meals.

**Returning coaching client**
Opens the site → taps **Client code** → types email and the 4 digits on a large keypad-friendly field → lands on today's day card → swipes to tomorrow → opens the shopping list → ticks items while shopping.

**Sunday morning, everyone**
At 06:00 Irish time new codes are issued for the week ahead for all active clients and subscribers; the coach gets the digest; each member sees their new code in the dashboard.

**The coach**
Opens admin on a phone → sees when codes last went out and when the next batch is due → can renew a single client or everyone on the spot.

## UI/UX feel

- The dark, bold, electric-blue public look established in the last round is kept — this is a fit and reach exercise, not a restyle.
- Mobile is treated as the real layout rather than a shrunken desktop: single column, generous vertical rhythm, one clear action per screen.
- Motion stays, but kept short and cheap so scrolling never stutters on a mid-range phone.
- The logged-in area keeps its lighter, calmer palette and starts to behave like an app — sticky day selector, swipe between days, thumb-reachable actions.
- Nothing hides behind a hover; every action works on a tap.

## Implementation phases

### Phase 1 — built now

- Pull the merged GitHub `main` into the working copy and confirm the app is healthy.
- Weekly codes issued Sunday 06:00 Irish time on a platform schedule, valid for the full week.
- Subscribers receive a code on joining and are included in every weekly renewal.
- Members see their current code and expiry; the coach gets a renewal status panel and keeps manual renewal.
- Phone-first rework of all public pages.
- Phone-first dashboard: sticky day selector with one-day-at-a-time plan, tickable shopping list, working plan download, mobile weigh-ins and chart, stepped profile form.
- Admin client list, codes and weekly menu usable on a phone.
- Prepared for release so the live site can be updated.

### Phase 2 — later

- Installable on a phone: home-screen icon, app-like launch, usable on a weak connection, with the current week available offline.
- Weekly reminders when a new code and menu are ready.
- Full admin CMS — content, recipes, image uploads — usable from a phone.
- Verified sending domain so codes and digests reach members directly instead of only the coach.

### Phase 3 — later

- Progress photos taken on the phone alongside weigh-ins.
- Meal swapping and a "cook this tonight" mode with step-by-step prep on a phone.
- Share-a-plan and referral links aimed at phone-sourced sign-ups.
- Insight into how phone visitors move from homepage to paid, used to tighten the funnel.

## Assumptions

- "Sunday at 6:00 am" means 06:00 Europe/Dublin (Irish time), adjusting itself across summer and winter time, rather than a fixed UTC hour.
- Codes run Sunday 06:00 to the following Sunday 06:00, replacing the current "expires Monday" rule, so a code never dies mid-weekend.
- Subscribers get a 4-digit code **in addition to** their existing subscription access — the subscription remains the thing that grants entry, the code is a convenience and is revoked when the subscription lapses.
- Codes remain 4 digits and are not reused intentionally; a brand-new code is generated each week rather than extending the old one.
- GitHub `main` contains only the owner's own tweaks on top of this working copy, so pulling it is safe and nothing from the recent redesign is lost. If the pull shows otherwise, the pull stops and the conflict is reported before anything is released.
- The live release itself is triggered by the owner; preparing and verifying the preview is in scope, pressing publish is not.
- The public site keeps the dark electric-blue design and the logged-in area keeps the lighter one; no new colour direction is introduced.
- The day selector defaults to today, falling back to Monday when today sits outside the plan week.
- Member-facing emails continue to go to the coach's address only until a sending domain is verified; this limitation is not solved in Phase 1.
- Heavy admin editing is treated as a desktop task for now; only monitoring and quick client actions are made phone-ready.
- Phone work targets current iOS and Android browsers at common widths from roughly 360px upwards; no support work for very old devices.

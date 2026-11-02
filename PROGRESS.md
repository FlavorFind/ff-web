# Flavor Find — Website Build Progress

> Repo: `flavor-find-next/flavor-find`  
> Backend: `https://consumer.flavorfind.co.ke/v1/`  
> Last updated: 2026-11-01

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done — built, wired to API, tested in dev |
| 🔨 | In progress |
| ⬜ | Not started |
| 🔒 | Requires auth (JWT Bearer) |
| 💎 | Plus gated |

---

## Pages

### P01 — Home `/`
**Status:** ✅ Done  
**Route:** `/`  
**Auth:** Public

**Sections built:**
- [x] Hero — search bar, ingredient chips, live results, ambiguity picker
- [x] Story scroll — 5-section parallax with live ingredient tokens + bowl animation
- [x] Marquee — live ingredient ticker (wired to `GET /v1/ingredients/`)
- [x] Steps — how it works (3-step explainer)
- [x] Live Pantry — animated ingredient swap demo (wired to `POST /v1/search/`)
- [x] Pairings — dish pairing carousel
- [x] Counties — horizontal scroll of 47 counties (wired to `GET /v1/regions/`)
- [x] Plus box — feature teaser
- [x] Trust / stats section
- [x] CTA section
- [x] Footer

**Buttons / links:**
- `Get started` → `/auth/sign-up`
- `Sign in` → `/auth/sign-in`
- `Cook` nav → `/cook`
- `Counties` nav → `/regions`
- `Plus` nav → `/plus`
- Dish cards in hero results → `/dishes/[slug]`
- County tiles → `/regions/[slug]`
- `See all counties` → `/regions`
- `Join Plus` / `Get Plus` → `/plus`
- Footer links → `/about`, `/help`, `/legal/privacy`, `/legal/terms`

---

### P02 — Cook (Search) `/cook`
**Status:** ✅ Done  
**Auth:** Optional

**What it does:**  
The core product page. Ingredient builder + results grid. The full search experience.

**Sections to build:**
- [ ] Page header — title + mode toggle (Strict | Explore)
- [ ] Ingredient input — large pill bar, autocomplete dropdown (EN + SW), chip list
- [ ] Ambiguity picker — modal/sheet when engine returns `ambiguous` tokens
- [ ] Pantry merge banner — "We added X items from your pantry" (auth users)
- [ ] Results — tiered grid (Exact → Can make → Almost) with tier section headers
- [ ] Dish cards — image slot, name, SW name, tier badge, region tag, heart (save)
- [ ] Empty state — no results for strict, suggest switching to Explore
- [ ] Engine degraded banner — cached results notice
- [ ] Allergen disclaimer — below every results set
- [ ] Loading skeleton — cards shimmer while searching

**API calls:**
- `POST /v1/resolve/` — on each ingredient add
- `POST /v1/search/` — on search submit
- `GET /v1/ingredients/?q=` — autocomplete suggestions
- `POST /v1/saved/` 🔒 — save a dish (heart button)

**Buttons / links:**
- Dish card → `/dishes/[slug]`
- Heart/save button → saves to library (auth required, prompts sign-in if not)
- `Switch to Explore` (in empty state) → changes mode and re-searches
- `Go to pantry` (in auth banner) → `/pantry`
- Sign in prompt → `/auth/sign-in`

---

### P03 — Dish Detail `/dishes/[slug]`
**Status:** ✅ Done  
**Auth:** Public

**Sections to build:**
- [ ] Hero — dish name (EN + SW), region tag, diet tags, tier badge (if arriving from search)
- [ ] Ingredients list — required + optional, quantities
- [ ] Cooking steps — numbered, expandable
- [ ] Cook mode — full-screen step-by-step with wake lock
- [ ] Pairings — side dishes, drinks, desserts (strength dots 1–5)
- [ ] Substitutions — ingredient swap table (Great / OK / Emergency grades)
- [ ] Nutrition — estimates table, "Estimate" label 💎 (Plus gated)
- [ ] Cost estimate — KES, "Estimate" label
- [ ] Save button 🔒
- [ ] Add to meal plan 🔒💎
- [ ] Allergen disclaimer (always shown)
- [ ] Related dishes (same region or same ingredients)

**API calls:**
- `GET /v1/dishes/[slug]/` — full dish detail
- `POST /v1/saved/` 🔒
- `GET/PUT /v1/plans/<week>/` 🔒💎

**Buttons / links:**
- `Save recipe` → saves to library
- `Add to plan` → meal planner
- `Cook mode` → full-screen mode on same page
- Region tag → `/regions/[slug]`
- Pairing dish → `/dishes/[pairing-slug]`
- `Get Plus` (nutrition gate) → `/plus`

---

### P04 — Taste of 47 Counties `/regions`
**Status:** ⬜ Not started  
**Auth:** Public

**Sections to build:**
- [ ] Page hero — title + intro copy
- [ ] Interactive county grid / map — 47 county tiles, gold dot on those with stories
- [ ] Filter bar — by region type (Coast, Central, Rift Valley, etc.)
- [ ] County tile — name, region image placeholder, "Read story" if story exists

**API calls:**
- `GET /v1/regions/` — all 63 regions
- `GET /v1/stories/` — to know which counties have stories

**Buttons / links:**
- County tile with story → `/regions/[slug]` (story page)
- County tile without story → still links, shows dishes from that region on the detail page

---

### P05 — Region / Story Page `/regions/[slug]`
**Status:** ⬜ Not started  
**Auth:** Public

**Sections to build:**
- [ ] Story header — title EN + SW, region name, author, published date
- [ ] Story body — rich text, editorial
- [ ] Dishes from this region — horizontal scroll of dish cards (wired to search)
- [ ] Neighbouring regions
- [ ] Back to counties map

**API calls:**
- `GET /v1/stories/[slug]/` — story detail
- `GET /v1/regions/` — for related regions

**Buttons / links:**
- Dish cards → `/dishes/[slug]`
- `← All counties` → `/regions`
- Neighbouring region → `/regions/[slug]`

---

### P06 — Pantry `/pantry`
**Status:** ⬜ Not started  
**Auth:** 🔒 Required

**Sections to build:**
- [ ] Current pantry — ingredient chips, remove button per chip
- [ ] Add ingredient — input with autocomplete (same as Cook page)
- [ ] Ambiguity picker — when adding an ambiguous ingredient
- [ ] Empty state — "Your pantry is empty. Add ingredients to get personalised matches."
- [ ] "Search with pantry" shortcut → goes to Cook with pantry pre-loaded

**API calls:**
- `GET /v1/pantry/` — load items
- `POST /v1/pantry/` — add item
- `DELETE /v1/pantry/[uuid]/` — remove item
- `GET /v1/ingredients/?q=` — autocomplete

**Buttons / links:**
- `Search now` → `/cook` (with pantry pre-loaded)
- `Add ingredient` → opens input
- Remove chip (×) → `DELETE /v1/pantry/[uuid]/`

---

### P07 — Saved, Collections, Cooked `/saved`
**Status:** ⬜ Not started  
**Auth:** 🔒 Required

**Tabs:**
- [ ] Saved recipes — grid of saved dishes, unsave button
- [ ] Collections — list of collections, create new, view collection dishes
- [ ] Cook history — chronological list of cooked dishes with date

**API calls:**
- `GET /v1/saved/` — saved recipes
- `DELETE /v1/saved/[uuid]/` — unsave
- `GET/POST /v1/saved/collections/` — collections
- `GET/POST /v1/cooked/` — cook log

**Buttons / links:**
- Dish card → `/dishes/[slug]`
- `Unsave` → removes from saved
- `Create collection` → modal
- `Cook again` → `/dishes/[slug]`
- Free tier limit notice (>20 saved) → `/plus`

---

### P08 — Meal Planner `/planner`
**Status:** ⬜ Not started  
**Auth:** 🔒💎 Plus required

**Sections to build:**
- [ ] Week grid — 7 days × 3 meals (Breakfast / Lunch / Dinner)
- [ ] Week navigator — ← prev / next → (ISO week format YYYY-Www)
- [ ] Slot — dish name, swap button, remove button
- [ ] Add dish to slot — opens search or picks from saved
- [ ] Shopping list export → `/shopping-list/[id]`
- [ ] Plus paywall — shown to free users

**API calls:**
- `GET/PUT /v1/plans/<week>/` 💎
- `POST /v1/saved/` 🔒

**Buttons / links:**
- `Generate shopping list` → `/shopping-list/[id]`
- Dish name → `/dishes/[slug]`
- `Upgrade to Plus` (paywall) → `/plus`

---

### P09 — Shopping List `/shopping-list/[id]`
**Status:** ⬜ Not started  
**Auth:** 🔒💎 Plus required

**Sections to build:**
- [ ] Ingredient list — grouped by category (produce, proteins, pantry staples)
- [ ] Check-off — tick items as bought
- [ ] Cost estimate — per item and total, "Estimate" label
- [ ] Share / export (copy text)
- [ ] Plus paywall for non-Plus users

**API calls:**
- Shopping list is derived from `GET /PUT /v1/plans/<week>/` — items extracted from meal plan

**Buttons / links:**
- `← Back to planner` → `/planner`
- `Upgrade to Plus` (paywall) → `/plus`

---

### P10 — Budget Mode `/budget`
**Status:** ⬜ Not started  
**Auth:** 🔒💎 Plus required

**Sections to build:**
- [ ] Budget input — KES amount slider/input
- [ ] Results — dishes within budget, cost estimate per dish, "Estimate" label
- [ ] Empty state — no dishes within budget, suggest higher amount
- [ ] Plus paywall

**API calls:**
- `POST /v1/budget/suggest/` 💎

**Buttons / links:**
- Dish card → `/dishes/[slug]`
- `Upgrade to Plus` (paywall) → `/plus`

---

### P11 — Plus Page `/plus`
**Status:** ⬜ Not started  
**Auth:** Public

**Sections to build:**
- [ ] Hero — headline, price (KES 199/month)
- [ ] Feature comparison — Free vs Plus table
- [ ] Feature cards — meal plans, shopping list, offline sync, nutrition, budget mode, no ads
- [ ] Subscribe CTA → checkout flow
- [ ] FAQ section

**API calls:**
- `GET /v1/plans/` — Free + Plus plan details
- `GET /v1/subscription/` 🔒 — current status (to show if already subscribed)

**Buttons / links:**
- `Subscribe — KES 199/month` → `/checkout`
- `Sign in first` (if not auth) → `/auth/sign-in`

---

### P12 — Checkout (M-Pesa) `/checkout`
**Status:** ⬜ Not started  
**Auth:** 🔒 Required

**Sections to build:**
- [ ] Order summary — Plus plan, KES 199/month
- [ ] Phone number input — M-Pesa number (pre-filled from profile if available)
- [ ] STK push trigger — "Pay with M-Pesa" button
- [ ] Waiting state — "Check your phone for the M-Pesa prompt"
- [ ] Success state — subscription active, go to planner
- [ ] Error state — payment failed, retry

**API calls:**
- `POST /v1/subscribe/` — triggers M-Pesa STK push
- `GET /v1/subscription/` — poll for activation after payment

**Buttons / links:**
- `Pay KES 199 with M-Pesa` → triggers STK push
- `← Back` → `/plus`
- `Go to planner` (on success) → `/planner`

---

### P13 — Auth Pages

#### Sign In `/auth/sign-in`
**Status:** ✅ Done — split layout, email+password, real AuthContext login, redirect if already auth  
**Auth:** Public

- [ ] Email + password form
- [ ] Phone OTP tab (request OTP → enter OTP)
- [ ] "Forgot password" link (out of scope v1 — note only)
- [ ] Link to sign up

**API calls:**
- `POST /v1/auth/login/` — email+password OR phone OTP

**Buttons / links:**
- `Sign in` → submits form → redirects to `/cook`
- `Create account` → `/auth/sign-up`
- `Sign in with phone` tab → OTP flow

#### Sign Up `/auth/sign-up`
**Status:** ✅ Done — split layout, registers + logs in immediately (no email gate), field-level API errors  
**Auth:** Public

- [ ] Email, username, password fields
- [ ] Terms acceptance checkbox
- [ ] Redirects to verify email page after registration

**API calls:**
- `POST /v1/auth/register/`

**Buttons / links:**
- `Create account` → submits → `/auth/verify-email`
- `Already have an account?` → `/auth/sign-in`

#### Verify Email `/auth/verify-email`
**Status:** ✅ Done — reads ?token from URL link click, auto-verifies, resend by email, no manual token paste  
**Auth:** Public

- [ ] "Check your inbox" message
- [ ] Token input (from email link)
- [ ] Resend email option

**API calls:**
- `POST /v1/auth/verify-email/`

**Buttons / links:**
- `Verify` → submits token → redirects to `/cook`
- `Resend email` → re-calls register or verify endpoint

---

### P14 — Account `/account`
**Status:** ⬜ Not started  
**Auth:** 🔒 Required

**Tabs / sections:**
- [ ] Profile — name, household size, region, budget preference
- [ ] Diet & allergens — diet tags, allergen exclusions
- [ ] Devices — registered devices list
- [ ] Subscription — current plan, renew date, cancel
- [ ] Privacy — GDPR data export, delete account

**API calls:**
- `GET /v1/me/`
- `GET/PATCH /v1/me/profile/`
- `GET/PATCH /v1/me/diet/`
- `GET /v1/me/devices/`
- `GET /v1/me/export/`
- `DELETE /v1/me/delete/`
- `GET /v1/subscription/`

**Buttons / links:**
- `Save changes` → PATCH endpoints
- `Download my data` → triggers export
- `Delete account` → confirmation modal → soft delete
- `Manage subscription` → `/checkout` or cancel flow
- `Sign out` → calls `POST /v1/auth/logout/`, clears tokens, → `/`

---

### P15 — Community `/community`
**Status:** ⬜ Not started  
**Auth:** 🔒 Required

**Sections to build:**
- [ ] Submit recipe wizard — multi-step form
  - Step 1: Dish name (EN + SW), description, region
  - Step 2: Ingredients (with quantities)
  - Step 3: Cooking steps
  - Step 4: Diet tags, review + submit
- [ ] My submissions — list of past submissions with status (draft / in review / accepted)
- [ ] Status badge — Draft, In review, Published

**API calls:**
- `GET/POST /v1/submissions/`

**Buttons / links:**
- `Submit recipe` → opens wizard
- `Save draft` → POST with status=draft
- `Submit for review` → POST with status=submitted
- `← Back to home` → `/`

---

### P16 — Static Pages

#### About `/about`
**Status:** ⬜ Not started — copy + layout only, no API calls

#### Help `/help`
**Status:** ⬜ Not started — FAQ accordion, no API calls

#### Privacy Policy `/legal/privacy`
**Status:** ⬜ Not started — static text

#### Terms of Service `/legal/terms`
**Status:** ⬜ Not started — static text

---

### P17 — System Pages

#### 404 `/not-found`
**Status:** ⬜ Not started  
- [ ] "Page not found" with search CTA

#### 500 `/error`
**Status:** ⬜ Not started  
- [ ] "Something went wrong" with retry + home link

#### Offline `/offline`
**Status:** ⬜ Not started (Plus gated offline sync)  
- [ ] "You're offline" with cached content link

---

## All Navigation Links & Buttons Summary

| From | Label | Destination |
|------|-------|-------------|
| Header | Cook | `/cook` |
| Header | Counties | `/regions` |
| Header | Plus | `/plus` |
| Header | Sign in | `/auth/sign-in` |
| Header | Get started | `/auth/sign-up` |
| Header (auth) | Account | `/account` |
| Header (auth) | Sign out | logout → `/` |
| Home hero | Dish result | `/dishes/[slug]` |
| Home counties | County tile | `/regions/[slug]` |
| Home counties | See all | `/regions` |
| Home Plus box | Get Plus | `/plus` |
| Cook | Dish card | `/dishes/[slug]` |
| Cook | Save (heart) | `POST /v1/saved/` |
| Cook | Go to pantry | `/pantry` |
| Dish detail | Save | `POST /v1/saved/` |
| Dish detail | Add to plan | `/planner` |
| Dish detail | Cook mode | same page full-screen |
| Dish detail | Region tag | `/regions/[slug]` |
| Dish detail | Pairing dish | `/dishes/[slug]` |
| Dish detail | Get Plus (nutrition) | `/plus` |
| Regions | County tile | `/regions/[slug]` |
| Region/Story | Dish card | `/dishes/[slug]` |
| Region/Story | ← Counties | `/regions` |
| Pantry | Search now | `/cook` |
| Saved | Dish card | `/dishes/[slug]` |
| Planner | Shopping list | `/shopping-list/[id]` |
| Planner | Upgrade | `/plus` |
| Budget | Dish card | `/dishes/[slug]` |
| Budget | Upgrade | `/plus` |
| Plus | Subscribe | `/checkout` |
| Plus | Sign in first | `/auth/sign-in` |
| Checkout | Success | `/planner` |
| Checkout | Back | `/plus` |
| Sign in | Success | `/cook` |
| Sign in | Create account | `/auth/sign-up` |
| Sign up | Success | `/auth/verify-email` |
| Sign up | Sign in | `/auth/sign-in` |
| Verify email | Success | `/cook` |
| Account | Manage subscription | `/checkout` |
| Account | Delete account | soft delete → `/` |
| Account | Sign out | `/` |
| Community | Home | `/` |
| 404 | Home | `/` |
| 500 | Home | `/` |

---

## Build Order

Priority order (core product first):

1. ✅ **P01** Home
2. ✅ **P02** Cook (search) — core product
3. ✅ **P03** Dish detail — core product
4. ✅ **P13** Auth (sign in / sign up / verify)
5. ⬜ **P04** Taste of 47 Counties
6. ⬜ **P05** Region / Story page
7. ⬜ **P06** Pantry
8. ⬜ **P07** Saved / Collections / Cooked
9. ⬜ **P11** Plus page
10. ⬜ **P12** Checkout (M-Pesa)
11. ⬜ **P14** Account
12. ⬜ **P08** Meal Planner 💎
13. ⬜ **P09** Shopping List 💎
14. ⬜ **P10** Budget Mode 💎
15. ⬜ **P15** Community
16. ⬜ **P16** Static pages (About, Help, Legal)
17. ⬜ **P17** System pages (404, 500, Offline)

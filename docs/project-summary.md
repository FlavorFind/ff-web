# Flavor Find — Full System Summary

Generated 2026-11-01. This document captures the complete state of both backend systems so the frontend team has full context.

---

## Recipe Engine (ff-engine)

**What it is:** The food data brain. It owns everything about food — dishes, ingredients, pairings, substitutions, nutrition, dietary tags, regions. It knows nothing about people.

**Version:** v1.0.0 (commit `e7f2b23`), deployed and live on staging.

**Stack:** Python 3.12, Django 5.2, DRF 3.18, PostgreSQL 16, Redis 7, Celery 5.4

**14 Django apps:**

| App | Purpose |
|---|---|
| `core` | Base models (UUID pk, timestamps, status mixin), middleware, pagination, exceptions |
| `accounts` | Staff user model (CustomUser), admin with mandatory 2FA |
| `ingredients` | 878 ingredients, 1,498 aliases, 12 categories |
| `dishes` | 300 dishes, 1,282 ingredient links, 750 cooking steps |
| `regions` | 63 regions (47 counties + neighbouring countries) |
| `dietary` | 8 dietary tags, 1,721 dish-tag mappings |
| `pairings` | 153 dish pairings |
| `substitutions` | 205 substitution rules |
| `nutrition` | 33 nutrition facts (labelled as estimates) |
| `search` | by-ingredients search engine, scoring, tiering, caching |
| `curation` | Seed commands, community submission intake, dataset diff |
| `clients` | 5 API clients, 12 API keys (SHA-256 hashed, scope-based) |
| `api` | URL routing, health/version views |
| `console` | Internal test UI |

**Engine API endpoints (under `/v1/`):**

```
GET  /v1/health/                    — health check
GET  /v1/meta/version/              — engine + dataset version
GET  /v1/ingredients/               — autocomplete (?q=, ?lang=)
GET  /v1/ingredients/<slug>/        — single ingredient
POST /v1/ingredients/resolve        — resolve free-text tokens
POST /v1/search/by-ingredients      — search by pantry items
GET  /v1/dishes/                    — catalogue (?region=, ?diet=, ?lang=)
GET  /v1/dishes/<slug>/             — dish detail
GET  /v1/dishes/<slug>/pairings/    — suggested pairings
GET  /v1/dishes/<slug>/substitutions/ — substitution options
POST /v1/dishes/<slug>/missing/     — what's missing from pantry
GET  /v1/dishes/<slug>/nutrition/   — nutrition estimates
GET  /v1/regions/                   — 47 counties + neighbours
GET  /v1/datasets/                  — dataset diff for cache invalidation
POST /v1/internal/submissions/      — community recipe intake (internal key)
```

**Engine data totals:**

| Data | Count |
|---|---|
| Dishes | 300 |
| Ingredients | 878 |
| Ingredient aliases | 1,498 |
| Dish-ingredient links | 1,282 |
| Cooking steps | 750 |
| Dish-region mappings | 333 |
| Regions | 63 |
| Substitutions | 205 |
| Pairings | 153 |
| Dish dietary tags | 1,721 |
| Dietary tags | 8 |
| Nutrition facts | 33 |
| API clients | 5 |
| API keys | 12 |

**Engine auth:** API key based (`X-API-Key` header). Keys are SHA-256 hashed, scope-based (`read:search`, `read:catalog`, `internal:curation`). Rate limited per key at 60 req/min.

**Engine search tiers:**
- `exact` — all required ingredients in pantry
- `can_make` — all required + staples assumed (oil, salt, water)
- `almost` — 1-2 missing (explore mode only)

---

## Consumer Backend (ff-consumer)

**What it is:** The people layer. It owns accounts, pantries, meal plans, saved recipes, subscriptions, community submissions, billing. It owns no food data — everything food comes from the engine via API.

**Version:** Latest commit `38964b1`, deployed and live on staging. Go-live checklist signed.

**Stack:** Same as engine plus JWT (simplejwt), Argon2id passwords, M-Pesa/Paystack payments, drf-spectacular OpenAPI.

**18 Django apps:**

| App | Purpose |
|---|---|
| `core` | Base models, request ID middleware, error format, pagination, permissions |
| `accounts` | CustomUser (email + phone), registration, login (email+password + phone OTP), JWT, devices, consent, account deletion/export |
| `profiles` | Profile (household size, region, budget), ProfileDiet (diet tags + allergen exclusions) |
| `engine_client` | Typed client wrapping engine API — retries, timeouts, circuit breaker, dataset version cache, Redis caching |
| `pantry` | Pantry items (engine ingredient IDs + display names) |
| `library` | Saved recipes, collections, cook log |
| `planner` | Weekly meal plans, shopping lists |
| `budget` | Budget mode — filters engine search by KES limit |
| `search` | Wraps engine search, injects pantry + diet, personalisation boost |
| `content` | Taste of 47 counties stories (5 seeded) |
| `community` | Recipe submissions (draft → moderation → engine), reviews |
| `billing` | Plans (Free/Plus), M-Pesa STK push + Paystack, subscriptions, entitlements |
| `notifications` | Push token registration, in-app notifications, preferences |
| `partners` | Sponsored slots (model skeleton) |
| `sync` | Offline change queue for Android, conflict resolution |
| `moderation` | Review queue for submissions and reviews (admin) |
| `api` | Versioned router `/v1/`, OpenAPI schema, health, version |

**~11,595 lines of Python**, 351 test functions across 19 test files.

**Consumer API endpoints (47 total, under `/v1/`):**

```
PUBLIC (no auth):
  GET  /v1/health/
  GET  /v1/meta/version/
  GET  /v1/regions/
  GET  /v1/stories/
  GET  /v1/stories/<slug>/
  GET  /v1/dishes/<slug>/
  POST /v1/mpesa/callback/        (signature verified, not user auth)

AUTH:
  POST /v1/auth/register/
  POST /v1/auth/login/            (email+password or phone OTP)
  POST /v1/auth/refresh/
  POST /v1/auth/logout/
  POST /v1/auth/verify-email/

PROFILE:
  GET  /v1/me/
  GET/PATCH /v1/me/profile/
  GET/PATCH /v1/me/diet/
  GET  /v1/me/devices/
  GET  /v1/me/export/             (GDPR data export)
  DELETE /v1/me/delete/           (soft delete)

PANTRY:
  GET/POST /v1/pantry/
  DELETE /v1/pantry/<uuid>/

SEARCH & RESOLVE:
  POST /v1/search/                (wraps engine, injects pantry + diet)
  POST /v1/resolve/               (wraps engine ingredient resolve)
  GET  /v1/ingredients/           (autocomplete)

LIBRARY:
  GET/POST /v1/saved/
  DELETE /v1/saved/<uuid>/
  POST /v1/saved/collections/
  GET/POST /v1/cooked/

PLANNER (Plus gated):
  GET/PUT /v1/plans/<week>/        (YYYY-Www)

BUDGET (Plus gated):
  POST /v1/budget/suggest/

COMMUNITY:
  GET/POST /v1/submissions/

BILLING:
  GET  /v1/plans/                 (Free + Plus details)
  POST /v1/subscribe/             (M-Pesa STK push)
  GET  /v1/subscription/          (current plan status)

NOTIFICATIONS:
  GET/POST /v1/notifications/

SYNC (Plus gated):
  POST /v1/sync/push/
  GET  /v1/sync/pull?since=
```

**Consumer DB totals (staging):**

| Data | Count |
|---|---|
| Users | 10 |
| Pantry items | 2 |
| Saved recipes | 2 |
| Collections | 1 |
| Cook logs | 4 |
| Meal plans | 0 |
| Submissions | 1 |
| Stories | 5 |
| Subscriptions | 0 |

**Verified working (end-to-end tested 2026-11-01):**

- Registration, login (email + phone OTP), JWT refresh, logout
- Profile + diet management
- Pantry CRUD
- Ingredient resolve (handles ambiguity — "unga" triggers choice picker)
- Search (strict + explore modes, diet auto-injected, allergen disclaimer present)
- Save recipes, collections, cook log
- Budget suggest (correctly returns 403 for free users)
- Community submissions (draft → moderation queue)
- Billing plans + subscription status
- 5 Taste of 47 Counties stories live
- Load test: p95 = 39.9ms at 50 req/s (threshold: 250ms)
- Soak test: p95 = 18ms, 5xx = 0.23%, 143,921 iterations over 2 hours
- Permission isolation: user A cannot see user B's data
- Staff 2FA enforced
- Off-server backups running nightly (engine + consumer DB + config)

---

## How They Connect

```
Consumer Backend  ──► Engine API (only route)
                  X   Engine DB (never)

Two keys:
  ENGINE_API_KEY       — read:search, read:catalog
  ENGINE_INTERNAL_KEY — internal:curation (community submissions only)
```

The consumer backend calls the engine for all food data. It never sends user IDs, emails, or device data to the engine. Diet/allergen exclusions are injected on every search call — no exceptions.

---

## What's Still Open

| Item | Notes |
|---|---|
| External pen test | Schedule within 30 days of launch |
| App team integration | Hand off OpenAPI schema to website + Android teams |
| Images for dishes/ingredients | Engine v1.1.0 additive change — nullable `image_url` field |

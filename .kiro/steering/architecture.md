# Consumer Website Architecture

## How the three systems connect

```
┌─────────────┐     HTTPS/JWT     ┌──────────────┐    HTTPS/API Key   ┌──────────┐
│   ff-web    │ ───────────────►  │  ff-consumer  │ ────────────────► │ ff-engine│
│  (frontend) │                   │  (backend API)│                    │ (food DB)│
│  this repo  │  ◄─────────────── │   Django/DRF │  ◄────────────────  │  Django  │
└─────────────┘    JSON responses └──────────────┘   JSON responses    └──────────┘
```

## Data ownership

| System | Owns | Does NOT own |
|---|---|---|
| ff-web | UI state, client-side routing, local caching, PWA offline | Food data, user data server-side |
| ff-consumer | Users, pantries, meal plans, saved recipes, subscriptions, billing, community submissions | Food data (dishes, ingredients, nutrition, pairings) |
| ff-engine | Dishes, ingredients, aliases, regions, pairings, substitutions, nutrition, dietary tags | Users, accounts, pantries, billing |

## What the frontend calls

The frontend only talks to the consumer backend API. Full OpenAPI schema is in `docs/openapi.yaml`.

### Public endpoints (no auth)

```
GET  /v1/health/                      — health check
GET  /v1/meta/version/                 — backend + engine dataset version
GET  /v1/regions/                      — 47 counties + neighbouring countries
GET  /v1/stories/                      — editorial stories (Taste of 47 Counties)
GET  /v1/stories/<slug>/               — single story detail
GET  /v1/dishes/<slug>/                — dish detail (proxy to engine)
POST /v1/mpesa/callback/               — M-Pesa webhook (signature verified, not user auth)
```

### Auth endpoints

```
POST /v1/auth/register/                — create account (email + password)
POST /v1/auth/login/                    — login (email+password or phone OTP)
POST /v1/auth/refresh/                  — refresh JWT access token
POST /v1/auth/logout/                   — revoke refresh token
POST /v1/auth/verify-email/             — verify email address
```

### User profile (requires auth)

```
GET  /v1/me/                            — current user
GET/PATCH /v1/me/profile/               — household size, region, budget
GET/PATCH /v1/me/diet/                  — diet tags + allergen exclusions
GET  /v1/me/devices/                    — registered devices
GET  /v1/me/export/                     — GDPR data export (JSON)
DELETE /v1/me/delete/                   — soft delete account
```

### Search & resolve (requires auth for personalised)

```
POST /v1/search/                        — wraps engine search (injects pantry + diet)
POST /v1/resolve/                       — resolve free-text ingredient tokens
GET  /v1/ingredients/?q=&lang=          — ingredient autocomplete
```

### Pantry (requires auth)

```
GET  /v1/pantry/                        — list pantry items
POST /v1/pantry/                        — add item
DELETE /v1/pantry/<uuid>/               — remove item
```

### Library (requires auth)

```
GET/POST /v1/saved/                     — saved recipes
DELETE /v1/saved/<uuid>/                — unsave
POST /v1/saved/collections/             — create collection
GET/POST /v1/cooked/                    — cook log history
```

### Planner (Plus gated)

```
GET/PUT /v1/plans/<week>/               — weekly meal plan (YYYY-Www format)
```

### Budget (Plus gated)

```
POST /v1/budget/suggest/                — dishes within KES budget
```

### Community (requires auth)

```
GET/POST /v1/submissions/                — recipe submissions
```

### Billing

```
GET  /v1/plans/                         — Free + Plus plan details
POST /v1/subscribe/                      — M-Pesa STK push
GET  /v1/subscription/                   — current subscription status
```

### Notifications & Sync

```
GET/POST /v1/notifications/              — in-app notifications
POST /v1/sync/push/                      — offline sync (Plus gated)
GET  /v1/sync/pull?since=                — offline sync (Plus gated)
```

## Free vs Plus gating

| Feature | Free | Plus (KES 199/month) |
|---|---|---|
| Search | unlimited | unlimited |
| Dish pages + regions | yes | yes |
| Pantry | yes | yes |
| Save recipes | up to 20 | unlimited |
| Community submissions | yes | yes |
| Meal plans | no | yes |
| Shopping lists | no | yes |
| Budget mode | no | yes |
| Nutrition details | no | yes |
| Offline sync | no | yes |
| Ads | yes | no |

## Safety rules the frontend must enforce

1. **Diet/allergen exclusions always applied** — the backend injects diet tags from the user's profile on every search. The frontend should never try to override or skip this.
2. **Ambiguity never guessed** — when the engine returns `ambiguous` for a resolved ingredient, the frontend must show a choice picker. Never pass an ambiguous token to search.
3. **Allergen disclaimer** — every response that mentions dietary info must display: "Allergen information is for guidance only. Always confirm with the kitchen before ordering."
4. **Engine outage handling** — when the backend returns `engine_status: degraded`, show cached results with a notice that the engine is temporarily unavailable.
5. **Estimates labelled** — nutrition and cost data are always estimates. Display "Estimate" labels.

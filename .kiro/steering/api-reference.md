# Consumer Backend API Reference

The full OpenAPI schema is in `docs/openapi.yaml` (68KB, 47 endpoints). This file is a practical quick-reference for the frontend.

## Base URL

```
Production/Staging:  https://consumer.flavorfind.co.ke/v1/
```

## Authentication

JWT bearer token for authenticated endpoints:
```
Authorization: Bearer <access_token>
```

Access tokens are short-lived (15 min). Refresh tokens rotate and last 30 days.

Login returns:
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": "uuid", "email": "...", "phone": "..." }
}
```

## Core data shapes

### Search request (POST /v1/search/)

```json
{
  "ingredients": ["tomato", "onion", "rice"],
  "mode": "strict",
  "lang": "en",
  "limit": 20
}
```

The backend automatically:
- Merges pantry items into `ingredients` (if signed in)
- Injects diet/allergen tags from user profile
- Adds personalisation (region boost, cook history)

**Never send `diet` from the frontend.** The backend handles this from the user's profile.

### Search response

```json
{
  "dataset_version": "2026.10.0",
  "mode": "strict",
  "total_results": 12,
  "resolved": [
    { "token": "tomato", "status": "matched", "ingredient_id": "uuid", "confidence": 0.95 }
  ],
  "ambiguous": ["unga"],
  "results": {
    "exact": [
      {
        "dish_id": "uuid",
        "slug": "ugali-sukuma",
        "name_en": "Ugali with Sukuma Wiki",
        "name_sw": "Ugali na Sukuma",
        "tier": "exact",
        "score": 0.92,
        "matched": [...],
        "missing": [],
        "quality_level": "verified"
      }
    ],
    "can_make": [...],
    "almost": [...]
  },
  "allergen_disclaimer": true
}
```

### Resolve response (POST /v1/resolve/)

```json
{
  "resolved": [
    {
      "token": "unga",
      "status": "ambiguous",
      "ingredient_id": null,
      "options": [
        { "ingredient_id": "uuid", "name_en": "Maize flour", "name_sw": "Unga wa mahindi" },
        { "ingredient_id": "uuid", "name_en": "Wheat flour", "name_sw": "Unga wa ngano" }
      ]
    }
  ]
}
```

If any token is `ambiguous`, show a choice picker. Never guess.

### Dish detail (GET /v1/dishes/<slug>/)

```json
{
  "slug": "githeri",
  "name_en": "Githeri",
  "name_sw": "Githeri",
  "description": "...",
  "cuisine_tags": [...],
  "diet_tags": ["vegetarian", "gluten-free"],
  "meal_type": "lunch",
  "course": "main",
  "region_slug": "central",
  "cost_estimate_kes": 150,
  "nutrition": { "calories": 320, "protein_g": 12, ... },
  "required_ingredients": [...],
  "optional_ingredients": [...],
  "steps": [...],
  "allergen_disclaimer": true
}
```

### Pantry item

```json
{
  "id": "uuid",
  "ingredient_id": "engine-uuid",
  "ingredient_slug": "tomato",
  "display_name": "Tomato",
  "added_at": "2026-11-01T..."
}
```

### Saved recipe

```json
{
  "id": "uuid",
  "dish_id": "engine-uuid",
  "dish_slug": "kenyan-chicken-curry",
  "note": "Try with less chili",
  "saved_at": "2026-11-01T..."
}
```

### Subscription status

```json
{
  "plan_code": "free",
  "status": "active",
  "trial_ends_at": null,
  "renews_at": null
}
```

For Plus users:
```json
{
  "plan_code": "plus",
  "status": "active",
  "trial_ends_at": "2026-11-15T...",
  "renews_at": "2026-12-01T..."
}
```

## Search tiers (frontend display guidance)

| Tier | Meaning | Display as |
|---|---|---|
| `exact` | All required ingredients in pantry | "Cook now" |
| `can_make` | All required + staples assumed | "Cook now (needs staples)" |
| `almost` | 1-2 missing (explore mode only) | "Almost there — missing X" |

## Engine status

The backend may return `engine_status: "degraded"` when the engine is down. In this case:
- Results are from cache (may be stale)
- Show a notice: "Showing cached results — our recipe brain is temporarily unavailable"
- Keep cached results visible, don't error out

## Rate limiting

The backend rate-limits per user + per IP. On 429:
- Backend returns `Retry-After` header
- Show user: "Too many requests. Try again in X seconds."

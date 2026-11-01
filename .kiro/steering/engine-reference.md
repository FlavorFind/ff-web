# Engine Reference — For Frontend Developers

The frontend never calls the engine directly. This file explains what the engine does so you understand the data flow.

## What the engine is

The Recipe Engine (`ff-engine`) is the food data brain. It owns all food data:
- 300 Kenyan and East African dishes
- 878 ingredients with 1,498 aliases (Swahili, Sheng, local names)
- 63 regions (47 Kenyan counties + neighbouring countries)
- 153 pairings, 205 substitutions, 33 nutrition facts
- 8 dietary tags, 1,721 dish-tag mappings

## What the engine does NOT know

- User IDs, emails, or device data
- Pantry contents (the backend sends ingredient names, not user info)
- Subscription status
- Saved recipes or cook history
- Payment data

The backend is the only thing that talks to the engine. The frontend talks to the backend.

## How data flows to the frontend

```
User types "tomato, onion, unga" in the search
  ↓
Frontend calls POST /v1/search/ on the consumer backend
  ↓
Consumer backend calls POST /v1/ingredients/resolve on the engine
  ↓ Engine resolves: tomato→matched, onion→matched, unga→ambiguous
  ↓
Consumer backend: if ambiguous, returns choices to frontend (don't search)
  ↓
Frontend shows choice picker for "unga" → user picks "Maize flour"
  ↓
Frontend calls POST /v1/search/ again with resolved ingredients
  ↓
Consumer backend: merges pantry items + injects diet tags → calls engine search
  ↓ Engine returns dishes in tiers (exact, can_make, almost)
  ↓
Consumer backend: adds personalisation, allergen disclaimer → returns to frontend
  ↓
Frontend displays results with tier badges and "Cook now" CTAs
```

## Dataset version

The engine has a dataset version (currently `2026.10.0`) that changes when food data is updated.

The consumer backend:
1. Fetches it from the engine on startup
2. Caches it in Redis for 1 hour
3. Uses it in cache keys for all engine responses
4. Returns it in every search response as `dataset_version`

The frontend doesn't need to manage this — it comes through in the API responses.

## Ingredient resolve — the ambiguity flow

This is the most important interaction to get right:

1. User types free-text ingredient names (e.g., "unga", "nyanya", "sukuma wiki")
2. Frontend calls `POST /v1/resolve/` with those tokens
3. Backend calls engine resolve, returns per-token status:
   - `matched` — understood, has ingredient_id
   - `ambiguous` — could mean multiple things, needs user choice
   - `unmatched` — not found
4. If any token is `ambiguous`, frontend shows a choice picker
5. User picks the right ingredient
6. Frontend proceeds to search with resolved ingredient IDs/names

**Rule: never pass an ambiguous token to search. Always resolve first.**

## Search modes

- **Strict** — only returns dishes where all required ingredients are present (exact + can_make tiers)
- **Explore** — also returns dishes that are 1-2 ingredients away (adds "almost" tier)

The frontend should offer a Strict | Explore toggle on the Cook page.

## Dish detail data

The engine provides per dish:
- Name (English + Swahili)
- Description
- Required ingredients (with quantities)
- Optional ingredients
- Cooking steps
- Cuisine tags, diet tags, meal type, course
- Region slug
- Cost estimate (KES, labelled as estimate)
- Nutrition (calories, protein, etc. — labelled as estimates)
- Pairings (suggested side dishes, drinks, desserts)
- Substitutions (with quality grades: Great, OK, Emergency)
- Quality level (verified, reviewed)

All of this comes through the consumer backend's `GET /v1/dishes/<slug>/` endpoint.

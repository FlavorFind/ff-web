# Flavor Find — Project Overview

## What Flavor Find is

Flavor Find is a Kenyan food-discovery platform. Users enter the ingredients they have, and the app shows them what Kenyan dishes they can cook — strictly matched against what's actually required, never guessing.

**Tagline:** Find the flavor. Fill the table.

## Organisation and repos

- **GitHub org:** `FlavorFind`
- **Engine repo:** `FlavorFind/ff-engine` — the food data brain (v1.0.0, live on staging)
- **Consumer backend:** `FlavorFind/ff-consumer` — Django/DRF API (v1.0.0, go-live signed off, live on staging)
- **Consumer website:** `FlavorFind/ff-web` — this repo (the frontend)
- **Console:** lives inside ff-engine repo (internal test UI)

## The three-system architecture

```
ff-web (frontend)  ──►  ff-consumer (backend)  ──►  ff-engine (food data)
     JWT auth                API key auth
     /v1/* endpoints         engine never sees user IDs or emails
```

**The frontend:**
- Calls the consumer backend API only
- Never calls the engine directly
- Never sends user data to the engine (the backend strips it)

**The consumer backend:**
- Owns everything about people (accounts, pantries, meal plans, saved recipes, subscriptions, billing)
- Owns no food data — all food comes from the engine via API
- Calls the engine with two API keys (public key for search/catalog, internal key for community submissions)

**The engine:**
- Owns all food data (300 dishes, 878 ingredients, 63 regions, pairings, substitutions, nutrition)
- Knows nothing about people — no user IDs, emails, or device data
- Returns search results in tiers: exact, can_make, almost

## Engine staging URLs

```
Engine API:     https://engine.flavorfind.co.ke/v1/
Engine docs:    https://engine.flavorfind.co.ke/docs/
Consumer API:   https://consumer.flavorfind.co.ke/v1/
```

## Current state (as of 2026-11-01)

- **Engine:** v1.0.0, dataset 2026.10.0, 300 dishes, 878 ingredients, 63 regions, all live
- **Consumer backend:** v1.0.0, 47 API endpoints, 351 tests, go-live checklist signed, live on staging
- **Website:** just starting — repo created, design spec ready (Figma Prompt Pack), no code yet

## Stack (to be decided for the frontend)

The backend stack (for reference):
- Python 3.12, Django 5.2, DRF 3.18
- PostgreSQL 16, Redis 7, Celery 5.4
- Staging on Render (Frankfurt) + self-hosted ThinkPad via Tailscale
- JWT auth (simplejwt), Argon2id passwords, M-Pesa/Paystack payments

## Staging server

```
Host:     100.96.139.83 (Tailscale IP)
User:     mayday
SSH:      ssh -o StrictHostKeyChecking=no mayday@100.96.139.83
Engine:   /home/mayday/ff-engine
Consumer: /home/mayday/ff-consumer
```

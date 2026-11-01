# Start Here — ff-web

This is the **consumer website** repo for Flavor Find. It is a frontend that talks to the consumer backend API.

## What Flavor Find is

Flavor Find is a Kenyan food-discovery platform. Users tell the app what ingredients they have in their kitchen, and it shows them what Kenyan dishes they can cook — strictly matched, no guessing.

Three repos in the `FlavorFind` GitHub org:

```
ff-engine    — Recipe Engine (food data brain, already live)
ff-consumer  — Consumer Backend API (Django/DRF, already live, v1.0.0 signed off)
ff-web       — Consumer Website (this repo — what we're building now)
```

## The data flow

```
ff-web (frontend)  ──HTTP──►  ff-consumer (backend API)  ──HTTP──►  ff-engine (food data)
                       JWT auth                          API key auth
                       /v1/* endpoints                   engine never sees users
```

- The frontend calls the consumer backend API (`https://consumer.flavorfind.co.ke/v1/`)
- The consumer backend calls the engine for all food data
- The frontend NEVER calls the engine directly
- The frontend NEVER sends user data to the engine (the backend handles that)

## What's already done

- **Engine:** v1.0.0, 300 dishes, 878 ingredients, 63 regions, all live on staging
- **Consumer backend:** v1.0.0, 47 API endpoints, go-live checklist signed, live on staging
- **This repo:** just created — we're starting the website build

## What we're building

A PWA (Progressive Web App) website using the design system in the Figma Prompt Pack PDF at the repo root. The website covers:

- Home (hero search, live results, taste of 47 counties, pairings, Plus teaser)
- Cook (the core search page — ingredient builder + results)
- Dish detail (ingredients, steps, cook mode, pairings, substitutions, nutrition)
- Taste of 47 Counties (interactive map, county stories)
- Pantry (ingredient management)
- Saved recipes, collections, cook history
- Meal planner (Plus gated)
- Shopping list (Plus gated)
- Budget mode (Plus gated)
- Plus subscription page + M-Pesa checkout
- Auth (sign in, sign up, phone OTP, verify)
- Account (profile, diet, devices, subscription, privacy)
- Community (recipe submission wizard)
- Static pages (about, help, legal, 404/500/offline)

## Key files in this repo

```
.kiro/steering/          — Context files (auto-included in every session)
  start-here.md          — You are here
  project-overview.md    — Full project context
  architecture.md        — How the three systems connect
  api-reference.md       — Consumer backend API endpoints (what the frontend calls)
  engine-reference.md    — What the engine provides (data flow understanding)
  decisions.md           — Key product and tech decisions

docs/
  openapi.yaml           — Full OpenAPI schema for the consumer backend API (68KB, 47 endpoints)
  project-summary.md     — Comprehensive summary of both backend and engine state
  design-system.md       — Extracted design tokens and component specs from the Figma pack

Flavor Find Website Figma Prompt Pack.pdf — Full design specification (21 pages, 18 page prompts)
```

## Backend API base URL

```
Production/Staging:  https://consumer.flavorfind.co.ke/v1/
Health check:        GET /v1/health/
API schema:          GET /v1/schema/
```

## Auth model

- End users authenticate with JWT (short-lived access token + rotating refresh)
- Login methods: email+password OR phone OTP
- Some endpoints are public (health, regions, stories, dish detail, search)
- Personal endpoints require `Authorization: Bearer <access_token>`

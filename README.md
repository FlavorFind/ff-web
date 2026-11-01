# ff-web — Flavor Find Consumer Website

The consumer-facing website and PWA for Flavor Find — a Kenyan food-discovery platform.

**Tagline:** Find the flavor. Fill the table.

## What this is

This is the frontend that users interact with. It calls the consumer backend API (`ff-consumer`) for all data. The backend in turn calls the recipe engine (`ff-engine`) for food data.

```
ff-web (this repo)  ──►  ff-consumer (backend API)  ──►  ff-engine (food data)
```

## Project context

Full project context is in `.kiro/steering/` — these files auto-include in every Kiro session:
- `start-here.md` — orientation
- `project-overview.md` — what Flavor Find is, repos, current state
- `architecture.md` — how the three systems connect, API endpoints, safety rules
- `api-reference.md` — consumer backend API quick reference
- `engine-reference.md` — what the engine provides (data flow)
- `decisions.md` — key product and tech decisions

## Key docs

- `docs/openapi.yaml` — full OpenAPI schema for the consumer backend (47 endpoints)
- `docs/project-summary.md` — comprehensive summary of both backend and engine
- `docs/design-system.md` — extracted design tokens and component specs
- `Flavor Find Website Figma Prompt Pack.pdf` — full 21-page design specification

## Backend API

```
Base URL:  https://consumer.flavorfind.co.ke/v1/
Health:    GET /v1/health/
Schema:    GET /v1/schema/
```

Auth: JWT bearer token (15 min access, 30 day rotating refresh).

## Status

Backend and engine are both v1.0.0 and live on staging. This repo is the new website build.

# Key Decisions

## Product decisions (locked)

- **Login methods:** email + password AND phone OTP (both at launch)
- **Public access:** search, dish pages, regions, stories accessible without login; personalisation requires auth
- **Free tier:** search is free and unlimited; Plus gates meal plans, nutrition, offline sync, budget mode, unlimited saves
- **Plus price:** KES 199/month
- **Payment method:** M-Pesa Daraja STK push (Paystack as alternative)
- **Shopping list prices:** engine cost estimates only (no external price source for v1)
- **Search is always free** — no paywall on the core product
- **Ads:** shown to free users, not to Plus users

## Architecture constraints (non-negotiable)

1. The frontend NEVER calls the engine directly — only the consumer backend
2. The frontend NEVER sends user data that would reach the engine
3. Diet/allergen exclusions are always applied (backend handles this from user profile)
4. Ambiguous ingredients must be resolved by the user, never guessed
5. Allergen disclaimer text on every response with dietary info: "Allergen information is for guidance only. Always confirm with the kitchen before ordering."
6. Estimates (nutrition, cost) must always be labelled as estimates
7. No food tables in the consumer database — food lives in the engine

## Design system (from Figma Prompt Pack)

- **Palette:** Forest green #25423A (primary), Gold #D1AE5F (accent), Cream #F7F2E7 (background), Mist #E8EEE9 (cards), Ink #1C2B26 (text), Sage #6B7A72 (secondary text), Chili #B9472F (warnings)
- **Type:** Fraunces for display/headings, Inter for body/interface
- **Style:** modern, clean, premium, warm. Generous white space, large type, soft rounded corners (16/24px), thin 1px borders, soft green-tinted shadows
- **Frames:** Desktop 1440, Tablet 834, Mobile 390
- **Grid:** 12 column desktop (1200 max content), 4 column mobile (20px margins)
- **Swahili:** appears as a quiet secondary label on food names
- **Placeholder images:** Forest green duotone with gold line illustrations (until real food photos exist)
- **Logo:** gold chef hat with magnifying glass — use exactly as supplied, never redraw

## Backend stack (for reference — the frontend doesn't need to match this)

- Python 3.12, Django 5.2, DRF 3.18
- PostgreSQL 16, Redis 7, Celery 5.4
- JWT (simplejwt), Argon2id passwords
- Staging: Render (Frankfurt) + self-hosted ThinkPad via Tailscale
- CI/CD: GitHub Actions (lint, SAST, tests, migration check, schema validation)

## Open decisions (for the frontend team)

- Frontend framework (React/Next.js, Vue/Nuxt, Svelte/SvelteKit, etc.)
- State management approach
- PWA strategy (service worker, offline cache strategy)
- Image handling (placeholder system until real food photos are sourced)
- API client generation (from OpenAPI schema — TypeScript client?)
- Hosting (Vercel, Netlify, Render, Cloudflare Pages?)

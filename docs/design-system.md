# Flavor Find Design System — Quick Reference

Extracted from the Figma Prompt Pack. Full spec is in `Flavor Find Website Figma Prompt Pack.pdf`.

## Palette

| Token | Hex | Usage |
|---|---|---|
| Forest green | `#25423A` | Primary (buttons, dark surfaces) |
| Deep green | `#1B3029` | Dark surfaces, inverse backgrounds |
| Gold | `#D1AE5F` | Accent — only on dark green or as fine detail |
| Cream | `#F7F2E7` | Page background |
| Mist | `#E8EEE9` | Cards, rows, muted surfaces |
| Ink | `#1C2B26` | Primary text |
| Sage | `#6B7A72` | Secondary text |
| Chili | `#B9472F` | Warnings, "Almost" tier — used sparingly |

Tints: Gold 100 `#F1E4BF`, Chili 100 `#F4DCD3`, Green 100 `#DDE7E1`

**Rules:** Gold never appears as small text on cream. One accent at a time.

## Typography

| Style | Font | Size/Line | Usage |
|---|---|---|---|
| Display XL | Fraunces Semibold | 72/76 | Hero headlines (mobile ~25% smaller) |
| Display L | Fraunces Semibold | 56/60 | Story page titles |
| H1 | Fraunces Semibold | 44/48 | Page titles |
| H2 | Fraunces Semibold | 32/38 | Section headers |
| H3 | Fraunces Semibold | 24/30 | Card titles |
| Body L | Inter | 18/28 | Article body |
| Body | Inter | 16/24 | Default text |
| Small | Inter | 14/20 | Secondary text |
| Caption | Inter | 12/16 | Fine print |
| Label | Inter | 13/16 uppercase +4% tracking | UI labels |
| Number | Inter tabular | — | Prices, counts |

## Spacing

4, 8, 12, 16, 24, 32, 48, 64, 96, 128 (8px base system)

## Radius

8, 12, 16, 24, 999 (pill)

## Shadows

All soft and green-tinted. Sizes: sm, md, lg.

## Grid

- Desktop: 12 column, 1200px max content width
- Tablet: 8 column
- Mobile: 4 column, 20px margins

## Key components

- **Buttons:** Primary (Forest), Primary on dark (Gold), Secondary (outline), Ghost, Icon button — sizes L, M, S
- **Ingredient chip:** understood (solid), spelling corrected (small note), ambiguous (pulsing ring), removable, locked diet chip
- **Ingredient input:** large pill with autocomplete dropdown (English + Swahili names)
- **Tier badges:** Exact (Forest), Can make (Gold tint), Almost (Chili tint)
- **Dish card:** image slot 4:5, heart button, name + Swahili name, tier badge, region tag — grid, horizontal, compact variants
- **County tile:** with/without story, gold dot for told stories
- **Story card:** tall format
- **Pairing card:** strength dots (1-5), type label (Side, Drink, Dessert)
- **Substitution row:** grade badges (Great, OK, Emergency with warning)
- **Plus paywall sheet:** preview visible, one calm sheet with benefit + price + button

## Motion

- Durations: 120ms, 240ms, 400ms
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Chip pop in: scale 0.9 → 1
- Cards: rise 16px + fade, 60ms stagger
- Hero parallax: up to 24px
- Page transitions: soft fade
- Reduced motion alternative for each

## Logo

Gold chef hat with magnifying glass. Use exactly as supplied — never redraw, recolor, stretch, or add effects.
- On deep green: gold logo
- On cream: logo on a deep green rounded square

## Placeholder images (until real food photos exist)

Forest green duotone with fine gold line illustrations of ingredients (pot, spoon, chili, leaf, grain, fish).

## Swahili

Appears as a quiet secondary label on food names. Swahili strings run ~20% longer — leave room.

## Allergen disclaimer (must appear wherever dietary info shows)

> "Allergen information is for guidance only. Always confirm with the kitchen before ordering."

## Estimate labels

Nutrition and cost data are always estimates. Display "Estimate" chips where relevant.

## Pages to build (18 total)

| # | Page | Auth? |
|---|---|---|
| 00 | Design system | — |
| 01 | Home | No |
| 02 | Cook (search) | Optional |
| 03 | Dish detail | No |
| 04 | Taste of 47 Counties | No |
| 05 | Story page | No |
| 06 | Pantry | Yes |
| 07 | Saved, Collections, Cooked | Yes |
| 08 | Meal planner | Plus |
| 09 | Shopping list | Plus |
| 10 | Budget mode | Plus |
| 11 | Plus page | No |
| 12 | Checkout (M-Pesa) | Yes |
| 13 | Sign in, Sign up, Verify | No |
| 14 | Account | Yes |
| 15 | Community (submit recipe) | Yes |
| 16 | About, Help, Legal | No |
| 17 | System pages (404, 500, offline, maintenance) | — |
| 18 | Prototype flows | — |

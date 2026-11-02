/*
  Static content for the homepage.

  All food data (dishes, search results, regions, stories) comes from the
  live consumer backend API — see lib/api.ts.

  This file holds only:
  - UI copy translations (EN / SW)
  - Marquee ingredient pairs (EN name + SW name) — curated from the live dataset
  - Quick-add chips for the hero — real ingredient names the engine understands
  - County data for the scroll-parallax section — real from GET /v1/regions/
  - Pairing examples — curated from the live dataset
  - Plus features copy
*/

// ── Translations ───────────────────────────────────────────────────────────────

export type Lang = "en" | "sw";

export const TX = {
  en: {
    // Nav
    n1: "Cook", n2: "Counties", n3: "Plus", go: "Get started",
    // Hero
    h1: "What's in your kitchen tonight?",
    sub: "Tell us what you have. We'll show you what Kenya cooks with it.",
    ph: "Try: nyanya, vitunguu, sukuma wiki…",
    add: "Search",
    try: "Quick add:",
    // Hero states
    searching: "Searching…",
    noResults: "Nothing found for that mix. Try fewer ingredients, or switch to Explore.",
    engineDown: "Showing cached results — our recipe brain is temporarily unavailable.",
    disambig: "did you mean:",
    unknown: "We don't recognise \"{term}\". Try the full name in English or Swahili.",
    // Search mode
    strict: "Strict",
    explore: "Explore",
    // Tier labels
    tierExact: "Exact",
    tierCan: "Can make",
    tierAlmost: "Almost",
    // Legend
    legendExact: "Exact",
    legendCan: "Can make",
    legendAlmost: "Almost",
    // Dish card
    viewRecipe: "View recipe →",
    needsAlso: "Needs:",
    // Story section
    storyNote: "",
    // Marquee aria
    marqueeAria: "Ingredients in English and Swahili",
    // Footer
    legal: "Find the flavor. Fill the table. Nutrition and cost figures are estimates. Always confirm allergens with the cook or the label.",
  },
  sw: {
    n1: "Pika", n2: "Kaunti", n3: "Plus", go: "Anza",
    h1: "Una nini jikoni usiku huu?",
    sub: "Tuambie ulicho nacho. Tutakuonyesha Kenya inapika nini nacho.",
    ph: "Jaribu: nyanya, vitunguu, sukuma wiki…",
    add: "Tafuta",
    try: "Ongeza haraka:",
    searching: "Inatafuta…",
    noResults: "Hakuna kilichopatikana kwa mchanganyiko huo. Jaribu viungo vichache, au ubadilishe hadi Gundua.",
    engineDown: "Inaonyesha matokeo yaliyohifadhiwa — ubongo wetu wa mapishi haupati wakati huu.",
    disambig: "unamaanisha:",
    unknown: "Hatujui \"{term}\". Jaribu jina kamili kwa Kiingereza au Kiswahili.",
    strict: "Hasa",
    explore: "Gundua",
    tierExact: "Kamili",
    tierCan: "Inawezekana",
    tierAlmost: "Karibu",
    legendExact: "Kamili",
    legendCan: "Inawezekana",
    legendAlmost: "Karibu",
    viewRecipe: "Tazama mapishi →",
    needsAlso: "Inahitaji:",
    storyNote: "",
    marqueeAria: "Viungo kwa Kiingereza na Kiswahili",
    legal: "Pata ladha. Jaza meza. Takwimu za lishe na gharama ni makadirio. Daima thibitisha vizio na mpishi au lebo.",
  },
} as const;

export type TxKey = keyof (typeof TX)["en"];

// MARQUEE removed — now fetched live from GET /v1/ingredients/ in components/marquee.tsx

// ── Quick-add chips — real ingredient names the engine resolves ────────────────

export const QUICK_ADD: Array<{ en: string; sw: string }> = [
  { en: "Tomato", sw: "Nyanya" },
  { en: "Onion", sw: "Kitunguu" },
  { en: "Sukuma wiki", sw: "Sukuma wiki" },
  { en: "Maize flour", sw: "Unga wa mahindi" },
  { en: "Beans", sw: "Maharagwe" },
  { en: "Eggs", sw: "Mayai" },
  { en: "Rice", sw: "Wali" },
  { en: "Coconut milk", sw: "Nazi" },
];

// ── County/region cards — shown in the horizontal parallax section ─────────────
// Loaded live from GET /v1/regions/ but these are fallbacks / initial colors.

export const COUNTY_COLORS: Record<string, string> = {
  "kenyan-coast": "#1a3d4f",
  "nairobi": "#2f4a3a",
  "central": "#3a4a2a",
  "nyanza": "#1f4a5a",
  "rift-valley": "#4a3a1a",
  "western": "#3a2a3a",
  "north-eastern": "#4a3a2a",
  "eastern": "#2a3a2a",
};

export const DEFAULT_COUNTY_COLOR = "#25423A";

// ── Pairing examples — curated from the live dish data ────────────────────────

// ── Plus features ──────────────────────────────────────────────────────────────

export const PLUS_FEATURES = [
  "Weekly meal plans and auto shopping lists",
  "Budget mode — what can I cook with KES 300?",
  "Nutrition details on every dish",
  "Offline access — cook without data",
  "No ads, ever",
];

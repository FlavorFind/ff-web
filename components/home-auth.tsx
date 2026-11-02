"use client";

/**
 * HomeAuth — personalised homepage for logged-in users.
 *
 * Sections:
 *  1. Greeting header — name, time-of-day, subscription badge
 *  2. Cook from pantry — their actual pantry ingredients, instant search CTA
 *  3. Today's suggestion — one random dish from their pantry ingredients
 *  4. Saved recipes — last 4 saved, link to all
 *  5. Quick actions — Pantry, Planner, Budget, Community
 *  6. Plus upsell (free users only)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getPantry,
  getSaved,
  searchDishes,
  getSubscription,
  type PantryItem,
  type SavedRecipe,
  type SearchDish,
  type Subscription,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${name}.`;
}

function DishPlaceholder() {
  return (
    <svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="280" height="180" fill="#1B3029" />
      <path d="M70 105 Q140 135 210 105" stroke="#D1AE5F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".6" />
      <ellipse cx="140" cy="103" rx="70" ry="9" stroke="#D1AE5F" strokeWidth="1.8" fill="none" opacity=".4" />
      <path d="M116 92 Q113 76 116 62" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
      <path d="M140 88 Q137 72 140 58" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
      <path d="M164 92 Q161 76 164 62" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
    </svg>
  );
}

// ── Pantry quick-cook strip ────────────────────────────────────────────────────

function PantryStrip({ items }: { items: PantryItem[] }) {
  const shown = items.slice(0, 8);
  const extra = items.length - shown.length;
  const cookUrl = `/cook?pantry=1`;

  return (
    <div className="ha-pantry-strip">
      <div className="ha-pantry-tokens">
        {shown.map((item) => (
          <span key={item.id} className="ha-ptok">{item.display_name}</span>
        ))}
        {extra > 0 && <span className="ha-ptok ha-ptok-more">+{extra} more</span>}
      </div>
      <Link href={cookUrl} className="btn ha-cook-btn">
        Cook from pantry →
      </Link>
    </div>
  );
}

// ── Today's suggestion ────────────────────────────────────────────────────────

function TodaySuggestion({ dish }: { dish: SearchDish }) {
  return (
    <Link href={`/dishes/${dish.slug}`} className="ha-suggestion">
      <div className="ha-sug-img">
        <DishPlaceholder />
      </div>
      <div className="ha-sug-body">
        <span className="ha-sug-label">Cook tonight</span>
        <h3 className="ha-sug-name">{dish.name_en}</h3>
        {dish.name_sw && dish.name_sw !== dish.name_en && (
          <p className="ha-sug-sw">{dish.name_sw}</p>
        )}
        <span className={cn(
          "ha-sug-tier",
          dish.tier === "exact" && "ha-tier-exact",
          dish.tier === "can_make" && "ha-tier-can",
        )}>
          {dish.tier === "exact" ? "Exact match" : "Can make"}
        </span>
        {dish.matched.length > 0 && (
          <p className="ha-sug-matched">
            Uses: {dish.matched.slice(0, 3).map((m) => m.name_en).join(", ")}
            {dish.matched.length > 3 && ` +${dish.matched.length - 3}`}
          </p>
        )}
      </div>
      <div className="ha-sug-arrow">→</div>
    </Link>
  );
}

// ── Saved recipe card ─────────────────────────────────────────────────────────

function SavedCard({ saved }: { saved: SavedRecipe }) {
  return (
    <Link href={`/dishes/${saved.dish_slug}`} className="ha-saved-card">
      <div className="ha-saved-img">
        <DishPlaceholder />
      </div>
      <div className="ha-saved-body">
        <p className="ha-saved-name">{saved.dish_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</p>
        {saved.note && <p className="ha-saved-note">{saved.note}</p>}
      </div>
    </Link>
  );
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const ACTIONS = [
  { href: "/pantry",   icon: "🥦", label: "Pantry",    desc: "Manage your ingredients" },
  { href: "/saved",    icon: "♥",  label: "Saved",     desc: "Your saved recipes" },
  { href: "/cook",     icon: "🔍", label: "Search",    desc: "Cook from any ingredients" },
  { href: "/regions",  icon: "📍", label: "47 Counties", desc: "Explore by region" },
];

const PLUS_ACTIONS = [
  { href: "/planner",       icon: "📅", label: "Meal Planner",  desc: "Plan your week" },
  { href: "/shopping-list", icon: "🛒", label: "Shopping List", desc: "Auto-generated lists" },
  { href: "/budget",        icon: "💰", label: "Budget Mode",   desc: "Cook within KES budget" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function HomeAuth() {
  const { user } = useAuth();

  const [pantry,       setPantry]       = useState<PantryItem[]>([]);
  const [saved,        setSaved]        = useState<SavedRecipe[]>([]);
  const [suggestion,   setSuggestion]   = useState<SearchDish | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [pantryData, savedData, subData] = await Promise.allSettled([
          getPantry(),
          getSaved(),
          getSubscription(),
        ]);

        if (cancelled) return;

        const pantryItems = pantryData.status === "fulfilled" ? pantryData.value : [];
        const savedItems  = savedData.status  === "fulfilled" ? savedData.value  : [];
        const sub         = subData.status    === "fulfilled" ? subData.value    : null;

        setPantry(pantryItems);
        setSaved(savedItems);
        setSubscription(sub);

        // Fetch a dish suggestion from pantry ingredients
        if (pantryItems.length >= 2) {
          const names = pantryItems.slice(0, 6).map((p) => p.display_name);
          try {
            const res = await searchDishes(names, "explore", 10);
            if (cancelled) return;
            const all: SearchDish[] = [
              ...(res.results.exact    ?? []),
              ...(res.results.can_make ?? []),
            ];
            if (all.length > 0) {
              // Pick one pseudo-randomly based on today's date so it changes daily
              const idx = new Date().getDate() % all.length;
              setSuggestion(all[idx]);
            }
          } catch { /* no suggestion — that's fine */ }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const isPlus    = subscription?.plan_code === "plus";
  const firstName = user?.username ?? user?.email?.split("@")[0] ?? "there";
  const recentSaved = saved.slice(0, 4);

  return (
    <div className="ha-page">

      {/* ── 1. Greeting ─────────────────────────────────────────────────────── */}
      <section className="ha-hero">
        <div className="wrap">
          <div className="ha-hero-inner">
            <div className="ha-hero-text">
              <h1 className="ha-greeting">{greeting(firstName)}</h1>
              <p className="ha-sub">
                {pantry.length > 0
                  ? `You have ${pantry.length} ingredient${pantry.length !== 1 ? "s" : ""} in your pantry. What are you cooking?`
                  : "Add ingredients to your pantry and we'll show you what you can cook right now."}
              </p>
              {isPlus && (
                <span className="ha-plus-badge">✦ Flavor Find Plus</span>
              )}
            </div>
            <div className="ha-hero-actions">
              <Link href="/cook" className="btn ha-btn-cook">Search dishes</Link>
              <Link href="/pantry" className="btn out ha-btn-pantry">Manage pantry</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap ha-body">

        {/* ── 2. Cook from pantry ─────────────────────────────────────────────── */}
        {!loading && pantry.length > 0 && (
          <section className="ha-section">
            <div className="ha-section-head">
              <h2 className="ha-section-title">Your pantry</h2>
              <Link href="/pantry" className="ha-see-all">Manage →</Link>
            </div>
            <PantryStrip items={pantry} />
          </section>
        )}

        {/* Empty pantry prompt */}
        {!loading && pantry.length === 0 && (
          <section className="ha-section ha-empty-pantry">
            <div className="ha-empty-inner">
              <span className="ha-empty-icon">🥦</span>
              <div>
                <h2 className="ha-section-title">Your pantry is empty</h2>
                <p className="ha-empty-desc">Add the ingredients you have and we'll show you exactly what you can cook.</p>
              </div>
              <Link href="/pantry" className="btn">Add ingredients →</Link>
            </div>
          </section>
        )}

        {/* ── 3. Today's suggestion ───────────────────────────────────────────── */}
        {!loading && suggestion && (
          <section className="ha-section">
            <div className="ha-section-head">
              <h2 className="ha-section-title">Cook tonight</h2>
              <span className="ha-section-sub">From your pantry</span>
            </div>
            <TodaySuggestion dish={suggestion} />
          </section>
        )}

        {/* ── 4. Saved recipes ────────────────────────────────────────────────── */}
        {!loading && recentSaved.length > 0 && (
          <section className="ha-section">
            <div className="ha-section-head">
              <h2 className="ha-section-title">Saved recipes</h2>
              <Link href="/saved" className="ha-see-all">See all ({saved.length}) →</Link>
            </div>
            <div className="ha-saved-grid">
              {recentSaved.map((s) => (
                <SavedCard key={s.id} saved={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Quick actions ────────────────────────────────────────────────── */}
        <section className="ha-section">
          <h2 className="ha-section-title">Quick actions</h2>
          <div className="ha-actions-grid">
            {ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="ha-action-card">
                <span className="ha-action-icon">{a.icon}</span>
                <span className="ha-action-label">{a.label}</span>
                <span className="ha-action-desc">{a.desc}</span>
              </Link>
            ))}
            {isPlus && PLUS_ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="ha-action-card ha-action-plus">
                <span className="ha-action-icon">{a.icon}</span>
                <span className="ha-action-label">{a.label}</span>
                <span className="ha-action-desc">{a.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 6. Plus upsell (free users only) ────────────────────────────────── */}
        {!loading && !isPlus && (
          <section className="ha-plus-upsell">
            <div className="ha-plus-left">
              <span className="ha-plus-tag">Flavor Find Plus</span>
              <h2 className="ha-plus-title">Plan your whole week.</h2>
              <p className="ha-plus-desc">
                Meal planner, auto shopping lists, budget mode, nutrition details, and offline access.
                KES 199/month. M-Pesa accepted.
              </p>
              <Link href="/plus" className="btn">Upgrade to Plus</Link>
            </div>
            <div className="ha-plus-right" aria-hidden="true">
              <div className="ha-plus-feature">📅 Weekly meal plans</div>
              <div className="ha-plus-feature">🛒 Auto shopping lists</div>
              <div className="ha-plus-feature">💰 Budget mode</div>
              <div className="ha-plus-feature">📊 Nutrition details</div>
              <div className="ha-plus-feature">📶 Offline access</div>
              <div className="ha-plus-feature">🚫 No ads, ever</div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

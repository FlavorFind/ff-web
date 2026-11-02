"use client";

/**
 * LivePantry — "Your pantry is never the same twice"
 *
 * Decorative section that cycles through live ingredient combinations and the
 * dishes they unlock. Not interactive — screen readers see a static label.
 *
 * Architecture: a single mount-only useEffect owns the entire loop. All mutable
 * loop state lives in plain variables inside the closure (never in React state).
 * setItems / setDish are only called to push the current state to the render layer.
 * This avoids the stale-closure / re-trigger problem that came from having
 * [items] as an effect dependency.
 */

import { useEffect, useRef, useState } from "react";
import { searchDishes, type SearchDish } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Ingredient pool ────────────────────────────────────────────────────────────
const POOL = [
  "Tomato","Onion","Coriander","Chilli","Garlic","Ginger",
  "Spinach","Beef","Chicken","Rice","Maize flour","Potato",
  "Coconut milk","Lemon","Beans","Lentils","Peas","Fish",
  "Sukuma wiki","Pumpkin","Groundnuts","Sweet potato","Plantain",
  "Aubergine","Cabbage","Pilipili","Carrot","Kale","Ugali flour",
];

const PALETTE = [
  "#b9472f","#8a5a7a","#4c8a4f","#c9532f","#b98f55",
  "#5a7a8a","#7a8a4f","#4f8a7a","#8a6a4f","#6a4f8a",
];

function pickColor(name: string) {
  const code = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

function pick<T>(arr: T[], exclude: T[] = []): T {
  const pool = arr.filter((x) => !exclude.includes(x));
  return pool[Math.floor(Math.random() * pool.length)] ?? arr[0];
}

// Always 4 or 5 ingredients
function startSet(): string[] {
  const count = 4 + Math.round(Math.random()); // 4 or 5
  const r: string[] = [];
  for (let i = 0; i < count; i++) r.push(pick(POOL, r));
  return r;
}

// ── Token state ────────────────────────────────────────────────────────────────
type TState = "stable" | "removing" | "adding";

interface TokenItem {
  id: string;
  name: string;
  color: string;
  state: TState;
}

let _uid = 0;
function makeToken(name: string, state: TState = "stable"): TokenItem {
  return { id: `t${_uid++}`, name, color: pickColor(name), state };
}

// ── Dish result ────────────────────────────────────────────────────────────────
function DishResult({ dish, visible }: { dish: SearchDish | null; visible: boolean }) {
  if (!dish) return <div className="lp-dish lp-dish-empty" />;
  return (
    <div className={cn("lp-dish", visible && "lp-dish-vis")}>
      <span className="lp-arrow">→</span>
      <span className="lp-dish-name">{dish.name_en}</span>
      <span
        className={cn(
          "lp-tier",
          dish.tier === "exact" && "lp-tier-exact",
          dish.tier === "can_make" && "lp-tier-can",
        )}
      >
        {dish.tier === "exact" ? "Exact" : dish.tier === "can_make" ? "Can make" : "Almost"}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function LivePantry() {
  const [items, setItems] = useState<TokenItem[]>([]);
  const [dish, setDish] = useState<SearchDish | null>(null);
  const [dishVisible, setDishVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // All loop state lives here — never in React state — so setItems calls
    // don't retrigger this effect.
    const names = startSet(); // 4 or 5 names, decided once on mount
    let cancelled = false;   // set to true on cleanup — stops the loop cleanly

    function sleep(ms: number) {
      return new Promise<void>((r) => setTimeout(r, ms));
    }

    async function doSearch(current: string[]) {
      if (cancelled) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setDishVisible(false);
      try {
        const res = await searchDishes(current, "explore", 4, ctrl.signal);
        if (cancelled) return;
        const all = [
          ...(res.results.exact ?? []),
          ...(res.results.can_make ?? []),
          ...(res.results.almost ?? []),
        ];
        setDish(all[0] ?? null);
        setTimeout(() => { if (!cancelled) setDishVisible(true); }, 120);
      } catch { /* aborted or network error — keep existing dish */ }
    }

    async function loop() {
      // Render initial set immediately (client-side, no SSR mismatch)
      setItems(names.map((n) => makeToken(n, "stable")));
      await sleep(600);
      await doSearch(names);

      while (!cancelled) {
        await sleep(2800);
        if (cancelled) break;

        // Pick which slot to swap
        const removeIdx = Math.floor(Math.random() * names.length);
        const removeName = names[removeIdx];

        // Mark that token as removing
        setItems((prev) =>
          prev.map((t) =>
            t.name === removeName ? { ...t, state: "removing" as TState } : t,
          ),
        );
        await sleep(600);
        if (cancelled) break;

        // Replace in our mutable names array
        const newName = pick(POOL, names);
        names[removeIdx] = newName;

        // Render full set with the new token animating in
        setItems(
          names.map((n, i) => makeToken(n, i === removeIdx ? "adding" : "stable")),
        );
        await sleep(400);
        if (cancelled) break;

        // Settle to stable
        setItems(names.map((n) => makeToken(n, "stable")));
        await sleep(200);
        if (cancelled) break;

        await doSearch([...names]);
      }
    }

    loop();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []); // mount-only — loop owns all mutable state

  return (
    <section className="lp-sec sec" aria-label="Live ingredient matching demo">
      <div className="wrap">
        <h2 className="h2">Your pantry is never the same twice</h2>
        <p className="lead">
          Swap one ingredient and you unlock a completely different set of dishes. The engine
          re-matches in real time — no search button needed.
        </p>

        <div className="lp-stage" aria-hidden="true">
          {/* Ingredient token row */}
          <div className="lp-tokens" role="presentation">
            {items.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "lp-token",
                  t.state === "removing" && "lp-token-out",
                  t.state === "adding" && "lp-token-in",
                )}
                style={{ "--tc": t.color } as React.CSSProperties}
              >
                <span className="lp-dot" />
                {t.name}
              </div>
            ))}
          </div>

          {/* Dish result */}
          <DishResult dish={dish} visible={dishVisible} />
        </div>

        <p className="cap">
          Updating live from the Flavor Find recipe engine — {new Date().getFullYear()}.
        </p>
      </div>
    </section>
  );
}

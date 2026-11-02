"use client";

/**
 * LivePantry — same logic as HeroStage.
 * Hardcoded sequences → guaranteed results, no random ambiguous tokens.
 */

import { useEffect, useRef, useState } from "react";
import { searchDishes, type SearchDish } from "@/lib/api";
import { cn } from "@/lib/utils";

const SEQUENCES: string[][] = [
  ["Tomato", "Onion", "Coriander", "Chilli"],
  ["Tomato", "Rice", "Onion", "Garlic"],
  ["Maize flour", "Sukuma wiki", "Onion", "Tomato"],
  ["Beef", "Onion", "Tomato", "Garlic"],
  ["Coconut milk", "Onion", "Tomato", "Rice"],
  ["Beans", "Onion", "Tomato", "Coriander"],
];

const ALTERNATES = [
  ["Garlic", "Ginger", "Spinach", "Beef", "Lemon", "Coconut milk"],
  ["Potatoes", "Coriander", "Lentils", "Beans", "Pumpkin", "Aubergine"],
  ["Fish", "Peas", "Groundnuts", "Sweet potato", "Kale", "Cabbage"],
];

const PALETTE = [
  "#b9472f","#8a5a7a","#4c8a4f","#c9532f","#b98f55",
  "#5a7a8a","#7a8a4f","#4f8a7a","#8a6a4f","#6a4f8a",
];

function pickColor(name: string, i: number) {
  const code = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
  return PALETTE[(code + i * 3) % PALETTE.length];
}

interface Token {
  id: string;
  name: string;
  color: string;
  state: "stable" | "out" | "in";
}

function makeTokens(names: string[], incoming = -1): Token[] {
  return names.map((name, i) => ({
    id: `${name}-${i}`,
    name,
    color: pickColor(name, i),
    state: (i === incoming ? "in" : "stable") as Token["state"],
  }));
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function LivePantry() {
  const [tokens,      setTokens]      = useState<Token[]>(() => makeTokens(SEQUENCES[0]));
  const [dish,        setDish]        = useState<SearchDish | null>(null);
  const [dishVisible, setDishVisible] = useState(false);
  const [searching,   setSearching]   = useState(false);

  const abortRef   = useRef<AbortController | null>(null);
  const seqRef     = useRef(0);
  const runningRef = useRef(false);

  async function runSearch(names: string[]) {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    setDishVisible(false);
    try {
      const res = await searchDishes(names, "explore", 6, ctrl.signal);
      const all: SearchDish[] = [
        ...(res.results.exact    ?? []),
        ...(res.results.can_make ?? []),
        ...(res.results.almost   ?? []),
      ];
      setDish(all[0] ?? null);
      setTimeout(() => setDishVisible(true), 80);
    } catch {
      // aborted or network — keep previous dish
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    async function loop() {
      while (true) {
        const seq   = SEQUENCES[seqRef.current % SEQUENCES.length];
        const names = [...seq];

        setTokens(makeTokens(names));
        await sleep(400);
        await runSearch(names);
        await sleep(2800);

        for (let swap = 0; swap < 3; swap++) {
          const removeIdx = 1 + (swap % (names.length - 1));

          setTokens((prev) =>
            prev.map((t, i) => i === removeIdx ? { ...t, state: "out" as const } : t),
          );
          await sleep(500);

          const altPool   = ALTERNATES[swap % ALTERNATES.length];
          const available = altPool.filter((a) => !names.includes(a));
          const newName   = available[swap % available.length] ?? altPool[0];
          names[removeIdx] = newName;

          setTokens(makeTokens(names, removeIdx));
          await sleep(300);
          setTokens(makeTokens(names));
          await sleep(200);

          setDishVisible(false);
          await sleep(150);
          await runSearch(names);
          await sleep(2600);
        }

        seqRef.current += 1;
      }
    }

    loop();
  }, []);

  return (
    <section className="lp-sec sec" aria-label="Live ingredient matching demo">
      <div className="wrap">
        <h2 className="h2">Your pantry is never the same twice</h2>
        <p className="lead">
          Swap one ingredient and you unlock a completely different set of dishes.
          The engine re-matches in real time — no search button needed.
        </p>

        <div className="lp-stage" aria-hidden="true">

          <div className="lp-tokens" role="presentation">
            {tokens.map((t) => (
              <span
                key={t.id}
                className={cn(
                  "lp-token",
                  t.state === "out" && "lp-token-out",
                  t.state === "in"  && "lp-token-in",
                )}
                style={{ "--tc": t.color } as React.CSSProperties}
              >
                <span className="lp-dot" />
                {t.name}
              </span>
            ))}
          </div>

          <div className={cn("lp-dish", dishVisible && "lp-dish-vis")}>
            {searching && <span className="lp-spinner" aria-hidden="true" />}
            {dish && (
              <>
                <span className="lp-arrow">→</span>
                <span className="lp-dish-name">{dish.name_en}</span>
                {dish.name_sw && dish.name_sw !== dish.name_en && (
                  <span className="lp-dish-sw">{dish.name_sw}</span>
                )}
                <span className={cn(
                  "lp-tier",
                  dish.tier === "exact"    && "lp-tier-exact",
                  dish.tier === "can_make" && "lp-tier-can",
                  dish.tier === "almost"   && "lp-tier-almost",
                )}>
                  {dish.tier === "exact" ? "Exact" : dish.tier === "can_make" ? "Can make" : "Almost"}
                </span>
              </>
            )}
          </div>

        </div>

        <p className="cap">
          Live from the Flavor Find recipe engine — {new Date().getFullYear()}.
        </p>
      </div>
    </section>
  );
}

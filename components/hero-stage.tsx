"use client";

/**
 * HeroStage — live ingredient game shown on the right side of the hero at ≥900px.
 *
 * Sequence (fully automatic, loops):
 *  1. Show a starting pantry of 4–5 tokens floating in the stage
 *  2. Run a search → dish name appears in the bowl
 *  3. After a pause, one token gets swapped out (fade out + new one fades in)
 *  4. Re-run search → different dish appears
 *  5. Repeat for N swaps then restart the whole sequence
 *
 * All data is live from the consumer backend API.
 * A pause/play button in the centre lets the user freeze the animation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { searchDishes, type SearchDish } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Token colour palette ───────────────────────────────────────────────────────
const PALETTE = [
  "#b9472f","#8a5a7a","#4c8a4f","#c9532f","#b98f55",
  "#5a7a8a","#7a8a4f","#4f8a7a","#8a6a4f","#6a4f8a",
];
function pickColor(name: string, i: number) {
  const code = name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0);
  return PALETTE[(code + i * 3) % PALETTE.length];
}

// ── Game sequences ─────────────────────────────────────────────────────────────
const SEQUENCES: string[][] = [
  ["Tomato", "Onion", "Coriander", "Chilli"],
  ["Tomato", "Rice", "Onion", "Garlic"],
  ["Maize flour", "Sukuma wiki", "Onion", "Tomato"],
  ["Plantain", "Onion", "Tomato", "Coconut milk"],
  ["Beef", "Onion", "Tomato", "Pilipili"],
];

// ── Token type ─────────────────────────────────────────────────────────────────
interface Token {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  state: "in" | "out" | "new";
}

const POS: Array<[number, number]> = [
  [-0.68, -0.52],
  [ 0.72, -0.58],
  [-0.64,  0.56],
  [ 0.70,  0.48],
  [ 0.02, -0.82],
];

function makeTokens(names: string[]): Token[] {
  return names.map((name, i) => ({
    id: `${name}-${i}`,
    name,
    color: pickColor(name, i),
    x: POS[i % POS.length][0],
    y: POS[i % POS.length][1],
    state: "in" as const,
  }));
}

// ── Bowl result display ────────────────────────────────────────────────────────
function Bowl({ dish, visible }: { dish: SearchDish | null; visible: boolean }) {
  return (
    <div
      className={cn("hs-bowl", visible && "hs-bowl-vis")}
      aria-live="polite"
      aria-atomic="true"
    >
      <svg viewBox="0 0 200 150" aria-hidden="true" className="hs-bowl-svg">
        <defs>
          <radialGradient id="hs-bowl-g" cx=".35" cy=".25" r=".9">
            <stop offset="0" stopColor="#4a7565" />
            <stop offset="1" stopColor="#1f372f" />
          </radialGradient>
        </defs>
        <g style={{ opacity: visible ? 1 : 0, transition: "opacity .4s" }}>
          <path d="M70 44c-8-10 8-14 0-28" fill="none" stroke="#D1AE5F" strokeWidth="2.5" strokeLinecap="round"
            style={{ strokeDasharray: 28, strokeDashoffset: visible ? 0 : 28, transition: "stroke-dashoffset .8s .3s" }} />
          <path d="M100 44c-8-10 8-14 0-28" fill="none" stroke="#D1AE5F" strokeWidth="2.5" strokeLinecap="round"
            style={{ strokeDasharray: 28, strokeDashoffset: visible ? 0 : 28, transition: "stroke-dashoffset .8s .5s" }} />
          <path d="M130 44c-8-10 8-14 0-28" fill="none" stroke="#D1AE5F" strokeWidth="2.5" strokeLinecap="round"
            style={{ strokeDasharray: 28, strokeDashoffset: visible ? 0 : 28, transition: "stroke-dashoffset .8s .4s" }} />
        </g>
        <path d="M12 62h176c0 48-40 84-88 84S12 110 12 62z"
          fill="url(#hs-bowl-g)" stroke="#D1AE5F" strokeWidth="3"
          style={{ opacity: visible ? 1 : 0, transition: "opacity .4s" }} />
      </svg>
      {dish && (
        <div className="hs-dish-label" style={{ opacity: visible ? 1 : 0, transition: "opacity .35s .2s" }}>
          <strong>{dish.name_en}</strong>
          <span className={cn("hs-tier",
            dish.tier === "exact" && "hs-tier-exact",
            dish.tier === "can_make" && "hs-tier-can",
            dish.tier === "almost" && "hs-tier-almost",
          )}>
            {dish.tier === "exact" ? "Exact match" : dish.tier === "can_make" ? "Can make" : "Almost"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function HeroStage() {
  const [tokens, setTokens] = useState<Token[]>(() => makeTokens(SEQUENCES[0]));
  const [dish, setDish] = useState<SearchDish | null>(null);
  const [bowlVisible, setBowlVisible] = useState(false);
  const [searching, setSearching] = useState(false);
  const [paused, setPaused] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);
  const runningRef = useRef(false);

  // Pause ref mirrors state so the loop closure can read it without re-subscribing
  const pausedRef = useRef(false);
  // Resolver called when the user resumes — wakes up any sleeping await
  const resumeRef = useRef<(() => void) | null>(null);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (!next && resumeRef.current) {
        // Resume immediately
        resumeRef.current();
        resumeRef.current = null;
      }
      return next;
    });
  }, []);

  async function runSearch(names: string[]) {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);
    setBowlVisible(false);
    try {
      const res = await searchDishes(names, "explore", 6, ctrl.signal);
      const all: SearchDish[] = [
        ...(res.results.exact ?? []),
        ...(res.results.can_make ?? []),
        ...(res.results.almost ?? []),
      ];
      setDish(all[0] ?? null);
      setTimeout(() => setBowlVisible(true), 80);
    } catch {
      // aborted or network error — keep previous dish
    } finally {
      setSearching(false);
    }
  }

  function sleep(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  // Sleep that also respects pause: waits full ms, then waits until unpaused
  async function sleepPauseable(ms: number) {
    await sleep(ms);
    if (pausedRef.current) {
      await new Promise<void>((resolve) => {
        resumeRef.current = resolve;
      });
    }
  }

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    async function loop() {
      while (true) {
        const seq = SEQUENCES[seqRef.current % SEQUENCES.length];
        const baseNames = [...seq];

        setTokens(makeTokens(baseNames));
        await sleep(400);
        await runSearch(baseNames);
        await sleepPauseable(2800);

        const alternates = [
          ["Garlic", "Ginger", "Spinach", "Beef", "Chicken", "Rice", "Lemon", "Coconut milk"],
          ["Potatoes", "Coriander", "Lentils", "Beans", "Pilipili", "Pumpkin", "Aubergine"],
          ["Ugali flour", "Fish", "Peas", "Groundnuts", "Sweet potato", "Plantain"],
        ];

        for (let swap = 0; swap < 3; swap++) {
          const removeIdx = 1 + (swap % (baseNames.length - 1));

          // Animate out
          setTokens((prev) =>
            prev.map((t, i) => i === removeIdx ? { ...t, state: "out" as const } : t)
          );
          await sleep(500);

          const altPool = alternates[swap % alternates.length];
          const available = altPool.filter((a) => !baseNames.includes(a));
          const newName = available[swap % available.length] ?? altPool[0];
          baseNames[removeIdx] = newName;

          setTokens(
            makeTokens(baseNames).map((t, i) => ({
              ...t,
              state: (i === removeIdx ? "new" : "in") as Token["state"],
            }))
          );
          await sleep(300);

          setTokens(makeTokens(baseNames));
          await sleep(200);

          setBowlVisible(false);
          await sleep(150);
          await runSearch(baseNames);
          await sleepPauseable(2600);
        }

        seqRef.current += 1;
      }
    }

    loop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = 400;

  return (
    <div className="hs-wrap" aria-label="Live ingredient matching demo" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="hs-svg" aria-hidden="true">
        <defs>
          <radialGradient id="hs-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="rgba(209,174,95,.18)" />
            <stop offset="1" stopColor="rgba(209,174,95,0)" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="180" fill="url(#hs-glow)" />
        <circle cx="200" cy="200" r="186" fill="none"
          stroke="rgba(247,242,231,.14)" strokeWidth="3" strokeDasharray="3 9" />

        {/* Ingredient tokens */}
        {tokens.map((t) => {
          const cx = 200 + (t.x * S) / 2;
          const cy = 200 + (t.y * S) / 2;
          return (
            <g key={t.id}
              style={{
                transform: `translate(${cx}px, ${cy}px)`,
                transition:
                  t.state === "out"
                    ? "transform .5s cubic-bezier(.4,0,.2,1), opacity .4s"
                    : t.state === "new"
                    ? "transform .5s cubic-bezier(.34,1.56,.64,1) .1s, opacity .4s .1s"
                    : "transform 1.2s cubic-bezier(.22,1,.36,1)",
                opacity: t.state === "out" ? 0 : 1,
              }}
            >
              <circle cx="0" cy="0" r="36" fill={t.color}
                style={{ filter: "brightness(1.05) saturate(1.1)" }} />
              <ellipse cx="-8" cy="-10" rx="12" ry="8" fill="rgba(255,255,255,.18)" />
              <text x="0" y="4" textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="600"
                fontFamily="var(--font-fraunces, serif)" fill="#fff"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {t.name.length > 9 ? t.name.slice(0, 8) + "…" : t.name}
              </text>
              {searching && (
                <circle cx="0" cy="0" r="40" fill="none"
                  stroke="rgba(209,174,95,.6)" strokeWidth="2"
                  strokeDasharray="40 220"
                  style={{ animation: "hs-spin 1s linear infinite" }} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Pause / play button — centred in the circle */}
      <button
        className={cn("hs-pause", paused && "hs-pause-paused")}
        onClick={togglePause}
        aria-label={paused ? "Resume animation" : "Pause animation"}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? (
          // Play triangle
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        ) : (
          // Pause bars
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>

      {/* Bowl + dish result */}
      <Bowl dish={dish} visible={bowlVisible} />
    </div>
  );
}

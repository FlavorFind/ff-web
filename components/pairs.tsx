"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Plate } from "./plate";
import { useInView } from "@/hooks/use-in-view";
import { fetchDish } from "@/lib/api";
import { cn } from "@/lib/utils";

// Source dishes — we fetch their full detail (which now includes pairings inline).
// These cover a wide spread: Kenyan staples, coast, snacks, Ethiopian, Rwandan.
const SOURCE_SLUGS = [
  "ugali", "nyama-choma", "pilau", "chapati", "kuku-paka",
  "sukuma-wiki", "mandazi", "pilau", "githeri", "mukimo",
  "samaki-wa-kupaka", "kenyan-samosa-ya-viazi", "mshikaki",
  "kachumbari", "viazi-karai",
] as const;

interface Pair {
  a: string;           // "from" dish display name
  b: string;           // "to" dish / label display name
  aSlug: string;
  bSlug: string | null;
  rating: number;      // 1–5
  type: string;        // side | drink | dessert | starter
}

// Shown while fetching — prevents the section from being empty
const SEED: Pair[] = [
  { a: "Ugali",       b: "Sukuma Wiki", aSlug: "ugali",       bSlug: "sukuma-wiki",  rating: 5, type: "side"  },
  { a: "Nyama Choma", b: "Kachumbari",  aSlug: "nyama-choma", bSlug: "kachumbari",   rating: 5, type: "side"  },
  { a: "Pilau",       b: "Kachumbari",  aSlug: "pilau",       bSlug: "kachumbari",   rating: 5, type: "side"  },
  { a: "Chapati",     b: "Chai",        aSlug: "chapati",     bSlug: null,           rating: 5, type: "drink" },
  { a: "Kuku Paka",   b: "Mkate wa Ufuta", aSlug: "kuku-paka", bSlug: "mkate-wa-ufuta", rating: 5, type: "side" },
];

// Deduplicate by canonical key so we don't show "Ugali + Kachumbari" and
// "Kachumbari + Ugali" as separate cards.
function dedup(pairs: Pair[]): Pair[] {
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const key = [p.aSlug, p.bSlug ?? p.b.toLowerCase()].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Stable-ish shuffle that prioritises strength 5 first, then 4, then 3.
function sortPairs(pairs: Pair[]): Pair[] {
  return [...pairs].sort((a, b) => b.rating - a.rating);
}

const INTERVAL_MS = 3500;

export function Pairs() {
  const [pairs, setPairs] = useState<Pair[]>(SEED);
  const [idx, setIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0); // bumped to retrigger CSS entrance
  const [dots, setDots] = useState(0);
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  const paused = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch all pairings from source dishes in parallel ─────────────────────
  useEffect(() => {
    let cancelled = false;
    const unique = [...new Set(SOURCE_SLUGS)];

    Promise.all(
      unique.map(async (slug) => {
        try {
          const dish = await fetchDish(slug);
          const raw = dish.pairings ?? [];
          return raw
            .filter((p) => p.pairing_type !== "flavour")
            .map((p): Pair => ({
              a: dish.name_en,
              b: p.paired_dish_name ?? p.paired_label,
              aSlug: slug,
              bSlug: p.paired_dish_slug,
              rating: p.strength,
              type: p.pairing_type,
            }))
            .filter((p) => p.b); // drop empty labels
        } catch {
          return [];
        }
      }),
    ).then((chunks) => {
      if (cancelled) return;
      const all = sortPairs(dedup(chunks.flat()));
      if (all.length >= 3) {
        setPairs(all);
        setIdx(0);
      }
    });

    return () => { cancelled = true; };
  }, []);

  // ── Advance to a specific index, triggering entrance animation ────────────
  const goTo = useCallback(
    (next: number, total: number) => {
      setIdx(next % total);
      setAnimKey((k) => k + 1);
    },
    [],
  );

  // ── Dot counter animation whenever animKey changes and section is visible ──
  useEffect(() => {
    if (!seen) return;
    const rating = pairs[idx]?.rating ?? 5;
    setDots(0);
    const timers = Array.from({ length: rating }, (_, k) =>
      setTimeout(() => setDots(k + 1), 500 + k * 140),
    );
    return () => timers.forEach(clearTimeout);
  }, [animKey, seen, idx, pairs]);

  // ── Auto-advance ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seen) return;
    const tick = () => {
      if (!paused.current) {
        goTo(idx + 1, pairs.length);
      }
      timerRef.current = setTimeout(tick, INTERVAL_MS);
    };
    timerRef.current = setTimeout(tick, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [seen, idx, pairs.length, goTo]);

  const prev = () => { goTo((idx - 1 + pairs.length) % pairs.length, pairs.length); };
  const next = () => { goTo(idx + 1, pairs.length); };

  const pair = pairs[idx];
  if (!pair) return null;

  // Cap visible nav dots at 12 — for many pairings just show position/total
  const showNavDots = pairs.length <= 12;

  return (
    <section
      className="pairs sec"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocus={() => { paused.current = true; }}
      onBlur={() => { paused.current = false; }}
    >
      <div className="wrap">
        <h2 className="h2">Some foods belong together</h2>
        <p className="lead">
          Pairings rated from 1 to 5, so a hotel menu or a home table always has something to add.
        </p>

        {/* Carousel stage */}
        <div
          ref={ref}
          className={cn("duo", seen && "in")}
          aria-live="polite"
          aria-atomic="true"
        >
          <Fragment key={animKey}>
            <Plate
              name={pair.a}
              tone="exact"
              href={`/dishes/${pair.aSlug}`}
            />
            <span className="plus" aria-hidden="true">+</span>
            <Plate
              name={pair.b}
              tone="exact"
              href={pair.bSlug ? `/dishes/${pair.bSlug}` : undefined}
            />
            <div
              className="dots"
              role="img"
              aria-label={`Pairing strength ${pair.rating} of 5`}
            >
              {"●".repeat(dots) + "○".repeat(5 - dots)}
            </div>
          </Fragment>
        </div>

        {/* Carousel controls */}
        <div className="pair-nav" aria-label="Pairing navigation">
          <button
            type="button"
            className="pair-arr"
            onClick={prev}
            aria-label="Previous pairing"
          >
            ←
          </button>

          {showNavDots ? (
            <div className="pair-pips" role="tablist">
              {pairs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Pairing ${i + 1}`}
                  className={cn("pair-pip", i === idx && "on")}
                  onClick={() => goTo(i, pairs.length)}
                />
              ))}
            </div>
          ) : (
            <span className="pair-count" aria-live="polite">
              {idx + 1} / {pairs.length}
            </span>
          )}

          <button
            type="button"
            className="pair-arr"
            onClick={next}
            aria-label="Next pairing"
          >
            →
          </button>
        </div>

        <p className="cap">
          {pairs.length > 0
            ? `${pairs.length} pairings from the Flavor Find recipe database.`
            : "Real pairings from the Flavor Find recipe database."}
        </p>
      </div>
    </section>
  );
}

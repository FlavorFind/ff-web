"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { cl, es, lp, sg, prefersReducedMotion } from "@/lib/math";
import { searchDishes, type SearchDish } from "@/lib/api";
import type { CSSVars } from "@/lib/utils";

// ── Static fallback token colours (by position, not ingredient) ───────────────
const TOKEN_COLORS = ["#b9472f", "#8a5a7a", "#4c8a4f", "#c9532f", "#b98f55"];

// ── BowlScene ─────────────────────────────────────────────────────────────────
// Renders a steaming bowl SVG with a label tag below it.
// --tg controls tag opacity, --st controls steam draw progress.
function BowlScene({ ref, id, children }: { ref: Ref<HTMLDivElement>; id: string; children: ReactNode }) {
  return (
    <div ref={ref} className="bowl">
      <svg viewBox="0 0 200 150" aria-hidden="true">
        <defs>
          <radialGradient id={id} cx=".35" cy=".25" r=".9">
            <stop offset="0" stopColor="#4a7565" />
            <stop offset="1" stopColor="#1f372f" />
          </radialGradient>
        </defs>
        <g className="steam">
          <path d="M70 44c-8-10 8-14 0-28" />
          <path d="M100 44c-8-10 8-14 0-28" />
          <path d="M130 44c-8-10 8-14 0-28" />
        </g>
        <path
          d="M12 62h176c0 48-40 84-88 84S12 110 12 62z"
          fill={`url(#${id})`}
          stroke="#D1AE5F"
          strokeWidth="3"
        />
      </svg>
      <div className="tag">{children}</div>
    </div>
  );
}

// ── Token colour helper ───────────────────────────────────────────────────────
// Generates a deterministic colour for an ingredient based on its first char.
function tokenColor(name: string, idx: number): string {
  const palette = ["#b9472f","#8a5a7a","#4c8a4f","#c9532f","#b98f55","#5a7a8a","#7a8a4f","#8a4f5a"];
  const code = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return palette[(code + idx) % palette.length];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface StoryToken {
  en: string;
  sw: string;
  x: number;
  y: number;
  deg: number | null; // null = ejected token
  color: string;
}

interface DishSlot {
  dish: SearchDish;
  pairing?: string; // name of paired dish/drink
}

// ── Scatter positions for up to 5 tokens on the stage ────────────────────────
const SCATTER: Array<[number, number]> = [
  [-0.78, -0.58],
  [ 0.80, -0.66],
  [-0.72,  0.62],
  [ 0.78,  0.56],
  [ 0.05, -0.90],
];
// Orbit angles (evenly spaced, last slot = ejected if ingredient doesn't match)
const ORBIT_DEGS = [-90, 0, 90, 180, null] as const;

// ── Seed ingredients for the initial load ─────────────────────────────────────
// Shown before the API responds. Real names the engine resolves.
const SEED_INGREDIENTS = ["Tomato", "Onion", "Coriander", "Chilli", "Chicken"];
const SEED_CAPTIONS: [string, string][] = [
  ["Open the pantry.", "Tomato, onion, coriander, chilli. And a chicken that wandered in."],
  ["Strict means strict.", "The engine checks every required ingredient. Chicken isn't needed, so it's out."],
  ["It comes together.", "Every required ingredient is covered. An exact match, with the reasons attached."],
  ["Then it tells you what to serve.", "Dishes rotate as you scroll — each one your ingredients can make."],
];

// How many dishes to cycle through in the plate phase (scroll p=0.5 → 1.0)
const MAX_DISHES = 6;

// ── Main component ────────────────────────────────────────────────────────────
export function Story() {
  const sec    = useRef<HTMLElement>(null);
  const pin    = useRef<HTMLDivElement>(null);
  const stage  = useRef<HTMLDivElement>(null);
  const ring   = useRef<SVGSVGElement>(null);
  const tknEls = useRef<(HTMLDivElement | null)[]>([]);
  const bowl1  = useRef<HTMLDivElement>(null);
  const bowl2  = useRef<HTMLDivElement>(null);
  const dims   = useRef({ size: 1, top: 0 });

  // ── Data refs — readable by the scroll callback without stale closures ──────
  const SEED_TOKENS: StoryToken[] = SEED_INGREDIENTS.map((en, i) => ({
    en, sw: "",
    x: SCATTER[i][0], y: SCATTER[i][1],
    deg: ORBIT_DEGS[i] as number | null,
    color: TOKEN_COLORS[i],
  }));

  // Pre-seed dishesRef with MAX_DISHES empty slots so scroll math always
  // divides into 6 equal sections from the start, even before the fetch lands.
  const SEED_DISHES: DishSlot[] = Array.from({ length: MAX_DISHES }, (_, i) => ({
    dish: {
      dish_id: `seed-${i}`, slug: "", name_en: "—", name_sw: "",
      tier: "exact" as const, score: 0,
      matched: [], missing: [], assumed_staples: [], quality_level: "",
    },
    pairing: undefined,
  }));

  const tokensRef  = useRef<StoryToken[]>(SEED_TOKENS);
  const dishesRef  = useRef<DishSlot[]>(SEED_DISHES);

  // React state — only what drives JSX re-renders
  const [tokensForRender, setTokensForRender] = useState<StoryToken[]>(SEED_TOKENS);
  const [captionsForRender, setCaptionsForRender] = useState<[string, string][]>(SEED_CAPTIONS);
  const [view, setView] = useState({ k: 0, d: 0, dishIdx: 0 });
  const [currentDish, setCurrentDish] = useState<DishSlot | null>(null);

  // ── Fetch real data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const ingredients = ["tomato", "onion", "coriander", "chilli"];

    searchDishes(ingredients, "explore", 12).then((res) => {
      if (cancelled) return;

      const all: SearchDish[] = [
        ...(res.results.exact    ?? []),
        ...(res.results.can_make ?? []),
        ...(res.results.almost   ?? []),
      ];
      if (all.length === 0) return;

      const picked = all.slice(0, MAX_DISHES);
      const first  = picked[0];

      const matchedNames = first.matched.map((m) => m.name_en);
      const missingNames = first.missing.map((m) => m.name_en);
      const pantry = [...matchedNames.slice(0, 4), missingNames[0] ?? "Chicken"].slice(0, 5);

      const newTokens: StoryToken[] = pantry.map((name, i) => ({
        en: name, sw: "",
        x: SCATTER[i][0], y: SCATTER[i][1],
        deg: (i < 4 ? ORBIT_DEGS[i] : null) as number | null,
        color: tokenColor(name, i),
      }));

      const slots: DishSlot[] = picked.map((d) => ({
        dish: d,
        pairing: undefined, // pairings not in search response — dish detail has them
      }));

      const ejected = pantry[4] ?? "one ingredient";
      const newCaptions: [string, string][] = [
        ["Open the pantry.",       `${pantry.slice(0, 4).join(", ")}. And ${ejected} that doesn't make the cut.`],
        ["Strict means strict.",   `The engine checks every required ingredient. ${ejected} isn't needed, so it's out.`],
        ["It comes together.",     `${first.name_en} — all matched, nothing guessed.`],
        ["Scroll to see every dish.", `${picked.length} dishes your pantry can make. Keep scrolling.`],
      ];

      // Populate refs FIRST so the next scroll frame sees the real data
      tokensRef.current  = newTokens;
      dishesRef.current  = slots;
      // Then flush to render state
      setTokensForRender(newTokens);
      setCaptionsForRender(newCaptions);
      setCurrentDish(slots[0] ?? null);
    }).catch(() => { /* silently keep seed data */ });

    return () => { cancelled = true; };
  }, []);

  // ── Animation maths ─────────────────────────────────────────────────────────
  const measure = () => {
    if (!stage.current || !pin.current) return;
    dims.current = {
      size: stage.current.clientWidth,
      top: parseFloat(getComputedStyle(pin.current).top) || 0,
    };
  };

  const put = (e: HTMLElement | null, x: number, y: number, s: number, o: number, r = 0) => {
    if (!e) return;
    const S = dims.current.size;
    e.style.transform = `translate(-50%,-50%) translate(${(x * S) / 2}px,${(y * S) / 2}px) scale(${s}) rotate(${r}deg)`;
    e.style.opacity = String(o);
  };

  const update = () => {
    const s  = sec.current;
    const p0 = pin.current;
    const st = stage.current;
    const b1 = bowl1.current;
    const b2 = bowl2.current;
    if (!s || !p0 || !st || !b1 || !b2) return;

    const total = s.offsetHeight - p0.offsetHeight;
    const p = prefersReducedMotion()
      ? 1
      : cl((dims.current.top - s.getBoundingClientRect().top) / total);

    const s1 = es(sg(p, 0.16, 0.46)); // tokens orbit
    const s2 = es(sg(p, 0.52, 0.74)); // tokens collapse to bowl
    const fade = 1 - sg(p, 0.66, 0.76);

    tokensRef.current.forEach((t, i) => {
      const e = tknEls.current[i];
      const dx = Math.sin(p * 9 + i * 1.7) * 0.04 * (1 - s1);
      const dy = Math.cos(p * 8 + i * 2.3) * 0.04 * (1 - s1);

      if (t.deg === null) {
        // Ejected token: fly upward and out
        const o = sg(p, 0.3, 0.48);
        put(e,
          t.x + dx,
          lp(t.y, -1.2, es(o)),
          1 - 0.4 * o,
          1 - sg(p, 0.3, 0.46),
          -12 * o,
        );
        return;
      }

      const a = (t.deg * Math.PI) / 180;
      let x = lp(t.x, Math.cos(a) * 0.62, s1) + dx;
      let y = lp(t.y, Math.sin(a) * 0.62, s1) + dy;
      x = lp(x, 0, s2);
      y = lp(y, 0.04, s2);
      put(e, x, y,
        lp(1, 0.3, s2),
        fade,
        (1 - s1) * (i * 22 - 30),
      );
    });

    // ── Dish rotation: p = 0.5 → 1.0, each dish occupies an equal slice ──────
    const dishCount = Math.max(dishesRef.current.length, 1);
    const platePhase = sg(p, 0.5, 1.0);
    const dishIdx = Math.min(
      Math.floor(platePhase * dishCount),
      dishCount - 1,
    );
    const sliceSize = 1 / dishCount;
    const sliceP = (platePhase - dishIdx * sliceSize) / sliceSize;

    const bo = es(sg(p, 0.5, 0.6));
    const m  = es(sg(sliceP, 0.6, 0.9));
    const bowlOp = es(sg(p, 0.5, 0.62));

    put(b1, lp(0, -0.5, m), 0.04, lp(0.8, 1, bo) * lp(1, 0.88, m), bowlOp);
    put(b2, lp(1.2, 0.5, m), 0.04, 0.88, es(sg(sliceP, 0.6, 0.78)));

    b1.style.setProperty("--tg", String(es(sg(p, 0.66, 0.76))));
    b1.style.setProperty("--st", String(es(sg(p, 0.68, 0.82))));
    b2.style.setProperty("--tg", String(es(sg(sliceP, 0.62, 0.82))));
    b2.style.setProperty("--st", String(es(sg(sliceP, 0.66, 0.92))));

    st.style.setProperty("--ar", String(es(sg(p, 0.5, 0.74))));
    if (ring.current) {
      ring.current.style.opacity = String(1 - 0.75 * sg(p, 0.8, 0.92));
    }

    const k = p < 0.24 ? 0 : p < 0.5 ? 1 : p < 0.76 ? 2 : 3;
    const d = dishesRef.current[dishIdx]?.dish
      ? Math.round(sliceP * 4)
      : Math.round(sg(p, 0.9, 1) * 4);

    const slot = dishesRef.current[dishIdx] ?? null;
    setView((v) => (v.k === k && v.d === d && v.dishIdx === dishIdx ? v : { k, d, dishIdx }));
    setCurrentDish((prev) => {
      if (!slot) return prev;
      if (prev?.dish.dish_id === slot.dish.dish_id) return prev;
      return slot;
    });
  };

  useScrollFrame(update, measure);

  const STEP_STARTS = [0, 0.24, 0.5, 0.76];
  const STEP_LABELS = ["Pantry", "Match", "Plate", "Pair"];

  const jump = (i: number) => {
    const s = sec.current;
    const p = pin.current;
    if (!s || !p) return;
    const total = s.offsetHeight - p.offsetHeight;
    window.scrollTo({
      top: s.getBoundingClientRect().top + window.scrollY - dims.current.top + (STEP_STARTS[i] + 0.02) * total,
      behavior: "smooth",
    });
  };

  // Current dish for bowl labels — driven by state so it updates on fetch + scroll
  const dishName    = currentDish?.dish.name_en ?? "—";
  const dishTier    = currentDish?.dish.tier    ?? "exact";
  const pairingName = currentDish?.pairing;

  return (
    <section ref={sec} className="story" id="story" aria-label="How a dish comes together">
      <div ref={pin} className="pin">
        {/* Left: captions + step nav */}
        <div className="side">
          <div className="caps">
            {captionsForRender.map(([h, body], i) => (
              <div
                key={i}
                className="sc"
                style={{
                  opacity: view.k === i ? 1 : 0,
                  transform: view.k === i ? "none" : `translateY(${i < view.k ? -18 : 18}px)`,
                }}
              >
                <h2>{h}</h2>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="chs">
            {STEP_LABELS.map((label, i) => (
              <button key={label} type="button" aria-current={view.k === i} onClick={() => jump(i)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: animated stage — NO border ring, NO stage::before glow */}
        <div ref={stage} className="stage story-stage">
          {/* Dashed track ring + gold arc */}
          <svg ref={ring} className="ring" viewBox="0 0 400 400" aria-hidden="true">
            <circle className="trk" cx="200" cy="200" r="186" />
            <circle className="arc" cx="200" cy="200" r="186" />
          </svg>

          {tokensForRender.map((t, i) => (
            <div
              key={t.en}
              ref={(el) => { tknEls.current[i] = el; }}
              className="tk"
              style={{ "--c": t.color, opacity: 0 } as CSSVars}
            >
              <b>{t.en}</b>
              {t.sw && <small>{t.sw}</small>}
            </div>
          ))}

          {/* Bowl 1: the matched dish, cycles as user scrolls */}
          <BowlScene ref={bowl1} id="bowl-grad-1">
            <b>{dishName}</b>
            <small
              style={{
                background: dishTier === "exact" ? "var(--gold)" : "rgba(209,174,95,.5)",
                color: "var(--deep)",
                borderRadius: "99px",
                padding: ".05rem .55rem",
                fontWeight: 600,
                fontSize: ".72rem",
              }}
            >
              {dishTier === "exact" ? "Exact" : dishTier === "can_make" ? "Can make" : "Almost"}
            </small>
          </BowlScene>

          {/* Bowl 2: pairing suggestion */}
          <BowlScene ref={bowl2} id="bowl-grad-2">
            <b>{pairingName ?? "—"}</b>
            <span className="d2">
              {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} className={i < view.d ? "on" : undefined} />
              ))}
            </span>
          </BowlScene>
        </div>
      </div>
    </section>
  );
}

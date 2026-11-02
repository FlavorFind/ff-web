"use client";

/**
 * Cook page — /cook
 *
 * The core product page. Full ingredient builder + tiered results grid.
 * Works for anonymous users (no pantry merge) and authenticated users.
 *
 * Flow:
 *  1. User types / picks ingredients → chips appear
 *  2. Each chip is resolved via POST /v1/resolve/ — ambiguous shows picker
 *  3. Search fires automatically via POST /v1/search/
 *  4. Results render in tiers: Exact → Can make → Almost
 *  5. Dish card links to /dishes/[slug]
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ApiError,
  autocomplete,
  resolveIngredients,
  searchDishes,
  getPantry,
  type IngredientResult,
  type ResolveToken,
  type SearchDish,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { QUICK_ADD } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Chip {
  id: string;
  display: string;
  token: string;
  status: "ok" | "pending" | "unmatched";
}

type Notice =
  | { kind: "text"; text: string }
  | { kind: "disambig"; token: string; options: ResolveToken["options"] };

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

// ── Dish card ──────────────────────────────────────────────────────────────────

function DishCard({ dish, index }: { dish: SearchDish; index: number }) {
  const tierLabel =
    dish.tier === "exact" ? "Exact match"
    : dish.tier === "can_make" ? "Can make"
    : dish.missing[0] ? `Almost — needs ${dish.missing[0].name_en}` : "Almost";

  const tierClass =
    dish.tier === "exact" ? "ck-badge-exact"
    : dish.tier === "can_make" ? "ck-badge-can"
    : "ck-badge-almost";

  return (
    <Link
      href={`/dishes/${dish.slug}`}
      className="ck-card"
      style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
    >
      {/* Image placeholder — duotone until real food photos */}
      <div className="ck-card-img" aria-hidden="true">
        <svg viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg">
          <rect width="280" height="220" fill="#25423A" />
          {/* Gold line illustration — bowl */}
          <path d="M60 120 Q140 170 220 120" stroke="#D1AE5F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".7" />
          <ellipse cx="140" cy="118" rx="80" ry="10" stroke="#D1AE5F" strokeWidth="2" fill="none" opacity=".5" />
          {/* Steam wisps */}
          <path d="M110 105 Q105 90 110 75" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
          <path d="M140 100 Q135 83 140 68" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
          <path d="M170 105 Q165 90 170 75" stroke="#D1AE5F" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".4" />
        </svg>
      </div>

      <div className="ck-card-body">
        <span className={cn("ck-badge", tierClass)}>{tierLabel}</span>
        <h3 className="ck-card-name">{dish.name_en}</h3>
        {dish.name_sw && dish.name_sw !== dish.name_en && (
          <p className="ck-card-sw">{dish.name_sw}</p>
        )}

        {dish.missing.length > 0 && (
          <p className="ck-card-missing">
            Missing: {dish.missing.slice(0, 3).map((m) => m.name_en).join(", ")}
            {dish.missing.length > 3 && ` +${dish.missing.length - 3} more`}
          </p>
        )}
        {dish.assumed_staples.length > 0 && (
          <p className="ck-card-staples">
            Assumes: {dish.assumed_staples.slice(0, 2).map((s) => s.name_en).join(", ")}
          </p>
        )}

        <span className="ck-card-cta">
          {dish.tier === "almost" ? "View recipe →" : "Cook now →"}
        </span>
      </div>
    </Link>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="ck-card ck-card-skeleton" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="ck-card-img ck-skel-img" />
      <div className="ck-card-body">
        <div className="ck-skel-line" style={{ width: "40%", height: "1rem" }} />
        <div className="ck-skel-line" style={{ width: "75%", height: "1.4rem", marginTop: ".5rem" }} />
        <div className="ck-skel-line" style={{ width: "55%", height: ".9rem", marginTop: ".4rem" }} />
      </div>
    </div>
  );
}

// ── Tier section header ────────────────────────────────────────────────────────

function TierHeader({ tier, count }: { tier: string; count: number }) {
  const labels: Record<string, { title: string; desc: string; cls: string }> = {
    exact:    { title: "Exact matches",   desc: "All required ingredients in your list",         cls: "ck-th-exact" },
    can_make: { title: "Can make",        desc: "Needs common staples (oil, salt, water)",        cls: "ck-th-can" },
    almost:   { title: "Almost there",   desc: "Missing 1–2 ingredients — easy to grab",         cls: "ck-th-almost" },
  };
  const info = labels[tier];
  if (!info || count === 0) return null;
  return (
    <div className={cn("ck-tier-header", info.cls)}>
      <div>
        <span className="ck-tier-title">{info.title}</span>
        <span className="ck-tier-desc">{info.desc}</span>
      </div>
      <span className="ck-tier-count">{count} {count === 1 ? "dish" : "dishes"}</span>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ mode, onSwitch }: { mode: "strict" | "explore"; onSwitch: () => void }) {
  return (
    <div className="ck-empty">
      <svg viewBox="0 0 80 80" aria-hidden="true" className="ck-empty-icon">
        <circle cx="40" cy="40" r="38" fill="none" stroke="currentColor" strokeWidth="2" opacity=".3" strokeDasharray="4 6" />
        <path d="M20 48 Q40 58 60 48" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
        <circle cx="40" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity=".4" />
        <path d="M35 35 Q40 28 45 35" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
      </svg>
      <h3>No dishes found</h3>
      {mode === "strict" ? (
        <>
          <p>No dishes use exactly these ingredients. Try switching to Explore to see dishes that are 1–2 ingredients away.</p>
          <button className="btn" onClick={onSwitch}>Switch to Explore</button>
        </>
      ) : (
        <p>No dishes found even in explore mode. Try removing an ingredient or checking the spelling.</p>
      )}
    </div>
  );
}

// ── Cook page ──────────────────────────────────────────────────────────────────

export default function CookPage() {
  const { lang, t } = useLang();
  const { isAuthenticated } = useAuth();

  // Ingredient chips
  const [chips, setChips] = useState<Chip[]>([]);

  // Search state
  const [mode, setMode] = useState<"strict" | "explore">("strict");
  const [results, setResults] = useState<{
    exact: SearchDish[];
    can_make: SearchDish[];
    almost: SearchDish[];
  } | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Input + autocomplete
  const [input, setInput] = useState("");
  const [acResults, setAcResults] = useState<IngredientResult[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const acAbort = useRef<AbortController | null>(null);
  const acDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disambiguation / notice
  const [notice, setNotice] = useState<Notice | null>(null);

  // ── Load pantry for authenticated users ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    getPantry()
      .then((items) => {
        if (items.length === 0) return;
        const pantryChips: Chip[] = items.map((item) => ({
          id: uid(),
          display: item.display_name,
          token: item.display_name.toLowerCase(),
          status: "ok" as const,
        }));
        setChips((prev) => {
          const existing = new Set(prev.map((c) => c.token));
          return [...prev, ...pantryChips.filter((c) => !existing.has(c.token))];
        });
      })
      .catch(() => {}); // silently fail — user can still add manually
  }, [isAuthenticated]);

  // ── Autocomplete ─────────────────────────────────────────────────────────────

  const runAc = useCallback((q: string) => {
    if (!q.trim()) { setAcResults([]); setAcOpen(false); return; }
    acAbort.current?.abort();
    acAbort.current = new AbortController();
    autocomplete(q, lang as "en" | "sw", 10, acAbort.current.signal)
      .then((res) => {
        setAcResults(res.results.slice(0, 8));
        setAcOpen(res.results.length > 0);
      })
      .catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (acDebounce.current) clearTimeout(acDebounce.current);
    acDebounce.current = setTimeout(() => runAc(input), 200);
    return () => { if (acDebounce.current) clearTimeout(acDebounce.current); };
  }, [input, runAc]);

  // ── Add chips ─────────────────────────────────────────────────────────────────

  const addTokens = useCallback(async (raw: string[]) => {
    const terms = raw.map((s) => s.trim()).filter(Boolean);
    if (!terms.length) return;

    const newChips: Chip[] = terms.map((s) => ({
      id: uid(), display: s, token: s.toLowerCase(), status: "pending" as const,
    }));

    setChips((prev) => {
      const existing = new Set(prev.map((c) => c.token.toLowerCase()));
      return [...prev, ...newChips.filter((c) => !existing.has(c.token))];
    });
    setNotice(null);

    try {
      const res = await resolveIngredients(terms, lang as "en" | "sw");
      const first_ambiguous = res.results.find((r) => r.status === "ambiguous");
      const first_unknown   = res.results.find((r) => r.status === "unmatched");

      setChips((prev) =>
        prev.map((chip) => {
          const resolved = res.results.find(
            (r) => r.token.toLowerCase() === chip.token.toLowerCase(),
          );
          if (!resolved || chip.status !== "pending") return chip;
          return { ...chip, status: resolved.status === "matched" ? "ok" : "unmatched" };
        }),
      );

      if (first_ambiguous) {
        setNotice({ kind: "disambig", token: first_ambiguous.token, options: first_ambiguous.options });
      } else if (first_unknown) {
        const text = (t("unknown") as string).replace("{term}", first_unknown.token);
        setNotice({ kind: "text", text });
      }
    } catch {
      setChips((prev) =>
        prev.map((c) => c.status === "pending" ? { ...c, status: "ok" as const } : c),
      );
    }
  }, [lang, t]);

  // ── Search ────────────────────────────────────────────────────────────────────

  const searchAbort = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (
    activeChips: Chip[],
    activeMode: "strict" | "explore",
  ) => {
    const tokens = activeChips
      .filter((c) => c.status !== "unmatched")
      .map((c) => c.token);
    if (!tokens.length) { setResults(null); return; }

    searchAbort.current?.abort();
    searchAbort.current = new AbortController();
    setSearching(true);
    setSearchError(null);

    try {
      const res = await searchDishes(tokens, activeMode, 40, searchAbort.current.signal);
      setResults(res.results);
      setTotalResults(res.total_results);
      setDegraded(res.engine_status === "degraded");
      setHasSearched(true);
    } catch (err) {
      if (err instanceof ApiError) setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  // Auto-search on chip/mode change
  const chipsKey = chips.map((c) => c.token).join(",");
  const prevKey  = useRef("");
  const prevMode = useRef(mode);
  useEffect(() => {
    if (chipsKey === prevKey.current && mode === prevMode.current) return;
    prevKey.current  = chipsKey;
    prevMode.current = mode;
    if (chips.length === 0) { setResults(null); setTotalResults(0); setHasSearched(false); return; }
    runSearch(chips, mode);
  }, [chipsKey, mode, chips, runSearch]);

  // ── Form handlers ─────────────────────────────────────────────────────────────

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const terms = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (!terms.length) return;
    addTokens(terms);
    setInput("");
    setAcOpen(false);
  };

  const pickAc = (item: IngredientResult) => {
    addTokens([item.name_en]);
    setInput("");
    setAcOpen(false);
  };

  const removeChip = (id: string) => setChips((prev) => prev.filter((c) => c.id !== id));

  const clearAll = () => {
    setChips([]);
    setResults(null);
    setTotalResults(0);
    setHasSearched(false);
    setNotice(null);
  };

  const chooseDisambig = (name: string) => {
    if (notice?.kind === "disambig") {
      setChips((prev) =>
        prev.map((c) =>
          c.token.toLowerCase() === notice.token.toLowerCase()
            ? { ...c, display: name, token: name.toLowerCase(), status: "ok" as const }
            : c,
        ),
      );
    }
    setNotice(null);
  };

  // ── Flatten results ───────────────────────────────────────────────────────────

  const allDishes = useMemo(() => {
    if (!results) return [];
    return [...results.exact, ...results.can_make, ...results.almost];
  }, [results]);

  const hasResults  = allDishes.length > 0;
  const showEmpty   = hasSearched && !searching && !hasResults && chips.length > 0;
  const showResults = !searching && hasResults;

  // running index across tiers for stagger animation
  let cardIndex = 0;

  return (
    <div className="ck-page">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="ck-header">
        <div className="wrap">
          <div className="ck-header-inner">
            <div>
              <h1 className="ck-title">Cook</h1>
              <p className="ck-subtitle">
                Tell us what you have. We'll show you what Kenya cooks with it.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="ck-mode-wrap">
              <span className="ck-mode-label">Mode</span>
              <div className="seg" role="group" aria-label="Search mode">
                {(["strict", "explore"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                  >
                    {m === "strict" ? "Strict" : "Explore"}
                  </button>
                ))}
              </div>
              <p className="ck-mode-hint">
                {mode === "strict"
                  ? "Only shows dishes you can make right now."
                  : "Also shows dishes 1–2 ingredients away."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ingredient builder ────────────────────────────────────────────────── */}
      <div className="ck-builder">
        <div className="wrap">

          {/* Search bar */}
          <div className="ck-bar-wrap">
            <form className="ck-bar" autoComplete="off" onSubmit={onSubmit}>
              <label htmlFor="ck-input" className="sr-only">Add ingredient</label>
              <input
                id="ck-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => { if (acResults.length) setAcOpen(true); }}
                onBlur={() => setTimeout(() => setAcOpen(false), 150)}
                placeholder="Type an ingredient — e.g. nyanya, ugali, samaki…"
                autoComplete="off"
                enterKeyHint="search"
              />
              <button className="btn" type="submit" aria-label="Add ingredient">
                Add
              </button>
            </form>

            {/* Autocomplete dropdown */}
            {acOpen && acResults.length > 0 && (
              <ul className="ac-drop ck-ac-drop" role="listbox" aria-label="Ingredient suggestions">
                {acResults.map((item) => (
                  <li
                    key={item.slug}
                    role="option"
                    aria-selected="false"
                    onMouseDown={() => pickAc(item)}
                  >
                    <span>{item.name_en}</span>
                    {item.name_sw && item.name_sw !== item.name_en && (
                      <em>{item.name_sw}</em>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick add chips */}
          <div className="sugg ck-sugg">
            <span>Quick add:</span>
            {QUICK_ADD.map((item) => {
              const already = chips.some((c) => c.token === item.en.toLowerCase());
              return (
                <button
                  key={item.en}
                  type="button"
                  disabled={already}
                  onClick={() => addTokens([item.en])}
                  style={{ opacity: already ? 0.4 : undefined }}
                >
                  {lang === "sw" ? item.sw : item.en}
                </button>
              );
            })}
          </div>

          {/* Active ingredient chips */}
          {chips.length > 0 && (
            <div className="ck-chips-row">
              <div className="chips ck-chips" aria-live="polite" aria-label="Selected ingredients">
                {chips.map((chip) => (
                  <span
                    key={chip.id}
                    className={cn("chip ck-chip", chip.status === "unmatched" && "chip-warn")}
                  >
                    {chip.display}
                    {chip.status === "pending" && (
                      <span className="chip-spin" aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${chip.display}`}
                      onClick={() => removeChip(chip.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="ck-clear"
                onClick={clearAll}
                aria-label="Clear all ingredients"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Disambiguation / notice */}
          {notice && (
            <div className="msg ck-msg" role="alert">
              {notice.kind === "text" && notice.text}
              {notice.kind === "disambig" && (
                <>
                  <span>"{notice.token}" could mean: </span>
                  {notice.options.map((o) => (
                    <button key={o.ingredient_id} type="button" onClick={() => chooseDisambig(o.name)}>
                      {o.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {searchError && (
            <p className="msg" role="alert" style={{ color: "var(--chili)" }}>{searchError}</p>
          )}

          {/* Engine degraded */}
          {degraded && (
            <p className="ck-degraded" role="status">
              ⚠ Showing cached results — our recipe brain is temporarily unavailable.
            </p>
          )}

          {/* Results summary bar */}
          {chips.length > 0 && (
            <div className="ck-summary" aria-live="polite" aria-atomic="true">
              {searching
                ? "Searching…"
                : hasResults
                  ? <>
                      <strong>{totalResults}</strong> {totalResults === 1 ? "dish" : "dishes"} found
                      {results?.exact.length ? <span className="ck-sum-exact"> · {results.exact.length} exact</span> : null}
                      {results?.can_make.length ? <span className="ck-sum-can"> · {results.can_make.length} can make</span> : null}
                      {results?.almost.length && mode === "explore" ? <span className="ck-sum-almost"> · {results.almost.length} almost</span> : null}
                    </>
                  : hasSearched ? "No dishes found" : ""}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────────────── */}
      <div className="ck-results">
        <div className="wrap">

          {/* Pre-search state — prompt */}
          {chips.length === 0 && (
            <div className="ck-prompt">
              <div className="ck-prompt-icon" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="2" opacity=".2" strokeDasharray="5 7" />
                  <path d="M24 72 Q60 90 96 72" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".35" />
                  <ellipse cx="60" cy="70" rx="36" ry="6" stroke="currentColor" strokeWidth="2" fill="none" opacity=".25" />
                  <path d="M44 62 Q46 48 50 42" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".3" />
                  <path d="M60 58 Q62 44 66 38" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".3" />
                  <path d="M76 62 Q78 48 82 42" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".3" />
                </svg>
              </div>
              <h2>What's in your kitchen?</h2>
              <p>Add the ingredients you have above. We'll match them against 300 Kenyan dishes and show you exactly what you can cook — right now.</p>
              <div className="ck-prompt-tips">
                <span>💡 Try Swahili names — <em>nyanya, vitunguu, sukuma wiki</em></span>
                <span>💡 Add more ingredients for more matches</span>
                <span>💡 Switch to Explore to see dishes you're close to making</span>
              </div>
            </div>
          )}

          {/* Skeleton loading */}
          {searching && (
            <div className="ck-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <EmptyState mode={mode} onSwitch={() => setMode("explore")} />
          )}

          {/* Exact tier */}
          {showResults && results!.exact.length > 0 && (
            <>
              <TierHeader tier="exact" count={results!.exact.length} />
              <div className="ck-grid ck-grid-exact">
                {results!.exact.map((dish) => (
                  <DishCard key={dish.dish_id} dish={dish} index={cardIndex++} />
                ))}
              </div>
            </>
          )}

          {/* Can make tier */}
          {showResults && results!.can_make.length > 0 && (
            <>
              <TierHeader tier="can_make" count={results!.can_make.length} />
              <div className="ck-grid">
                {results!.can_make.map((dish) => (
                  <DishCard key={dish.dish_id} dish={dish} index={cardIndex++} />
                ))}
              </div>
            </>
          )}

          {/* Almost tier — only in explore mode */}
          {showResults && mode === "explore" && results!.almost.length > 0 && (
            <>
              <TierHeader tier="almost" count={results!.almost.length} />
              <div className="ck-grid">
                {results!.almost.map((dish) => (
                  <DishCard key={dish.dish_id} dish={dish} index={cardIndex++} />
                ))}
              </div>
            </>
          )}

          {/* Allergen disclaimer — always shown when results are present */}
          {showResults && (
            <p className="ck-allergen">
              Allergen information is for guidance only. Always confirm with the kitchen before ordering.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

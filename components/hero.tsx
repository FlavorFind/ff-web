"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Bowl } from "./icons";
import { Plate } from "./plate";
import { useLang } from "@/lib/lang-context";
import { QUICK_ADD } from "@/lib/data";
import {
  ApiError,
  autocomplete,
  resolveIngredients,
  searchDishes,
  type IngredientResult,
  type ResolveToken,
  type SearchDish,
} from "@/lib/api";
import { cn, type CSSVars } from "@/lib/utils";
import { HeroStage } from "./hero-stage";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Chip {
  id: string;
  display: string;   // what the user typed / picked
  token: string;     // normalised token for the API
  status: "ok" | "pending" | "unmatched";
}

type Notice =
  | { kind: "text"; text: string }
  | { kind: "disambig"; token: string; options: ResolveToken["options"] };

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

const TIER_MAP = { exact: "exact", can_make: "can", almost: "almost" } as const;
type Tone = "exact" | "can" | "almost";

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  const { lang, t } = useLang();

  // Ingredient chips
  const [chips, setChips] = useState<Chip[]>([]);

  // Search
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

  // Input + autocomplete
  const [input, setInput] = useState("");
  const [acResults, setAcResults] = useState<IngredientResult[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const acAbort = useRef<AbortController | null>(null);
  const acDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disambiguation / notice
  const [notice, setNotice] = useState<Notice | null>(null);

  // Detail expand (click a plate to see matched/missing)
  const [picked, setPicked] = useState<string | null>(null);

  // ── Autocomplete ────────────────────────────────────────────────────────────

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

  // ── Add chips ───────────────────────────────────────────────────────────────

  const addTokens = useCallback(async (raw: string[]) => {
    const terms = raw.map((t) => t.trim()).filter(Boolean);
    if (!terms.length) return;

    // Optimistically add as "pending"
    const newChips: Chip[] = terms.map((t) => ({
      id: uid(),
      display: t,
      token: t.toLowerCase(),
      status: "pending" as const,
    }));

    setChips((prev) => {
      const existing = new Set(prev.map((c) => c.token.toLowerCase()));
      return [...prev, ...newChips.filter((c) => !existing.has(c.token))];
    });
    setNotice(null);
    setPicked(null);

    // Resolve with the API
    try {
      const res = await resolveIngredients(terms, lang as "en" | "sw");

      // Handle per-token results
      const first_ambiguous = res.results.find((r) => r.status === "ambiguous");
      const first_unknown = res.results.find((r) => r.status === "unmatched");

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
      // If resolve fails, keep chips as pending — search will still work
      setChips((prev) =>
        prev.map((c) => c.status === "pending" ? { ...c, status: "ok" as const } : c),
      );
    }
  }, [lang, t]);

  // ── Search ──────────────────────────────────────────────────────────────────

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
      const res = await searchDishes(tokens, activeMode, 24, searchAbort.current.signal);
      setResults(res.results);
      setTotalResults(res.total_results);
      setDegraded(res.engine_status === "degraded");
    } catch (err) {
      if (err instanceof ApiError) setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  // Auto-search whenever chips or mode change
  const chipsKey = chips.map((c) => c.token).join(",");
  const prevKey = useRef("");
  const prevMode = useRef(mode);
  useEffect(() => {
    if (chipsKey === prevKey.current && mode === prevMode.current) return;
    prevKey.current = chipsKey;
    prevMode.current = mode;
    if (chips.length === 0) { setResults(null); setTotalResults(0); return; }
    runSearch(chips, mode);
  }, [chipsKey, mode, chips, runSearch]);

  // ── Form submit ─────────────────────────────────────────────────────────────

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const terms = input.split(",").map((t) => t.trim()).filter(Boolean);
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

  const removeChip = (id: string) => {
    setChips((prev) => prev.filter((c) => c.id !== id));
    setPicked(null);
  };

  const chooseDisambig = (name: string) => {
    // Replace the pending/unmatched chip with the chosen one
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

  // ── Flatten results ─────────────────────────────────────────────────────────

  const allDishes = useMemo(() => {
    if (!results) return [];
    return [
      ...results.exact,
      ...results.can_make,
      ...results.almost,
    ];
  }, [results]);

  const pickedDish = allDishes.find((d) => d.dish_id === picked);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="hero" id="cook">
      <div className="wrap">
        <div className="hero-grid">
          {/* ── Left: search UI ── */}
          <div className="hero-left">
        <h1>{t("h1")}</h1>
        <p className="sub">{t("sub")}</p>

        {/* ── Search bar ── */}
        <div style={{ position: "relative", maxWidth: "680px" }}>
          <form className="bar" autoComplete="off" onSubmit={onSubmit}>
            <label htmlFor="ingredients" className="sr-only">Ingredients</label>
            <input
              id="ingredients"
              value={input}
              onChange={(e) => { setInput(e.target.value); }}
              onFocus={() => { if (acResults.length) setAcOpen(true); }}
              onBlur={() => setTimeout(() => setAcOpen(false), 150)}
              placeholder={t("ph")}
              enterKeyHint="search"
              autoComplete="off"
            />
            <button className="btn" type="submit">{t("add")}</button>
          </form>

          {/* Autocomplete dropdown */}
          {acOpen && acResults.length > 0 && (
            <ul className="ac-drop" role="listbox" aria-label="Ingredient suggestions">
              {acResults.map((item) => (
                <li
                  key={item.slug}
                  role="option"
                  aria-selected="false"
                  onClick={() => pickAc(item)}
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

        {/* ── Chips ── */}
        <div className="chips" aria-live="polite">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className={cn("chip", chip.status === "unmatched" && "chip-warn")}
            >
              {chip.display}
              {chip.status === "pending" && (
                <span className="chip-spin" aria-hidden="true" />
              )}
              <button type="button" aria-label={`Remove ${chip.display}`} onClick={() => removeChip(chip.id)}>
                ×
              </button>
            </span>
          ))}
        </div>

        {/* ── Quick add ── */}
        <div className="sugg">
          <span>{t("try")}</span>
          {QUICK_ADD.map((item) => {
            const label = lang === "sw" ? item.sw : item.en;
            return (
              <button key={item.en} type="button" onClick={() => addTokens([item.en])}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Notice (disambig / unknown) ── */}
        <div className="msg" role="status">
          {notice?.kind === "text" && notice.text}
          {notice?.kind === "disambig" && (
            <>
              <span>"{notice.token}" — {t("disambig")} </span>
              {notice.options.map((o) => (
                <button
                  key={o.ingredient_id}
                  type="button"
                  onClick={() => chooseDisambig(o.name)}
                >
                  {o.name}
                </button>
              ))}
            </>
          )}
          {searchError && (
            <span style={{ color: "var(--chili)" }}>{searchError}</span>
          )}
        </div>

        {/* ── Controls ── */}
        {chips.length > 0 && (
          <div className="ctl">
            <div className="seg" role="group" aria-label="Search mode">
              {(["strict", "explore"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => { setMode(m); setPicked(null); }}
                >
                  {t(m)}
                </button>
              ))}
            </div>
            <div className="key" aria-hidden="true">
              <span><i style={{ background: "var(--gold)" }} />{t("legendExact")}</span>
              <span><i style={{ background: "#efe5cf" }} />{t("legendCan")}</span>
              <span><i style={{ border: "2px dashed var(--chili)" }} />{t("legendAlmost")}</span>
            </div>
            <span aria-live="polite">
              {searching
                ? t("searching")
                : totalResults > 0
                  ? `${totalResults} ${totalResults === 1 ? "dish" : "dishes"}`
                  : chips.length > 0 ? "No dishes found" : ""}
            </span>
          </div>
        )}

        {/* ── Engine degraded banner ── */}
        {degraded && (
          <p className="msg" style={{ color: "var(--gold)", marginBottom: "-.5rem" }}>
            {t("engineDown")}
          </p>
        )}

        {/* ── Results board ── */}
        <div className="board">
          {chips.length === 0 ? (
            /* Empty state — ghost plates */
            [0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("plate", "ghost")} style={{ "--i": i } as CSSVars}>
                <span className="rim"><Bowl /></span>
                <i>Add what you have</i>
              </div>
            ))
          ) : searching ? (
            /* Loading state */
            [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn("plate", "ghost")} style={{ "--i": i } as CSSVars}>
                <span className="rim" style={{ opacity: 0.4 }}><Bowl /></span>
                <i style={{ opacity: 0.3 }}>…</i>
              </div>
            ))
          ) : allDishes.length > 0 ? (
            allDishes.map((dish, i) => {
              const tone: Tone = TIER_MAP[dish.tier] ?? "exact";
              const [name, alt] =
                lang === "sw" && dish.name_sw
                  ? [dish.name_sw, dish.name_en]
                  : [dish.name_en, dish.name_sw || ""];
              const tag =
                dish.tier === "exact"
                  ? t("tierExact")
                  : dish.tier === "can_make"
                    ? t("tierCan")
                    : dish.missing[0]
                      ? `${t("tierAlmost")} — needs ${dish.missing[0].name_en}`
                      : t("tierAlmost");
              return (
                <Plate
                  key={dish.dish_id}
                  name={name}
                  alt={name === alt ? "" : alt}
                  tone={tone}
                  tag={tag}
                  index={i}
                  onClick={() => setPicked(dish.dish_id === picked ? null : dish.dish_id)}
                  href={`/dishes/${dish.slug}`}
                />
              );
            })
          ) : (
            <p className="max-w-[42ch] opacity-80">{t("noResults")}</p>
          )}
        </div>

        {/* ── Picked dish detail ── */}
        {pickedDish && (
          <p className="why">
            <strong>{pickedDish.name_en}</strong>
            {pickedDish.matched.length > 0 && ` · Matched: ${pickedDish.matched.map((m) => m.name_en).join(", ")}`}
            {pickedDish.missing.length > 0 && ` · Missing: ${pickedDish.missing.map((m) => m.name_en).join(", ")}`}
            {pickedDish.assumed_staples.length > 0 && ` · Assumes: ${pickedDish.assumed_staples.map((s) => s.name_en).join(", ")}`}
          </p>
        )}

        <p className="note">
          Live results from 300 Kenyan dishes and 878 ingredients.{" "}
          <a href="/auth/sign-up" style={{ color: "var(--gold)", textDecoration: "underline" }}>
            Sign up free
          </a>{" "}
          to save your pantry and personalise results.
        </p>
          </div>{/* end hero-left */}

          {/* ── Right: live ingredient game (desktop only) ── */}
          <div className="hero-right" aria-hidden="true">
            <HeroStage />
          </div>
        </div>{/* end hero-grid */}
      </div>
    </section>
  );
}

"use client";

/**
 * /budget — Budget Mode
 *
 * Plus gated. User enters a KES budget, we call POST /v1/budget/suggest/
 * and show dishes under that budget. Optionally combines with their pantry.
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBudgetSuggestions, getSubscription, getPantry, type BudgetResult } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const BUDGET_PRESETS = [100, 200, 300, 500, 800, 1000];

export default function BudgetPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isPlus,    setIsPlus]    = useState<boolean | null>(null);
  const [budget,    setBudget]    = useState("300");
  const [usePantry, setUsePantry] = useState(true);
  const [results,   setResults]   = useState<BudgetResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSubscription()
      .then((s) => setIsPlus(s.plan_code === "plus"))
      .catch(() => setIsPlus(false));
  }, [isAuthenticated]);

  async function handleSearch(e?: FormEvent) {
    e?.preventDefault();
    const kes = parseInt(budget);
    if (!kes || kes < 10) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      let pantryNames: string[] = [];
      if (usePantry && isAuthenticated) {
        const items = await getPantry();
        pantryNames = items.map((i) => i.display_name);
      }
      const res = await getBudgetSuggestions(kes, pantryNames.length > 0 ? pantryNames : undefined);
      setResults(res);
    } catch {
      setError("Couldn't fetch budget suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isLoading || !isAuthenticated) return null;

  // Plus gate
  if (isPlus === false) {
    return (
      <div className="bg-gate">
        <div className="bg-gate-inner">
          <span className="bg-gate-icon">💰</span>
          <h1 className="bg-gate-title">Budget Mode</h1>
          <p className="bg-gate-sub">
            Tell us your budget in KES and we'll show you every dish you can cook within it.
            Uses engine cost estimates so you know roughly what to spend.
          </p>
          <div className="bg-gate-features">
            {["Set any KES budget", "Combined with your pantry", "Cost estimates on every result", "No surprises at the market"].map((f) => (
              <div key={f} className="bg-gate-feat">✓ {f}</div>
            ))}
          </div>
          <Link href="/plus" className="btn bg-gate-btn">Upgrade to Plus — KES 199/month</Link>
          <p className="bg-gate-note">M-Pesa accepted. Cancel any time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page">

      {/* ── Header ── */}
      <section className="bg-hero">
        <div className="wrap">
          <div className="bg-plus-badge">✦ Plus</div>
          <h1 className="bg-title">Budget Mode</h1>
          <p className="bg-sub">
            Enter your budget and we'll show you every dish you can cook within it.
            Cost estimates from our recipe engine.
          </p>
        </div>
      </section>

      <div className="wrap bg-body">

        {/* ── Search form ── */}
        <form className="bg-form" onSubmit={handleSearch}>
          <div className="bg-form-inner">
            <div className="bg-input-group">
              <label className="bg-label" htmlFor="budget-input">
                Your budget
              </label>
              <div className="bg-input-wrap">
                <span className="bg-currency">KES</span>
                <input
                  id="budget-input"
                  className="bg-input"
                  type="number"
                  min="10"
                  max="100000"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="300"
                />
              </div>
              <div className="bg-presets">
                {BUDGET_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cn("bg-preset", parseInt(budget) === p && "bg-preset-on")}
                    onClick={() => setBudget(String(p))}
                  >
                    KES {p}
                  </button>
                ))}
              </div>
            </div>

            <label className="bg-toggle">
              <input
                type="checkbox"
                checked={usePantry}
                onChange={(e) => setUsePantry(e.target.checked)}
              />
              <span>Use my pantry ingredients</span>
            </label>

            <button className="btn bg-search-btn" type="submit" disabled={loading || !budget}>
              {loading ? "Searching…" : "Find dishes"}
            </button>
          </div>
        </form>

        {/* ── Results ── */}
        {error && <p className="bg-error">{error}</p>}

        {loading && (
          <div className="bg-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-card bg-card-sk" />
            ))}
          </div>
        )}

        {!loading && searched && results && results.dishes.length === 0 && (
          <div className="bg-empty">
            <p className="bg-empty-title">No dishes found under KES {results.budget_kes}</p>
            <p className="bg-empty-sub">Try a higher budget, or add more pantry ingredients to reduce costs.</p>
          </div>
        )}

        {!loading && results && results.dishes.length > 0 && (
          <>
            <p className="bg-results-label">
              {results.dishes.length} dish{results.dishes.length === 1 ? "" : "es"} under KES {results.budget_kes}
            </p>
            <div className="bg-grid">
              {results.dishes.map((dish) => (
                <Link key={dish.dish_slug} href={`/dishes/${dish.dish_slug}`} className="bg-card">
                  <div className="bg-card-img" aria-hidden="true">
                    <svg viewBox="0 0 160 120" fill="none">
                      <circle cx="110" cy="40" r="50" fill="rgba(209,174,95,.1)"/>
                      <circle cx="30"  cy="95" r="30" fill="rgba(37,66,58,.1)"/>
                    </svg>
                    <span className="bg-card-emoji">🍽</span>
                  </div>
                  <div className="bg-card-body">
                    <h3 className="bg-card-name">{dish.name_en}</h3>
                    {dish.name_sw && dish.name_sw !== dish.name_en && (
                      <p className="bg-card-sw">{dish.name_sw}</p>
                    )}
                    <div className="bg-card-cost">
                      <span className="bg-card-price">KES {dish.cost_estimate_kes}</span>
                      <span className="bg-card-estimate">estimate</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <p className="bg-disclaimer">
              Cost estimates are for guidance only. Actual prices vary by market and season.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

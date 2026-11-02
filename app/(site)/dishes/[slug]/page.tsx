"use client";

/**
 * Dish Detail page — /dishes/[slug]
 *
 * Fetches full dish data from GET /v1/dishes/[slug]/ and renders:
 *   - Hero: name, Swahili name, region, diet tags, cost estimate
 *   - Ingredients: required + optional
 *   - Steps: numbered cooking instructions
 *   - Cook mode: full-screen step-by-step with wake lock
 *   - Pairings: side dishes, drinks, desserts with strength dots
 *   - Substitutions: ingredient swap table with grade badges
 *   - Nutrition: estimates table (visible to all for v1)
 *   - Allergen disclaimer (always)
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchDish, type DishDetail } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function StrengthDots({ n }: { n: number }) {
  return (
    <span className="dd-dots" aria-label={`Strength ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("dd-dot", i <= n && "dd-dot-on")} />
      ))}
    </span>
  );
}

function PairingTypeLabel({ type }: { type: string }) {
  const map: Record<string, string> = {
    side: "Side", drink: "Drink", dessert: "Dessert",
    starter: "Starter", flavour: "Flavour",
  };
  return <span className="dd-pairing-type">{map[type] ?? type}</span>;
}

function SubGrade({ grade }: { grade?: string }) {
  if (!grade) return null;
  const cls =
    grade === "Great" ? "dd-grade-great"
    : grade === "OK" ? "dd-grade-ok"
    : "dd-grade-emergency";
  return <span className={cn("dd-grade", cls)}>{grade}</span>;
}

// ── Cook mode ─────────────────────────────────────────────────────────────────

function CookMode({
  steps,
  dishName,
  onClose,
}: {
  steps: DishDetail["steps"];
  dishName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const total = steps.length;

  // Wake lock — keep screen on while cooking
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator.wakeLock as WakeLock).request("screen")
        .then((s) => { sentinel = s; })
        .catch(() => {});
    }
    return () => { sentinel?.release().catch(() => {}); };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setStep((s) => Math.min(s + 1, total - 1));
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setStep((s) => Math.max(s - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [total, onClose]);

  return (
    <div className="cm-overlay" role="dialog" aria-modal="true" aria-label={`Cook mode: ${dishName}`}>
      <div className="cm-inner">
        {/* Header */}
        <div className="cm-top">
          <span className="cm-dish">{dishName}</span>
          <div className="cm-progress-bar" aria-hidden="true">
            <div className="cm-progress-fill" style={{ width: `${((step + 1) / total) * 100}%` }} />
          </div>
          <span className="cm-count">{step + 1} / {total}</span>
          <button className="cm-close" onClick={onClose} aria-label="Exit cook mode">✕</button>
        </div>

        {/* Step */}
        <div className="cm-body">
          <p className="cm-step-num">Step {current.step}</p>
          <p className="cm-step-text">{current.instruction}</p>
        </div>

        {/* Navigation */}
        <div className="cm-nav">
          <button
            className={cn("cm-btn", step === 0 && "cm-btn-dim")}
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            aria-label="Previous step"
          >
            ← Prev
          </button>
          {step < total - 1 ? (
            <button
              className="cm-btn cm-btn-primary"
              onClick={() => setStep((s) => s + 1)}
              aria-label="Next step"
            >
              Next →
            </button>
          ) : (
            <button className="cm-btn cm-btn-done" onClick={onClose}>
              Done ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="dd-skeleton">
      <div className="dd-sk-hero" />
      <div className="wrap dd-sk-body">
        <div className="dd-sk-line" style={{ width: "35%", height: "2.5rem" }} />
        <div className="dd-sk-line" style={{ width: "20%", height: "1.2rem", marginTop: ".5rem" }} />
        <div className="dd-sk-line" style={{ width: "100%", height: "1rem", marginTop: "2rem" }} />
        <div className="dd-sk-line" style={{ width: "90%", height: "1rem", marginTop: ".5rem" }} />
        <div className="dd-sk-line" style={{ width: "75%", height: "1rem", marginTop: ".5rem" }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DishPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const [dish, setDish] = useState<DishDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookMode, setCookMode] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchDish(slug)
      .then(setDish)
      .catch((e) => setError(e?.message ?? "Failed to load dish"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;

  if (error || !dish) {
    return (
      <div className="dd-error">
        <div className="wrap">
          <h1>Dish not found</h1>
          <p>{error ?? "We couldn't find that dish."}</p>
          <Link href="/cook" className="btn">← Back to Cook</Link>
        </div>
      </div>
    );
  }

  const prepCook =
    dish.prep_min && dish.cook_min
      ? `${dish.prep_min + dish.cook_min} min`
      : dish.cook_min
        ? `${dish.cook_min} min`
        : null;

  return (
    <>
      {/* Cook mode overlay */}
      {cookMode && dish.steps.length > 0 && (
        <CookMode
          steps={dish.steps}
          dishName={dish.name_en}
          onClose={() => setCookMode(false)}
        />
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="dd-hero">
        {/* Placeholder image */}
        <div className="dd-hero-img" aria-hidden="true">
          <svg viewBox="0 0 1200 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <rect width="1200" height="480" fill="#1B3029" />
            <path d="M300 280 Q600 360 900 280" stroke="#D1AE5F" strokeWidth="3" fill="none" opacity=".5" />
            <ellipse cx="600" cy="275" rx="200" ry="22" stroke="#D1AE5F" strokeWidth="2" fill="none" opacity=".35" />
            <path d="M500 255 Q495 225 500 195" stroke="#D1AE5F" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".4" />
            <path d="M600 248 Q595 216 600 185" stroke="#D1AE5F" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".4" />
            <path d="M700 255 Q695 225 700 195" stroke="#D1AE5F" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".4" />
          </svg>
        </div>

        <div className="dd-hero-overlay">
          <div className="wrap">
            {/* Breadcrumb */}
            <nav className="dd-breadcrumb" aria-label="Breadcrumb">
              <Link href="/cook">Cook</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{dish.name_en}</span>
            </nav>

            <h1 className="dd-name">{dish.name_en}</h1>
            {dish.name_sw && dish.name_sw !== dish.name_en && (
              <p className="dd-name-sw">{dish.name_sw}</p>
            )}

            {/* Meta row */}
            <div className="dd-meta">
              {dish.regions.length > 0 && (
                <Link href={`/regions/${dish.regions[0]}`} className="dd-region-tag">
                  📍 {dish.regions[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              )}
              {dish.meal_type && <span className="dd-meta-chip">{dish.meal_type}</span>}
              {dish.course     && <span className="dd-meta-chip">{dish.course}</span>}
              {prepCook        && <span className="dd-meta-chip">⏱ {prepCook}</span>}
              {dish.servings   && <span className="dd-meta-chip">🍽 {dish.servings} servings</span>}
              {dish.difficulty && <span className="dd-meta-chip">{dish.difficulty}</span>}
            </div>

            {/* Diet tags */}
            {dish.dietary_tags.length > 0 && (
              <div className="dd-diet-tags">
                {dish.dietary_tags.map((tag) => (
                  <span key={tag.slug} className="dd-diet-tag">{tag.name}</span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="dd-actions">
              {dish.steps.length > 0 && (
                <button
                  className="btn dd-cook-btn"
                  onClick={() => setCookMode(true)}
                >
                  🍳 Cook mode
                </button>
              )}
              <button
                className="btn btn-out dd-save-btn"
                onClick={() => setSavedMsg("Sign in to save recipes.")}
                aria-label="Save recipe"
              >
                ♡ Save recipe
              </button>
            </div>
            {savedMsg && <p className="dd-save-msg">{savedMsg} <Link href="/auth/sign-in">Sign in →</Link></p>}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="dd-body">
        <div className="wrap">
          <div className="dd-layout">

            {/* ── Main column ── */}
            <div className="dd-main">

              {/* Description */}
              {dish.description && (
                <p className="dd-desc">{dish.description}</p>
              )}

              {/* Cost estimate */}
              {dish.cost_estimate_kes != null && (
                <p className="dd-cost">
                  <span>Cost estimate</span>
                  <strong>KES {dish.cost_estimate_kes}</strong>
                  <span className="dd-estimate-tag">Estimate</span>
                </p>
              )}

              {/* ── Ingredients ── */}
              <section className="dd-section" aria-labelledby="dd-ing-title">
                <h2 id="dd-ing-title" className="dd-section-title">Ingredients</h2>

                {/* Required */}
                {dish.ingredients.filter((i) => i.role === "required").length > 0 && (
                  <>
                    <h3 className="dd-ing-group">Required</h3>
                    <ul className="dd-ing-list">
                      {dish.ingredients
                        .filter((i) => i.role === "required")
                        .map((ing) => (
                          <li key={ing.slug} className="dd-ing-item">
                            <span className="dd-ing-name">{ing.name_en}</span>
                            {ing.name_sw && ing.name_sw !== ing.name_en && (
                              <span className="dd-ing-sw">{ing.name_sw}</span>
                            )}
                            {ing.preparation_note && (
                              <span className="dd-ing-note">{ing.preparation_note}</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </>
                )}

                {/* Optional */}
                {dish.ingredients.filter((i) => i.role !== "required").length > 0 && (
                  <>
                    <h3 className="dd-ing-group">Optional / garnish</h3>
                    <ul className="dd-ing-list dd-ing-optional">
                      {dish.ingredients
                        .filter((i) => i.role !== "required")
                        .map((ing) => (
                          <li key={ing.slug} className="dd-ing-item">
                            <span className="dd-ing-name">{ing.name_en}</span>
                            {ing.preparation_note && (
                              <span className="dd-ing-note">{ing.preparation_note}</span>
                            )}
                          </li>
                        ))}
                    </ul>
                  </>
                )}
              </section>

              {/* ── Steps ── */}
              {dish.steps.length > 0 && (
                <section className="dd-section" aria-labelledby="dd-steps-title">
                  <h2 id="dd-steps-title" className="dd-section-title">
                    How to cook
                    {dish.steps.length > 0 && (
                      <button
                        className="dd-cookmode-inline"
                        onClick={() => setCookMode(true)}
                      >
                        Enter cook mode →
                      </button>
                    )}
                  </h2>
                  <ol className="dd-steps">
                    {dish.steps.map((s) => (
                      <li key={s.step} className="dd-step">
                        <span className="dd-step-num">{s.step}</span>
                        <p className="dd-step-text">{s.instruction}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* ── Pairings ── */}
              {dish.pairings && dish.pairings.length > 0 && (
                <section className="dd-section" aria-labelledby="dd-pair-title">
                  <h2 id="dd-pair-title" className="dd-section-title">Pairs well with</h2>
                  <div className="dd-pairings">
                    {dish.pairings.map((p) => (
                      <div key={p.id} className="dd-pairing-card">
                        <div className="dd-pairing-top">
                          <PairingTypeLabel type={p.pairing_type} />
                          <StrengthDots n={p.strength} />
                        </div>
                        <p className="dd-pairing-name">
                          {p.paired_dish_slug ? (
                            <Link href={`/dishes/${p.paired_dish_slug}`}>
                              {p.paired_label || p.paired_dish_name}
                            </Link>
                          ) : (
                            p.paired_label
                          )}
                        </p>
                        {p.note && <p className="dd-pairing-note">{p.note}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="dd-aside">

              {/* Nutrition */}
              {dish.nutrition_per_serving && Object.keys(dish.nutrition_per_serving).length > 0 && (
                <div className="dd-card dd-nutrition">
                  <div className="dd-card-header">
                    <h3>Nutrition</h3>
                    <span className="dd-estimate-tag">Estimate per serving</span>
                  </div>
                  <dl className="dd-nutr-list">
                    {Object.entries(dish.nutrition_per_serving as Record<string, number>).map(([k, v]) => (
                      <div key={k} className="dd-nutr-row">
                        <dt>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</dt>
                        <dd>{typeof v === "number" ? v.toFixed(1) : v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Quick info card */}
              <div className="dd-card dd-info-card">
                <h3>Quick info</h3>
                <dl className="dd-info-list">
                  {dish.meal_type  && <><dt>Meal type</dt><dd>{dish.meal_type}</dd></>}
                  {dish.course     && <><dt>Course</dt><dd>{dish.course}</dd></>}
                  {dish.difficulty && <><dt>Difficulty</dt><dd>{dish.difficulty}</dd></>}
                  {dish.spice_level && <><dt>Spice</dt><dd>{dish.spice_level}</dd></>}
                  {dish.prep_min   && <><dt>Prep</dt><dd>{dish.prep_min} min</dd></>}
                  {dish.cook_min   && <><dt>Cook</dt><dd>{dish.cook_min} min</dd></>}
                  {dish.servings   && <><dt>Serves</dt><dd>{dish.servings}</dd></>}
                  <dt>Quality</dt>
                  <dd className="dd-quality">{dish.quality_level}</dd>
                </dl>
              </div>

              {/* Allergen disclaimer */}
              <p className="dd-allergen">
                Allergen information is for guidance only. Always confirm with the kitchen before ordering.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

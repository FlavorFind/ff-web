"use client";

/**
 * /community — Recipe submission wizard
 *
 * Multi-step form: name → description → ingredients → steps → region → review → submit
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSubmission, getSubmissions, fetchRegions, type Submission, type Region } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_LABELS = [
  "Name", "Description", "Ingredients", "Steps", "Region", "Review"
];

export default function CommunityPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [step,         setStep]         = useState<Step>(1);

  // Guard: redirect to sign-in if user tries to actually submit without being authenticated
  function requireAuth() {
    if (!isAuthenticated) { router.push("/auth/sign-in"); return false; }
    return true;
  }
  const [nameEn,       setNameEn]       = useState("");
  const [nameSw,       setNameSw]       = useState("");
  const [description,  setDescription]  = useState("");
  const [ingredients,  setIngredients]  = useState("");
  const [steps,        setSteps]        = useState("");
  const [regionSlug,   setRegionSlug]   = useState("");
  const [regions,      setRegions]      = useState<Region[]>([]);
  const [submissions,  setSubmissions]  = useState<Submission[] | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState<Submission | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [viewTab,      setViewTab]      = useState<"submit" | "mine">("submit");

  useEffect(() => {
    fetchRegions().then((r) => setRegions(r.results)).catch(() => {});
    if (isAuthenticated) {
      getSubmissions().then(setSubmissions).catch(() => setSubmissions([]));
    }
  }, [isAuthenticated]);
  const canProceed = (): boolean => {
    switch (step) {
      case 1: return nameEn.trim().length >= 2;
      case 2: return description.trim().length >= 20;
      case 3: return ingredients.trim().split("\n").filter(Boolean).length >= 2;
      case 4: return steps.trim().split("\n").filter(Boolean).length >= 2;
      case 5: return true; // region optional
      case 6: return true;
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 6) { setStep((s) => (s + 1) as Step); return; }
    if (!requireAuth()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createSubmission({
        dish_name_en: nameEn.trim(),
        dish_name_sw: nameSw.trim() || undefined,
        description:  description.trim(),
        ingredients:  ingredients.trim(),
        steps:        steps.trim(),
        region_slug:  regionSlug || undefined,
      });
      setSubmitted(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="cw-page">

      {/* ── Hero ── */}
      <section className="cw-hero">
        <div className="wrap">
          <h1 className="cw-title">Share a Recipe</h1>
          <p className="cw-sub">
            Every dish in our engine started as someone's kitchen knowledge.
            Submit a Kenyan or East African recipe and we'll review it for the database.
          </p>
        </div>
      </section>

      <div className="wrap cw-body">

        {/* ── Tabs ── */}
        {isAuthenticated && (
          <div className="cw-tabs">
            <button
              type="button"
              className={cn("cw-tab", viewTab === "submit" && "cw-tab-on")}
              onClick={() => setViewTab("submit")}
            >
              Submit a recipe
            </button>
            <button
              type="button"
              className={cn("cw-tab", viewTab === "mine" && "cw-tab-on")}
              onClick={() => setViewTab("mine")}
            >
              My submissions {submissions ? `(${submissions.length})` : ""}
            </button>
          </div>
        )}

        {/* ── My submissions ── */}
        {viewTab === "mine" && isAuthenticated && (
          <div className="cw-submissions">
            {submissions === null ? (
              <div className="cw-sk-list">
                {Array.from({ length: 3 }, (_, i) => <div key={i} className="cw-sk-item" />)}
              </div>
            ) : submissions.length === 0 ? (
              <div className="cw-sub-empty">
                <p>No submissions yet.</p>
                <button className="btn" type="button" onClick={() => setViewTab("submit")}>Submit your first recipe →</button>
              </div>
            ) : (
              <div className="cw-sub-list">
                {submissions.map((s) => (
                  <div key={s.id} className="cw-sub-row">
                    <div className="cw-sub-row-body">
                      <p className="cw-sub-name">{s.dish_name_en}</p>
                      {s.dish_name_sw && <p className="cw-sub-sw">{s.dish_name_sw}</p>}
                      <p className="cw-sub-date">
                        Submitted {new Date(s.submitted_at).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={cn("cw-sub-status", `cw-sub-status-${s.status}`)}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Submission form ── */}
        {(viewTab === "submit" || !isAuthenticated) && (
          <>
            {!isAuthenticated && (
              <div className="cw-auth-note">
                <p>
                  <Link href="/auth/sign-in">Sign in</Link> or{" "}
                  <Link href="/auth/sign-up">create a free account</Link> to submit a recipe.
                </p>
              </div>
            )}

            {isAuthenticated && !submitted && (
              <>
                {/* Step indicator */}
                <div className="cw-steps-indicator" aria-label="Submission steps">
                  {STEP_LABELS.map((label, i) => (
                    <div
                      key={label}
                      className={cn(
                        "cw-step-dot",
                        i + 1 === step && "cw-step-dot-active",
                        i + 1 < step  && "cw-step-dot-done",
                      )}
                    >
                      <span className="cw-step-num">{i + 1 < step ? "✓" : i + 1}</span>
                      <span className="cw-step-label">{label}</span>
                    </div>
                  ))}
                </div>

                <form className="cw-form" onSubmit={handleSubmit}>
                  {step === 1 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">What's the dish called?</h2>
                      <div className="cw-field">
                        <label htmlFor="cm-name-en">Name in English <span className="cw-required">*</span></label>
                        <input id="cm-name-en" className="cw-input" type="text" value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Pilau Rice" required />
                      </div>
                      <div className="cw-field">
                        <label htmlFor="cm-name-sw">Name in Swahili <span className="cw-optional">(optional)</span></label>
                        <input id="cm-name-sw" className="cw-input" type="text" value={nameSw}
                          onChange={(e) => setNameSw(e.target.value)} placeholder="e.g. Pilau" />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">Describe the dish</h2>
                      <p className="cw-step-sub">What is it? Where is it from? When do you eat it?</p>
                      <div className="cw-field">
                        <label htmlFor="cm-desc">Description <span className="cw-required">*</span></label>
                        <textarea id="cm-desc" className="cw-textarea" rows={5} value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Pilau is a spiced rice dish popular along the Kenyan coast..." />
                        <p className="cw-field-hint">{description.length} characters (minimum 20)</p>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">List the ingredients</h2>
                      <p className="cw-step-sub">One ingredient per line, with quantity and preparation if known.</p>
                      <div className="cw-field">
                        <label htmlFor="cm-ings">Ingredients <span className="cw-required">*</span></label>
                        <textarea id="cm-ings" className="cw-textarea cw-textarea-tall" rows={10} value={ingredients}
                          onChange={(e) => setIngredients(e.target.value)}
                          placeholder={"2 cups rice\n500g beef, cubed\n1 tsp cumin seeds\n..."} />
                        <p className="cw-field-hint">{ingredients.trim().split("\n").filter(Boolean).length} ingredients</p>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">Cooking steps</h2>
                      <p className="cw-step-sub">One step per line. Be specific — what temperature, how long, what to look for.</p>
                      <div className="cw-field">
                        <label htmlFor="cm-steps">Steps <span className="cw-required">*</span></label>
                        <textarea id="cm-steps" className="cw-textarea cw-textarea-tall" rows={10} value={steps}
                          onChange={(e) => setSteps(e.target.value)}
                          placeholder={"Heat oil in a pot over medium heat\nFry the onions until golden\n..."} />
                        <p className="cw-field-hint">{steps.trim().split("\n").filter(Boolean).length} steps</p>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">Where is this dish from?</h2>
                      <p className="cw-step-sub">Linking to a region helps people discover dishes from their county.</p>
                      <div className="cw-field">
                        <label htmlFor="cm-region">County or region <span className="cw-optional">(optional)</span></label>
                        <select id="cm-region" className="cw-select" value={regionSlug} onChange={(e) => setRegionSlug(e.target.value)}>
                          <option value="">No specific region</option>
                          {regions.map((r) => (
                            <option key={r.id} value={r.slug}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="cw-form-step">
                      <h2 className="cw-step-title">Review your submission</h2>
                      <div className="cw-review">
                        <div className="cw-review-row"><span className="cw-review-label">Name</span><span>{nameEn}{nameSw ? ` / ${nameSw}` : ""}</span></div>
                        <div className="cw-review-row cw-review-col"><span className="cw-review-label">Description</span><p>{description}</p></div>
                        <div className="cw-review-row cw-review-col"><span className="cw-review-label">Ingredients</span><pre className="cw-review-pre">{ingredients}</pre></div>
                        <div className="cw-review-row cw-review-col"><span className="cw-review-label">Steps</span><pre className="cw-review-pre">{steps}</pre></div>
                        {regionSlug && <div className="cw-review-row"><span className="cw-review-label">Region</span><span>{regionSlug}</span></div>}
                      </div>
                    </div>
                  )}

                  {error && <p className="cw-error">{error}</p>}

                  <div className="cw-form-nav">
                    {step > 1 && (
                      <button type="button" className="btn btn-out cw-back-btn" onClick={() => setStep((s) => (s - 1) as Step)}>
                        ← Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn cw-next-btn"
                      disabled={!canProceed() || submitting}
                    >
                      {step === 6 ? (submitting ? "Submitting…" : "Submit recipe") : "Next →"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {submitted && (
              <div className="cw-success">
                <div className="cw-success-icon">✓</div>
                <h2 className="cw-success-title">Recipe submitted!</h2>
                <p className="cw-success-sub">
                  Thanks for contributing <strong>{submitted.dish_name_en}</strong> to Flavor Find.
                  Our team will review it and add it to the engine if it passes our data standards.
                </p>
                <div className="cw-success-actions">
                  <button className="btn btn-out" type="button" onClick={() => {
                    setSubmitted(null); setStep(1); setNameEn(""); setNameSw(""); setDescription(""); setIngredients(""); setSteps(""); setRegionSlug("");
                  }}>
                    Submit another
                  </button>
                  <Link href="/cook" className="btn">Back to cooking →</Link>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

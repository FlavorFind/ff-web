"use client";

/**
 * /plus — Flavor Find Plus subscription page
 *
 * Shows Free vs Plus comparison, feature bullets, and the M-Pesa checkout flow.
 * POST /v1/subscribe/ triggers an STK push to the user's phone.
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { subscribe, getSubscription, type Subscription } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const FEATURES: Array<{ label: string; free: boolean | string; plus: boolean | string }> = [
  { label: "Recipe search",            free: "Unlimited",        plus: "Unlimited" },
  { label: "Dish pages",               free: true,               plus: true },
  { label: "47 Counties stories",      free: true,               plus: true },
  { label: "Pantry",                   free: true,               plus: true },
  { label: "Save recipes",             free: "Up to 20",         plus: "Unlimited" },
  { label: "Community submissions",    free: true,               plus: true },
  { label: "Meal plans",               free: false,              plus: true },
  { label: "Shopping lists",           free: false,              plus: true },
  { label: "Budget mode",              free: false,              plus: true },
  { label: "Nutrition details",        free: false,              plus: true },
  { label: "Offline access",           free: false,              plus: true },
  { label: "Ads",                      free: "Yes",              plus: "None" },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="rgba(209,174,95,.2)"/>
      <path d="M5 9l3 3 5-5" stroke="#D1AE5F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function Cross() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="rgba(255,255,255,.06)"/>
      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  );
}

function FeatureCell({ val }: { val: boolean | string }) {
  if (val === true)  return <td className="plus-ft-cell plus-ft-yes"><Check /></td>;
  if (val === false) return <td className="plus-ft-cell plus-ft-no"><Cross /></td>;
  return <td className="plus-ft-cell plus-ft-text">{val}</td>;
}

export default function PlusPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [phone,     setPhone]     = useState("");
  const [step,      setStep]      = useState<"idle" | "confirm" | "polling" | "success" | "error">("idle");
  const [errMsg,    setErrMsg]    = useState("");
  const [checkoutId, setCheckoutId] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      getSubscription()
        .then(setSubscription)
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const isAlreadyPlus = subscription?.plan_code === "plus" && subscription?.status === "active";

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setStep("polling");
    setErrMsg("");
    try {
      const res = await subscribe(phone.trim().replace(/\s+/g, ""));
      setCheckoutId(res.checkout_request_id);
      setStep("success");
    } catch (err: unknown) {
      setErrMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setStep("error");
    }
  }

  return (
    <div className="plus-page">

      {/* ── Hero ── */}
      <section className="plus-hero">
        <div className="wrap">
          <p className="plus-eyebrow">Flavor Find Plus</p>
          <h1 className="plus-title">Cook smarter, every week.</h1>
          <p className="plus-sub">
            Meal plans that write themselves, shopping lists generated automatically,
            budget mode, offline access, and no ads. All for less than a cup of chai a week.
          </p>
          <div className="plus-price-pill">
            <span className="plus-price-amount">KES 199</span>
            <span className="plus-price-period">/month</span>
          </div>
          <p className="plus-price-note">M-Pesa accepted · Cancel any time · No credit card</p>
        </div>
      </section>

      <div className="wrap plus-body">

        {/* ── Feature comparison table ── */}
        <section className="plus-compare-section">
          <h2 className="plus-section-title">Everything you get</h2>
          <div className="plus-table-wrap">
            <table className="plus-table" aria-label="Free vs Plus feature comparison">
              <thead>
                <tr>
                  <th className="plus-th-feature">Feature</th>
                  <th className="plus-th-free">Free</th>
                  <th className="plus-th-plus">Plus</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.label} className="plus-tr">
                    <td className="plus-ft-label">{f.label}</td>
                    <FeatureCell val={f.free} />
                    <FeatureCell val={f.plus} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Feature highlights ── */}
        <section className="plus-features-section">
          {[
            {
              icon: "📅",
              title: "Meal plans that plan themselves",
              body: "Set your week, pick your slots. Your pantry and saved recipes become the building blocks. Generate a shopping list in one tap.",
            },
            {
              icon: "💰",
              title: "Budget mode",
              body: "Enter your budget in KES and instantly see every dish you can cook within it. Engine cost estimates so there are no surprises at the market.",
            },
            {
              icon: "📊",
              title: "Nutrition on every dish",
              body: "Calories, protein, carbs, fat — all on every dish page. Estimates from the engine, clearly labelled so you know they're guides not gospel.",
            },
            {
              icon: "📶",
              title: "Offline access",
              body: "Sync your pantry, saved recipes, and meal plan. Cook your favourite dishes even when the data signal drops. Works via PWA.",
            },
          ].map((feat) => (
            <div key={feat.title} className="plus-feat-card">
              <span className="plus-feat-icon">{feat.icon}</span>
              <div className="plus-feat-body">
                <h3 className="plus-feat-title">{feat.title}</h3>
                <p className="plus-feat-desc">{feat.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Subscribe / CTA ── */}
        <section className="plus-subscribe-section" id="subscribe">
          {isAlreadyPlus ? (
            <div className="plus-already">
              <span className="plus-already-badge">✦ You're on Plus</span>
              <h2 className="plus-already-title">You have everything.</h2>
              <p className="plus-already-sub">
                Your Plus subscription is active
                {subscription?.renews_at && ` and renews ${new Date(subscription.renews_at).toLocaleDateString("en-KE", { day:"numeric", month:"long" })}`}.
              </p>
              <Link href="/" className="btn">Go to your dashboard →</Link>
            </div>
          ) : (
            <div className="plus-checkout">
              <div className="plus-checkout-left">
                <h2 className="plus-checkout-title">Get Plus</h2>
                <p className="plus-checkout-sub">
                  Pay with M-Pesa. Enter your Safaricom number and we'll send an STK push.
                  KES 199 is charged monthly.
                </p>
                {!isAuthenticated && (
                  <div className="plus-checkout-auth-note">
                    <Link href="/auth/sign-up" className="plus-checkout-auth-link">Create a free account</Link>
                    {" "}or{" "}
                    <Link href="/auth/sign-in" className="plus-checkout-auth-link">sign in</Link>
                    {" "}to subscribe.
                  </div>
                )}
              </div>

              {isAuthenticated && step !== "success" && (
                <form className="plus-checkout-form" onSubmit={handleSubscribe}>
                  <div className="plus-phone-wrap">
                    <span className="plus-phone-prefix">+254</span>
                    <input
                      className="plus-phone-input"
                      type="tel"
                      placeholder="7XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      pattern="[0-9]{9}"
                      maxLength={9}
                      required
                      disabled={step === "polling"}
                    />
                  </div>
                  {step === "error" && <p className="plus-checkout-error">{errMsg}</p>}
                  <button
                    className="btn plus-checkout-btn"
                    type="submit"
                    disabled={step === "polling" || !phone.trim()}
                  >
                    {step === "polling" ? "Sending STK push…" : "Pay KES 199 via M-Pesa"}
                  </button>
                  <p className="plus-checkout-note">
                    You'll receive an M-Pesa prompt on your phone. Enter your PIN to confirm.
                  </p>
                </form>
              )}

              {step === "success" && (
                <div className="plus-checkout-success">
                  <span className="plus-success-icon">✓</span>
                  <h3 className="plus-success-title">Payment request sent!</h3>
                  <p className="plus-success-sub">
                    Check your phone for the M-Pesa prompt and enter your PIN to complete the payment.
                    Your Plus access activates within a few seconds.
                  </p>
                  <Link href="/" className="btn">Go to my dashboard →</Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── FAQ ── */}
        <section className="plus-faq-section">
          <h2 className="plus-section-title">Common questions</h2>
          <div className="plus-faq-list">
            {[
              ["Can I cancel any time?", "Yes. Cancel any time from Account → Subscription. You keep Plus until the end of your paid month."],
              ["What payment methods are accepted?", "M-Pesa Daraja STK push. Paystack (card) support coming soon."],
              ["Is there a free trial?", "Not currently — but the free tier is fully functional with unlimited search."],
              ["What happens to my data if I downgrade?", "Everything is kept. Saved recipes beyond 20 are retained, you just can't add more until you re-upgrade."],
            ].map(([q, a]) => (
              <details key={q} className="plus-faq-item">
                <summary className="plus-faq-q">{q}</summary>
                <p className="plus-faq-a">{a}</p>
              </details>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

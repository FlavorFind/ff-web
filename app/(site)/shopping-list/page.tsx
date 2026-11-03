"use client";

/**
 * /shopping-list — Auto-generated shopping list from meal plan
 *
 * Plus gated. Reads the current week's meal plan and aggregates
 * unique ingredients into a printable shopping list.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMealPlan, getSubscription } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function getISOWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((+date - +yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function ShoppingListPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [isPlus,   setIsPlus]   = useState<boolean | null>(null);
  const [meals,    setMeals]    = useState<string[]>([]);
  const [checked,  setChecked]  = useState<Set<number>>(new Set());
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSubscription()
      .then((s) => {
        const plus = s.plan_code === "plus";
        setIsPlus(plus);
        if (!plus) { setLoading(false); return; }
        return getMealPlan(getISOWeek(new Date()));
      })
      .then((plan) => {
        if (!plan) return;
        const names = plan.slots
          .filter((s) => s.note)
          .map((s) => s.note)
          .filter(Boolean);
        setMeals(Array.from(new Set(names)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function handlePrint() {
    window.print();
  }

  if (isLoading || !isAuthenticated) return null;

  if (isPlus === false) {
    return (
      <div className="sl-gate">
        <div className="sl-gate-inner">
          <span className="sl-gate-icon">🛒</span>
          <h1 className="sl-gate-title">Shopping List</h1>
          <p className="sl-gate-sub">
            Your meal plan automatically becomes a shopping list.
            Add dishes to your weekly planner and we'll aggregate everything you need to buy.
          </p>
          <Link href="/plus" className="btn sl-gate-btn">Upgrade to Plus — KES 199/month</Link>
          <p className="sl-gate-note">M-Pesa accepted · Cancel any time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-page">

      <section className="sl-hero">
        <div className="wrap">
          <div className="sl-hero-inner">
            <div>
              <div className="sl-plus-badge">✦ Plus</div>
              <h1 className="sl-title">Shopping List</h1>
              <p className="sl-sub">From your meal plan this week</p>
            </div>
            <div className="sl-hero-actions">
              <button className="btn out sl-print-btn" type="button" onClick={handlePrint}>
                Print list
              </button>
              <Link href="/planner" className="btn sl-plan-btn">Edit meal plan →</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap sl-body">
        {loading ? (
          <div className="sl-loading">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="sl-sk-item" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="sl-empty">
            <div className="sl-empty-icon">📋</div>
            <h2 className="sl-empty-title">No meals planned yet</h2>
            <p className="sl-empty-sub">
              Add dishes to your meal planner and they'll appear here as a shopping list.
            </p>
            <Link href="/planner" className="btn">Go to Meal Planner →</Link>
          </div>
        ) : (
          <>
            <div className="sl-progress">
              <span className="sl-progress-text">
                {checked.size} of {meals.length} done
              </span>
              <div className="sl-progress-bar">
                <div
                  className="sl-progress-fill"
                  style={{ width: `${meals.length > 0 ? (checked.size / meals.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <ul className="sl-list">
              {meals.map((meal, i) => (
                <li key={i} className={cn("sl-item", checked.has(i) && "sl-item-done")}>
                  <button
                    type="button"
                    className="sl-check"
                    onClick={() => toggle(i)}
                    aria-pressed={checked.has(i)}
                    aria-label={checked.has(i) ? `Uncheck ${meal}` : `Check ${meal}`}
                  >
                    {checked.has(i) && (
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <span className="sl-item-name">{meal}</span>
                  <Link href={`/dishes/${meal.toLowerCase().replace(/\s+/g, "-")}`} className="sl-item-link">
                    Recipe →
                  </Link>
                </li>
              ))}
            </ul>

            {checked.size === meals.length && meals.length > 0 && (
              <div className="sl-done-banner">
                <span>🎉</span>
                <p>All done! You're ready to cook this week.</p>
                <Link href="/cook" className="btn">Search dishes →</Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

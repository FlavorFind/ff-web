"use client";

/**
 * /planner — Weekly Meal Planner
 *
 * Plus gated. Week grid (Mon–Sun × breakfast/lunch/dinner/snack).
 * Each cell: click to assign a dish from /cook search or type a dish name.
 * Week navigation (prev / next).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMealPlan, updateMealPlan, type WeekPlan, type MealSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const MEALS = ["breakfast","lunch","dinner","snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack",
};
const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎",
};

function getISOWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((+date - +yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function addWeeks(week: string, delta: number): string {
  const [year, wStr] = week.split("-W");
  const jan4 = new Date(+year, 0, 4);
  const startOfWeek = new Date(jan4);
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (parseInt(wStr) - 1) * 7);
  startOfWeek.setDate(startOfWeek.getDate() + delta * 7);
  return getISOWeek(startOfWeek);
}

function weekLabel(week: string): string {
  const [year, wStr] = week.split("-W");
  const jan4 = new Date(+year, 0, 4);
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (parseInt(wStr) - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("en-KE", { day:"numeric", month:"short" })} – ${end.toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" })}`;
}

export default function PlannerPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [week, setWeek] = useState(() => getISOWeek(new Date()));
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlus, setIsPlus] = useState<boolean | null>(null);
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  // Check plus status
  useEffect(() => {
    if (!isAuthenticated) return;
    import("@/lib/api").then(({ getSubscription }) =>
      getSubscription()
        .then((s) => setIsPlus(s.plan_code === "plus"))
        .catch(() => setIsPlus(false))
    );
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || isPlus === false) return;
    setLoading(true);
    getMealPlan(week)
      .then(setPlan)
      .catch(() => setPlan({ week, slots: [] }))
      .finally(() => setLoading(false));
  }, [week, isAuthenticated, isPlus]);

  function getSlot(day: string, meal: string): MealSlot | undefined {
    return plan?.slots.find((s) => s.day === day.toLowerCase() && s.meal_type === meal);
  }

  function cellKey(day: string, meal: string) { return `${day}-${meal}`; }

  async function saveSlot(day: string, meal: string, dishText: string) {
    if (!plan) return;
    setSaving(true);
    const slots = plan.slots.filter((s) => !(s.day === day.toLowerCase() && s.meal_type === meal));
    if (dishText.trim()) {
      slots.push({ day: day.toLowerCase(), meal_type: meal, dish_slug: null, note: dishText.trim() });
    }
    const updated = { ...plan, slots };
    setPlan(updated);
    setEditCell(null);
    try { await updateMealPlan(week, updated); }
    catch { /* keep optimistic */ }
    finally { setSaving(false); }
  }

  if (isLoading || !isAuthenticated) return null;

  // Plus gate
  if (isPlus === false) {
    return (
      <div className="pl-gate">
        <div className="pl-gate-inner">
          <span className="pl-gate-icon">📅</span>
          <h1 className="pl-gate-title">Meal Planner</h1>
          <p className="pl-gate-sub">
            Plan your week, generate shopping lists automatically, and never wonder "what's for dinner?" again.
            Available on Plus.
          </p>
          <Link href="/plus" className="btn pl-gate-btn">Upgrade to Plus — KES 199/month</Link>
          <p className="pl-gate-note">M-Pesa accepted. Cancel any time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-page">

      {/* ── Header ── */}
      <section className="pl-hero">
        <div className="wrap">
          <div className="pl-hero-inner">
            <div>
              <div className="pl-plus-badge">✦ Plus</div>
              <h1 className="pl-title">Meal Planner</h1>
              <p className="pl-sub">{weekLabel(week)}</p>
            </div>
            <div className="pl-week-nav">
              <button className="pl-week-btn" type="button" onClick={() => setWeek((w) => addWeeks(w, -1))}>
                ← Previous
              </button>
              <button className="pl-week-btn pl-week-btn-today" type="button" onClick={() => setWeek(getISOWeek(new Date()))}>
                This week
              </button>
              <button className="pl-week-btn" type="button" onClick={() => setWeek((w) => addWeeks(w, 1))}>
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap pl-body">
        {loading || isPlus === null ? (
          <div className="pl-loading">
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className="pl-cell-sk" />
            ))}
          </div>
        ) : (
          <div className="pl-grid-wrap">
            {/* Mobile: scrollable */}
            <div className="pl-grid">
              {/* Header row */}
              <div className="pl-grid-corner" />
              {DAYS.map((day) => (
                <div key={day} className="pl-day-header">
                  <span className="pl-day-short">{day.slice(0,3)}</span>
                  <span className="pl-day-full">{day}</span>
                </div>
              ))}

              {/* Meal rows */}
              {MEALS.map((meal) => (
                <>
                  <div key={`label-${meal}`} className="pl-meal-label">
                    <span className="pl-meal-icon">{MEAL_ICONS[meal]}</span>
                    <span>{MEAL_LABELS[meal]}</span>
                  </div>
                  {DAYS.map((day) => {
                    const slot = getSlot(day, meal);
                    const key = cellKey(day, meal);
                    const isEditing = editCell === key;
                    return (
                      <div
                        key={key}
                        className={cn("pl-cell", slot && "pl-cell-filled", isEditing && "pl-cell-editing")}
                        onClick={() => {
                          if (!isEditing) {
                            setEditCell(key);
                            setEditVal(slot?.note ?? "");
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") { setEditCell(key); setEditVal(slot?.note ?? ""); }}}
                        aria-label={`${day} ${MEAL_LABELS[meal]}${slot ? `: ${slot.note}` : " — empty"}`}
                      >
                        {isEditing ? (
                          <div className="pl-cell-edit" onClick={(e) => e.stopPropagation()}>
                            <input
                              className="pl-cell-input"
                              type="text"
                              value={editVal}
                              onChange={(e) => setEditVal(e.target.value)}
                              placeholder="Dish name…"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSlot(day, meal, editVal);
                                if (e.key === "Escape") setEditCell(null);
                              }}
                            />
                            <div className="pl-cell-edit-actions">
                              <button
                                type="button"
                                className="pl-cell-save"
                                onClick={() => saveSlot(day, meal, editVal)}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                className="pl-cell-cancel"
                                onClick={() => setEditCell(null)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : slot ? (
                          <div className="pl-cell-content">
                            <p className="pl-cell-dish">{slot.note}</p>
                            {slot.dish_slug && (
                              <Link
                                href={`/dishes/${slot.dish_slug}`}
                                className="pl-cell-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View recipe
                              </Link>
                            )}
                          </div>
                        ) : (
                          <span className="pl-cell-empty">+ Add</span>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}

        <p className="pl-note">Click any cell to add or edit a meal. Press Enter to save, Escape to cancel.</p>
      </div>
    </div>
  );
}

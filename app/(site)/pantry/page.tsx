"use client";

/**
 * /pantry — Pantry management
 *
 * Authenticated only. Loads GET /v1/pantry/ and lets users:
 *   - View all saved ingredients as chips
 *   - Add new ingredients via the autocomplete search
 *   - Remove individual items
 *   - Clear all
 *   - Jump straight to Cook with pantry pre-loaded
 */

import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPantry,
  addPantryItem,
  removePantryItem,
  autocomplete,
  type PantryItem,
  type IngredientResult,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function uid() { return Math.random().toString(36).slice(2); }

function Skeleton() {
  return (
    <div className="pt-skeleton">
      <div className="pt-sk-bar" />
      <div className="pt-sk-chips">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="pt-sk-chip" style={{ width: `${70 + (i % 4) * 20}px` }} />
        ))}
      </div>
    </div>
  );
}

export default function PantryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [items,    setItems]    = useState<PantryItem[] | null>(null);
  const [query,    setQuery]    = useState("");
  const [suggs,    setSuggs]    = useState<IngredientResult[]>([]);
  const [adding,   setAdding]   = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [acOpen,   setAcOpen]   = useState(false);
  const acTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect guests
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  // Load pantry
  useEffect(() => {
    if (!isAuthenticated) return;
    getPantry().then(setItems).catch(() => setItems([]));
  }, [isAuthenticated]);

  // Autocomplete
  useEffect(() => {
    if (acTimer.current) clearTimeout(acTimer.current);
    if (!query.trim()) { setSuggs([]); setAcOpen(false); return; }
    acTimer.current = setTimeout(() => {
      autocomplete(query, "en", 10)
        .then((r) => { setSuggs(r.results ?? []); setAcOpen(true); })
        .catch(() => {});
    }, 180);
    return () => { if (acTimer.current) clearTimeout(acTimer.current); };
  }, [query]);

  async function handleAdd(nameEn: string) {
    setQuery("");
    setSuggs([]);
    setAcOpen(false);
    if (!nameEn.trim()) return;
    // Optimistic
    const tempId = `tmp-${uid()}`;
    const optimistic: PantryItem = {
      id: tempId, ingredient_id: "", ingredient_slug: "",
      display_name: nameEn, added_at: new Date().toISOString(),
    };
    setAdding(true);
    setItems((prev) => {
      const p = prev ?? [];
      if (p.some((x) => x.display_name.toLowerCase() === nameEn.toLowerCase())) return p;
      return [...p, optimistic];
    });
    try {
      const real = await addPantryItem(nameEn, nameEn);
      setItems((prev) => (prev ?? []).map((x) => x.id === tempId ? real : x));
    } catch {
      setItems((prev) => (prev ?? []).filter((x) => x.id !== tempId));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemoving((p) => new Set([...p, id]));
    setItems((prev) => (prev ?? []).filter((x) => x.id !== id));
    try { await removePantryItem(id); }
    catch { getPantry().then(setItems).catch(() => {}); }
    finally { setRemoving((p) => { const n = new Set(p); n.delete(id); return n; }); }
  }

  async function handleClearAll() {
    if (!items || items.length === 0) return;
    if (!confirm(`Remove all ${items.length} items from your pantry?`)) return;
    const ids = items.map((x) => x.id);
    setItems([]);
    await Promise.allSettled(ids.map(removePantryItem));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) handleAdd(query.trim());
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="pt-page">

      {/* ── Header ── */}
      <section className="pt-hero">
        <div className="wrap">
          <div className="pt-hero-inner">
            <div>
              <h1 className="pt-title">My Pantry</h1>
              <p className="pt-sub">
                Save the ingredients you have at home. We'll use them to personalise your search results.
              </p>
            </div>
            {items && items.length > 0 && (
              <Link href="/cook" className="btn pt-cook-btn">
                Cook from pantry →
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="wrap pt-body">

        {/* ── Add bar ── */}
        <div className="pt-add-section">
          <form className="pt-add-form" onSubmit={handleSubmit} role="search">
            <div className="pt-add-bar-wrap">
              <svg className="pt-add-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                className="pt-add-input"
                type="text"
                placeholder="Add an ingredient — try tomato, unga, nyanya…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggs.length > 0 && setAcOpen(true)}
                autoComplete="off"
                aria-label="Search and add ingredient"
                aria-expanded={acOpen}
                aria-haspopup="listbox"
              />
              <button className="btn pt-add-btn" type="submit" disabled={!query.trim() || adding}>
                Add
              </button>
            </div>

            {/* Autocomplete */}
            {acOpen && suggs.length > 0 && (
              <ul className="pt-ac-drop" role="listbox" aria-label="Ingredient suggestions">
                {suggs.map((s) => (
                  <li key={s.slug}>
                    <button
                      type="button"
                      className="pt-ac-item"
                      role="option"
                      onMouseDown={(e) => { e.preventDefault(); handleAdd(s.name_en); }}
                    >
                      <span className="pt-ac-name">{s.name_en}</span>
                      {s.name_sw && s.name_sw !== s.name_en && (
                        <span className="pt-ac-sw">{s.name_sw}</span>
                      )}
                      {s.is_staple && <span className="pt-ac-staple">staple</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        {/* ── Items ── */}
        {items === null ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="pt-empty">
            <div className="pt-empty-icon" aria-hidden="true">🥕</div>
            <h2 className="pt-empty-title">Your pantry is empty</h2>
            <p className="pt-empty-sub">
              Add ingredients above and we'll personalise your Cook search with what you have.
            </p>
            <button
              className="btn"
              type="button"
              onClick={() => inputRef.current?.focus()}
            >
              Add your first ingredient
            </button>
          </div>
        ) : (
          <div className="pt-items-section">
            <div className="pt-items-header">
              <h2 className="pt-items-title">
                {items.length} ingredient{items.length === 1 ? "" : "s"} saved
              </h2>
              <button className="pt-clear-btn" type="button" onClick={handleClearAll}>
                Clear all
              </button>
            </div>

            <div className="pt-chips">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={cn("pt-chip", removing.has(item.id) && "pt-chip-removing")}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className="pt-chip-name">{item.display_name}</span>
                  <button
                    type="button"
                    className="pt-chip-remove"
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Remove ${item.display_name}`}
                    disabled={removing.has(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Cook CTA */}
            <div className="pt-cook-section">
              <div className="pt-cook-card">
                <div className="pt-cook-card-left">
                  <h3 className="pt-cook-card-title">Ready to cook?</h3>
                  <p className="pt-cook-card-sub">
                    We'll add your {items.length} pantry ingredients to your search automatically.
                  </p>
                </div>
                <Link href="/cook" className="btn">
                  Find dishes →
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

"use client";

/**
 * /saved — Saved recipes, collections, and cook history
 *
 * Three tabs: Saved | Collections | Cook history
 * Auth required.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSaved,
  unsaveRecipe,
  getCollections,
  createCollection,
  getCookHistory,
  type SavedRecipe,
  type Collection,
  type CookEntry,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Tab = "saved" | "collections" | "history";

function RecipeCard({
  recipe,
  onUnsave,
}: {
  recipe: SavedRecipe;
  onUnsave: (id: string) => void;
}) {
  const name = recipe.dish_slug.replace(/-/g, " ");
  return (
    <div className="sv-card">
      <Link href={`/dishes/${recipe.dish_slug}`} className="sv-card-img" aria-label={name}>
        <svg viewBox="0 0 160 120" fill="none" aria-hidden="true">
          <circle cx="110" cy="40" r="50" fill="rgba(209,174,95,.1)"/>
          <circle cx="30"  cy="95" r="30" fill="rgba(37,66,58,.12)"/>
        </svg>
        <span className="sv-card-emoji">🍽</span>
      </Link>
      <div className="sv-card-body">
        <Link href={`/dishes/${recipe.dish_slug}`} className="sv-card-name">
          {name}
        </Link>
        {recipe.note && <p className="sv-card-note">"{recipe.note}"</p>}
        <p className="sv-card-date">
          Saved {new Date(recipe.saved_at).toLocaleDateString("en-KE", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </p>
      </div>
      <button
        className="sv-card-unsave"
        onClick={() => onUnsave(recipe.id)}
        aria-label={`Unsave ${name}`}
        title="Remove from saved"
      >
        ♥
      </button>
    </div>
  );
}

function HistoryCard({ entry }: { entry: CookEntry }) {
  const name = entry.dish_slug.replace(/-/g, " ");
  return (
    <Link href={`/dishes/${entry.dish_slug}`} className="sv-hist-card">
      <div className="sv-hist-icon" aria-hidden="true">✓</div>
      <div className="sv-hist-body">
        <p className="sv-hist-name">{name}</p>
        <p className="sv-hist-date">
          Cooked {new Date(entry.cooked_at).toLocaleDateString("en-KE", {
            day: "numeric", month: "short",
          })}
        </p>
      </div>
      <span className="sv-hist-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export default function SavedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("saved");

  const [saved,       setSaved]       = useState<SavedRecipe[] | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [history,     setHistory]     = useState<CookEntry[] | null>(null);
  const [newColName,  setNewColName]  = useState("");
  const [creating,    setCreating]    = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/sign-in");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    getSaved().then(setSaved).catch(() => setSaved([]));
    getCollections().then(setCollections).catch(() => setCollections([]));
    getCookHistory().then(setHistory).catch(() => setHistory([]));
  }, [isAuthenticated]);

  async function handleUnsave(id: string) {
    setSaved((prev) => (prev ?? []).filter((r) => r.id !== id));
    try { await unsaveRecipe(id); }
    catch { getSaved().then(setSaved).catch(() => {}); }
  }

  async function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newColName.trim()) return;
    setCreating(true);
    try {
      const col = await createCollection(newColName.trim());
      setCollections((prev) => [...(prev ?? []), col]);
      setNewColName("");
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="sv-page">

      {/* ── Header ── */}
      <section className="sv-hero">
        <div className="wrap">
          <h1 className="sv-title">My Library</h1>
          <p className="sv-sub">Your saved recipes, collections, and cooking history.</p>
        </div>
      </section>

      <div className="wrap sv-body">

        {/* ── Tabs ── */}
        <div className="sv-tabs" role="tablist">
          {([
            ["saved",       `Saved${saved ? ` (${saved.length})` : ""}`,       "♥"],
            ["collections", `Collections${collections ? ` (${collections.length})` : ""}`, "⊞"],
            ["history",     `Cooked${history ? ` (${history.length})` : ""}`,  "✓"],
          ] as [Tab, string, string][]).map(([t, label, icon]) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={cn("sv-tab", tab === t && "sv-tab-on")}
              onClick={() => setTab(t)}
            >
              <span className="sv-tab-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ── Saved tab ── */}
        {tab === "saved" && (
          <div className="sv-panel" role="tabpanel">
            {saved === null ? (
              <div className="sv-grid">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="sv-card sv-card-sk" />
                ))}
              </div>
            ) : saved.length === 0 ? (
              <div className="sv-empty">
                <div className="sv-empty-icon">♡</div>
                <h2 className="sv-empty-title">No saved recipes yet</h2>
                <p className="sv-empty-sub">
                  Hit the heart button on any dish to save it here.
                </p>
                <Link href="/cook" className="btn">Find dishes to cook →</Link>
              </div>
            ) : (
              <div className="sv-grid">
                {saved.map((r) => (
                  <RecipeCard key={r.id} recipe={r} onUnsave={handleUnsave} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Collections tab ── */}
        {tab === "collections" && (
          <div className="sv-panel" role="tabpanel">
            <form className="sv-new-col-form" onSubmit={handleCreateCollection}>
              <input
                className="sv-new-col-input"
                type="text"
                placeholder="New collection name…"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                disabled={creating}
              />
              <button className="btn" type="submit" disabled={!newColName.trim() || creating}>
                {creating ? "Creating…" : "Create"}
              </button>
            </form>

            {collections === null ? (
              <div className="sv-col-grid">
                {Array.from({ length: 4 }, (_, i) => <div key={i} className="sv-col-card sv-col-card-sk" />)}
              </div>
            ) : collections.length === 0 ? (
              <div className="sv-empty">
                <div className="sv-empty-icon">⊞</div>
                <h2 className="sv-empty-title">No collections yet</h2>
                <p className="sv-empty-sub">Collections let you organise saved recipes by theme — weeknight dinners, coastal dishes, etc.</p>
              </div>
            ) : (
              <div className="sv-col-grid">
                {collections.map((col) => (
                  <div key={col.id} className="sv-col-card">
                    <div className="sv-col-card-icon" aria-hidden="true">⊞</div>
                    <div className="sv-col-card-body">
                      <p className="sv-col-card-name">{col.name}</p>
                      <p className="sv-col-card-date">
                        Created {new Date(col.created_at).toLocaleDateString("en-KE", {
                          month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {tab === "history" && (
          <div className="sv-panel" role="tabpanel">
            {history === null ? (
              <div className="sv-hist-list">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="sv-hist-card sv-hist-card-sk" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="sv-empty">
                <div className="sv-empty-icon">✓</div>
                <h2 className="sv-empty-title">No cooking history yet</h2>
                <p className="sv-empty-sub">
                  When you mark a dish as cooked on the recipe page, it shows up here.
                </p>
                <Link href="/cook" className="btn">Find something to cook →</Link>
              </div>
            ) : (
              <div className="sv-hist-list">
                {history.map((e) => <HistoryCard key={e.id} entry={e} />)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

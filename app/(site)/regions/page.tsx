"use client";

/**
 * /regions — Taste of 47 Counties
 *
 * Fetches all regions from GET /v1/regions/ and renders:
 *   - Hero with title + subtitle
 *   - Filter pills (county | coast | all)
 *   - Masonry-style grid of region cards
 *   - Each card links to /regions/[slug] and shows story badge if it has one
 */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchRegions, fetchStories, type Region, type Story } from "@/lib/api";
import { cn } from "@/lib/utils";

// Accent palette for cards — cycles through brand-adjacent hues
const CARD_ACCENTS = [
  "#25423A","#1a3d4f","#3a4a2a","#4a3a1a","#2f4a3a",
  "#1f4a5a","#3a2a3a","#4a3a2a","#2a3a2a","#2a4a3a",
];
function accentFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xffff;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

const FILTER_LABELS: Record<string, string> = {
  all: "All regions",
  county: "47 Counties",
  coast: "Coast & neighbours",
  cuisine: "Cuisine regions",
};

function Skeleton() {
  return (
    <div className="rg-grid">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="rg-card rg-card-sk" style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter]   = useState<"all" | "county" | "coast" | "cuisine">("all");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    fetchRegions().then((r) => setRegions(r.results)).catch(() => setRegions([]));
    fetchStories().then(setStories).catch(() => {});
  }, []);

  // Set of region slugs that have editorial stories
  const storySlugs = useMemo(() => {
    const s = new Set<string>();
    stories.forEach((st) => st.region_slug_list?.forEach((slug) => s.add(slug)));
    return s;
  }, [stories]);

  const filtered = useMemo(() => {
    if (!regions) return [];
    let r = regions;
    if (filter !== "all") r = r.filter((x) => x.type === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.slug.includes(q));
    }
    // Counties first, then others
    return [...r].sort((a, b) => {
      if (a.type === "county" && b.type !== "county") return -1;
      if (a.type !== "county" && b.type === "county") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [regions, filter, search]);

  const counts = useMemo(() => {
    if (!regions) return { all: 0, county: 0, coast: 0, cuisine: 0 };
    return {
      all: regions.length,
      county:  regions.filter((r) => r.type === "county").length,
      coast:   regions.filter((r) => r.type === "coast").length,
      cuisine: regions.filter((r) => r.type === "cuisine").length,
    };
  }, [regions]);

  return (
    <div className="rg-page">

      {/* ── Hero ── */}
      <section className="rg-hero">
        <div className="wrap">
          <p className="rg-eyebrow">Flavor Find</p>
          <h1 className="rg-title">Taste of 47 Counties</h1>
          <p className="rg-sub">
            Every county in Kenya has its own table. Explore the dishes, ingredients,
            and food stories that define each corner of the country.
          </p>
        </div>
      </section>

      <div className="wrap rg-body">

        {/* ── Controls ── */}
        <div className="rg-controls">
          <div className="rg-filters" role="group" aria-label="Filter regions">
            {(["all", "county", "coast", "cuisine"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={cn("rg-filter-btn", filter === f && "rg-filter-btn-on")}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {FILTER_LABELS[f]}
                <span className="rg-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="rg-search-wrap">
            <svg className="rg-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              className="rg-search"
              type="search"
              placeholder="Search counties…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search regions"
            />
          </div>
        </div>

        {/* ── Stats bar ── */}
        {regions && (
          <p className="rg-count-line">
            Showing <strong>{filtered.length}</strong> of {counts.all} regions
            {storySlugs.size > 0 && (
              <> · <span className="rg-story-dot" aria-hidden="true">✦</span> {storySlugs.size} with food stories</>
            )}
          </p>
        )}

        {/* ── Grid ── */}
        {regions === null ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="rg-empty">
            <p>No regions match "{search}". Try a different name.</p>
          </div>
        ) : (
          <div className="rg-grid">
            {filtered.map((region, i) => {
              const hasStory = storySlugs.has(region.slug);
              const accent = accentFor(region.slug);
              return (
                <Link
                  key={region.id}
                  href={`/regions/${region.slug}`}
                  className="rg-card"
                  style={{ "--accent": accent, "--i": i } as React.CSSProperties}
                >
                  {/* Decorative background illustration */}
                  <div className="rg-card-bg" aria-hidden="true">
                    <svg viewBox="0 0 160 120" fill="none" className="rg-card-bg-svg">
                      <circle cx="130" cy="30" r="45" fill="rgba(209,174,95,.08)"/>
                      <circle cx="20"  cy="100" r="30" fill="rgba(209,174,95,.05)"/>
                    </svg>
                  </div>

                  <div className="rg-card-top">
                    <div className="rg-card-color-dot" aria-hidden="true" />
                    <span className={cn("rg-card-type", `rg-card-type-${region.type}`)}>
                      {region.type === "county" ? "County" : region.type === "coast" ? "Coast" : "Region"}
                    </span>
                    {hasStory && (
                      <span className="rg-card-story-badge" aria-label="Has food story">✦ Story</span>
                    )}
                  </div>

                  <div className="rg-card-body">
                    <h2 className="rg-card-name">{region.name}</h2>
                    {region.description && (
                      <p className="rg-card-desc">{region.description}</p>
                    )}
                  </div>

                  <div className="rg-card-footer">
                    <span className="rg-card-cta">
                      Explore →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

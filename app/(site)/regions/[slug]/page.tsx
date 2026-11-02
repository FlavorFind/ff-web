"use client";

/**
 * /regions/[slug] — Region / County detail page
 *
 * Fetches the region from GET /v1/regions/ (filtered by slug) and any
 * editorial story attached to it from GET /v1/stories/.
 * Also fetches sample dishes from POST /v1/search/ using the county name.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchRegions,
  fetchStories,
  searchDishes,
  type Region,
  type Story,
  type SearchDish,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function Skeleton() {
  return (
    <div className="rd-skeleton">
      <div className="rd-sk-hero" />
      <div className="rd-sk-body">
        {[1,2,3].map((i) => <div key={i} className="rd-sk-line" style={{ width: `${70 + i*8}%` }} />)}
      </div>
    </div>
  );
}

function DishCard({ dish }: { dish: SearchDish }) {
  const tierLabel = dish.tier === "exact" ? "Cook now" : dish.tier === "can_make" ? "Can make" : "Almost";
  return (
    <Link href={`/dishes/${dish.slug}`} className="rd-dish-card">
      <div className="rd-dish-img" aria-hidden="true">
        <svg viewBox="0 0 100 80" fill="none" aria-hidden="true">
          <circle cx="70" cy="20" r="28" fill="rgba(209,174,95,.12)"/>
          <circle cx="20" cy="65" r="18" fill="rgba(209,174,95,.07)"/>
        </svg>
        <span className="rd-dish-emoji">🍽</span>
      </div>
      <div className="rd-dish-body">
        <span className={cn("rd-dish-tier", `rd-dish-tier-${dish.tier}`)}>{tierLabel}</span>
        <h3 className="rd-dish-name">{dish.name_en}</h3>
        {dish.name_sw && dish.name_sw !== dish.name_en && (
          <p className="rd-dish-sw">{dish.name_sw}</p>
        )}
        <p className="rd-dish-link">View recipe →</p>
      </div>
    </Link>
  );
}

export default function RegionPage() {
  const { slug } = useParams<{ slug: string }>();

  const [region,  setRegion]  = useState<Region | null>(null);
  const [story,   setStory]   = useState<Story | null>(null);
  const [dishes,  setDishes]  = useState<SearchDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      fetchRegions(),
      fetchStories(),
    ]).then(([regRes, storiesRes]) => {
      const found = regRes.results.find((r) => r.slug === slug);
      if (!found) { setError("Region not found."); setLoading(false); return; }
      setRegion(found);

      // Find matching story (story references region slugs in region_slug_list)
      const matchedStory = storiesRes.find((s) =>
        s.region_slug_list?.includes(slug)
      );
      if (matchedStory) setStory(matchedStory);

      // Fetch sample dishes using county name as an ingredient-context search
      return searchDishes([found.name], "explore", 8);
    })
    .then((res) => {
      if (!res) return;
      const all: SearchDish[] = [
        ...(res.results.exact    ?? []),
        ...(res.results.can_make ?? []),
        ...(res.results.almost   ?? []),
      ];
      setDishes(all.slice(0, 8));
    })
    .catch(() => setError("Could not load region data."))
    .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton />;
  if (error || !region) return (
    <div className="rd-error">
      <p>{error ?? "Region not found."}</p>
      <Link href="/regions" className="btn">← All counties</Link>
    </div>
  );

  return (
    <div className="rd-page">

      {/* ── Hero ── */}
      <section className="rd-hero">
        <div className="wrap">
          <nav className="rd-breadcrumb" aria-label="Breadcrumb">
            <Link href="/regions">All counties</Link>
            <span aria-hidden="true">›</span>
            <span>{region.name}</span>
          </nav>
          <div className="rd-hero-inner">
            <div className="rd-hero-left">
              <span className={cn("rd-type-badge", `rd-type-badge-${region.type}`)}>
                {region.type === "county" ? "County" : region.type === "coast" ? "Coast" : "Region"}
              </span>
              <h1 className="rd-title">{region.name}</h1>
              {region.description && (
                <p className="rd-desc">{region.description}</p>
              )}
              <Link href={`/cook?region=${slug}`} className="btn rd-cook-btn">
                Cook from {region.name}
              </Link>
            </div>
            <div className="rd-hero-art" aria-hidden="true">
              <svg viewBox="0 0 280 220" fill="none">
                <circle cx="200" cy="80"  r="90" fill="rgba(209,174,95,.1)"/>
                <circle cx="60"  cy="170" r="55" fill="rgba(37,66,58,.12)"/>
                <circle cx="140" cy="110" r="40" fill="rgba(209,174,95,.06)"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap rd-body">

        {/* ── Editorial story ── */}
        {story && (
          <section className="rd-story-section">
            <div className="rd-story-card">
              <div className="rd-story-meta">
                <span className="rd-story-badge">✦ Food story</span>
                <span className="rd-story-author">By {story.author}</span>
                {story.published_at && (
                  <span className="rd-story-date">
                    {new Date(story.published_at).toLocaleDateString("en-KE", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <h2 className="rd-story-title">{story.title_en}</h2>
              <div className="rd-story-body">
                {story.body_en.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Dishes from this region ── */}
        {dishes.length > 0 && (
          <section className="rd-dishes-section">
            <div className="rd-dishes-head">
              <h2 className="rd-dishes-title">Dishes from {region.name}</h2>
              <Link href={`/cook?region=${slug}`} className="rd-dishes-link">
                Search with your ingredients →
              </Link>
            </div>
            <div className="rd-dishes-grid">
              {dishes.map((d) => <DishCard key={d.dish_id} dish={d} />)}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="rd-cta">
          <h2 className="rd-cta-title">What can you cook from {region.name}?</h2>
          <p className="rd-cta-sub">
            Enter what's in your kitchen and we'll match you to {region.name} dishes you can actually make.
          </p>
          <Link href="/cook" className="btn">Open the Cook page →</Link>
        </section>

      </div>
    </div>
  );
}

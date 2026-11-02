"use client";

import { useEffect, useRef, useState } from "react";
import { Bowl } from "./icons";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { fetchRegions, type Region } from "@/lib/api";
import { COUNTY_COLORS, DEFAULT_COUNTY_COLOR } from "@/lib/data";
import { cl, prefersReducedMotion } from "@/lib/math";
import type { CSSVars } from "@/lib/utils";

export function Counties() {
  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const arches = useRef<(HTMLAnchorElement | null)[]>([]);
  const top = useRef(0);

  const [regions, setRegions] = useState<Region[]>([]);

  useEffect(() => {
    fetchRegions()
      .then((res) => {
        // Show counties first, then coast/cuisine types
        const counties = res.results.filter((r) => r.type === "county");
        const others = res.results.filter((r) => r.type !== "county");
        setRegions([...counties, ...others]);
      })
      .catch(() => {});
  }, []);

  const measure = () => {
    if (inner.current) top.current = parseFloat(getComputedStyle(inner.current).top) || 0;
  };

  const update = () => {
    const hs = section.current;
    const hi = inner.current;
    const rl = rail.current;
    if (!hs || !hi || !rl || prefersReducedMotion()) return;
    const vw = window.innerWidth;
    const p = cl((top.current - hs.getBoundingClientRect().top) / (hs.offsetHeight - hi.offsetHeight));
    const travel = Math.max(0, rl.scrollWidth - vw);
    rl.style.transform = `translateX(${-p * travel}px)`;
    arches.current.forEach((a) => {
      if (!a) return;
      const d = (a.offsetLeft + a.offsetWidth / 2 - p * travel - vw / 2) / vw;
      const ad = Math.min(1, Math.abs(d));
      a.style.transform = `translateY(${ad * 46}px) rotate(${d * 7}deg) scale(${1 - ad * 0.1})`;
    });
  };

  useScrollFrame(update, measure);

  // Skeleton while loading
  const displayItems = regions.length > 0
    ? regions
    : Array.from({ length: 10 }).map((_, i) => ({
        id: String(i),
        slug: "",
        name: "…",
        type: "county" as const,
        parent_slug: null,
      }));

  return (
    <section ref={section} className="hs" id="counties">
      <div ref={inner} className="hsin">
        <div className="wrap">
          <h2 className="h2">Taste of 47 Counties</h2>
          <p className="lead">One signature dish and story from every corner of Kenya.</p>
        </div>
        <div ref={rail} className="rail">
          {displayItems.map((region, i) => {
            const color = COUNTY_COLORS[region.slug] ?? DEFAULT_COUNTY_COLOR;
            const href = region.slug ? `/regions/${region.slug}` : "#counties";
            return (
              <a
                key={region.id}
                ref={(el) => { arches.current[i] = el; }}
                className="arch"
                href={href}
                style={{ "--g": color } as CSSVars}
                aria-label={`Explore ${region.name}`}
              >
                <Bowl />
                <h3>{region.name}</h3>
                <p>
                  {region.type === "county"
                    ? "Kenyan county"
                    : region.type === "coast"
                      ? "Coastal region"
                      : region.description?.split("—")[0]?.trim() ?? "Regional cuisine"}
                </p>
              </a>
            );
          })}
        </div>
        <div className="wrap">
          <p className="cap">
            {regions.length > 0
              ? `${regions.filter((r) => r.type === "county").length} Kenyan counties + neighbouring regions. `
              : ""}
            <a href="/regions" style={{ color: "var(--gold)", textDecoration: "underline" }}>
              See all 47 counties →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

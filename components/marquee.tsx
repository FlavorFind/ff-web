"use client";

/**
 * Marquee — endless scrolling ingredient ticker.
 *
 * Fetches ingredient names live from GET /v1/ingredients/ (no query = broad set).
 * The API returns up to `limit` results; we request 60 to get a rich variety.
 * While loading, renders a skeleton row so layout doesn't shift.
 * On error, renders nothing (section collapses gracefully).
 */

import { useEffect, useState } from "react";
import { autocomplete, type IngredientResult } from "@/lib/api";

// Shuffle an array in-place (Fisher-Yates) and return it
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function Marquee() {
  const [items, setItems] = useState<IngredientResult[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    autocomplete("", "en", 878)
      .then((res) => {
        // Shuffle so every page load shows a different order
        const shuffled = shuffle([...res.results]);
        setItems(shuffled);
        setReady(true);
      })
      .catch(() => {
        // Silent failure — section simply won't render
        setReady(true);
      });
  }, []);

  // Nothing to show (error or empty response)
  if (ready && items.length === 0) return null;

  // Duplicate for seamless loop — need at least ~40 items for the CSS animation
  // to loop without a visible gap; fill up if the API returns fewer
  const fill = items.length > 0
    ? Array.from({ length: Math.ceil(80 / items.length) }, () => items).flat()
    : [];
  const loopItems = [...fill, ...fill]; // double for seamless CSS marquee

  if (!ready) {
    // Skeleton — same height as the real ticker so layout doesn't jump
    return (
      <div className="mq mq-skeleton" aria-hidden="true">
        <div style={{ visibility: "hidden" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="mq" aria-label="Ingredients from the Flavor Find dataset" role="marquee">
      <div>
        {loopItems.map((item, i) => (
          <span key={`${item.slug}-${i}`}>
            {item.name_en}
            {item.name_sw && item.name_sw !== item.name_en && (
              <em>{item.name_sw}</em>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

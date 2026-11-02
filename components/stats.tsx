"use client";

import { CountUp } from "./count-up";
import { useInView } from "@/hooks/use-in-view";

// Real numbers from the live engine dataset (v1.0.0, dataset 2026.10.0)
const STATS = [
  [300, "Kenyan dishes"],
  [878, "ingredients"],
  [1498, "local names and spellings"],
  [47, "counties covered"],
] as const;

export function Stats() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="stats">
      {STATS.map(([n, label]) => (
        <div key={label}>
          <b>
            <CountUp to={n} active={seen} locale />
          </b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

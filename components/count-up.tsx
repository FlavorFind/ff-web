"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  active: boolean;
  duration?: number;
  locale?: boolean;
}

export function CountUp({ to, active, duration = 1100, locale = false }: CountUpProps) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const frame = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active, to, duration]);
  return <>{locale ? value.toLocaleString("en-US") : value}</>;
}

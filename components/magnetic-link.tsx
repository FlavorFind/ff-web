"use client";

import type { ComponentProps, PointerEvent } from "react";

export function MagneticLink(props: ComponentProps<"a">) {
  const move = (e: PointerEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const b = e.currentTarget;
    const r = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
  };
  return (
    <a
      {...props}
      onPointerMove={move}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "";
      }}
    />
  );
}

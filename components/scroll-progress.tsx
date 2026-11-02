"use client";

import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { cl } from "@/lib/math";

/** Top progress bar; also publishes --sp for the back-to-top ring. */
export function ScrollProgress() {
  useScrollFrame(() => {
    const root = document.documentElement;
    const p = cl(window.scrollY / Math.max(1, root.scrollHeight - window.innerHeight));
    root.style.setProperty("--sp", String(p));
  });
  return <div className="prog" aria-hidden="true" />;
}

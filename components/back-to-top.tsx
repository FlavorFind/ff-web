"use client";

import { useState } from "react";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useScrollFrame(() => setShow(window.scrollY > window.innerHeight));
  return (
    <button
      type="button"
      className={cn("top2", show && "show")}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle className="tr" cx="22" cy="22" r="19" />
        <circle id="ar2" cx="22" cy="22" r="19" />
      </svg>
      <span aria-hidden="true">↑</span>
    </button>
  );
}

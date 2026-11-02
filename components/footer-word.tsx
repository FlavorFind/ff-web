"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn, type CSSVars } from "@/lib/utils";

export function FooterWord({ text }: { text: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className={cn("word", seen && "in")} aria-hidden="true">
      {[...text].map((c, i) => (
        <span key={i} style={{ "--k": i } as CSSVars}>
          {c === " " ? "\u00a0" : c}
        </span>
      ))}
    </div>
  );
}

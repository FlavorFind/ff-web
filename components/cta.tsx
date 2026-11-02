"use client";

import { Fragment, useRef } from "react";
import { MagneticLink } from "./magnetic-link";
import { useScrollFrame } from "@/hooks/use-scroll-frame";
import { cl, prefersReducedMotion } from "@/lib/math";

const WORDS = "Mama’s recipe belongs here.".split(" ");

export function Cta() {
  const heading = useRef<HTMLHeadingElement>(null);

  // Words light up one by one as the heading scrolls into view.
  useScrollFrame(() => {
    const h = heading.current;
    if (!h || prefersReducedMotion()) return;
    const vh = window.innerHeight;
    const words = [...h.children] as HTMLElement[];
    const q = cl((vh * 0.88 - h.getBoundingClientRect().top) / (vh * 0.5)) * words.length;
    words.forEach((w, i) => {
      w.style.opacity = String(0.16 + 0.84 * cl(q - i));
    });
  });

  return (
    <section className="cta sec pt-0">
      <div className="wrap">
        <h2 ref={heading} className="h2">
          {WORDS.map((w, i) => (
            <Fragment key={w}>
              {i > 0 && " "}
              <span className="w">{w}</span>
            </Fragment>
          ))}
        </h2>
        <p className="lead mx-auto">
          Share a family dish. We check it, credit you, and add it to the kitchen everyone cooks from.
        </p>
        <div className="row">
          <MagneticLink className="btn" href="/#cook">
            Start cooking
          </MagneticLink>
          <MagneticLink className="btn out" href="/community">
            Share a recipe
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}

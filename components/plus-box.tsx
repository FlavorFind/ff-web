"use client";

import { CountUp } from "./count-up";
import { MagneticLink } from "./magnetic-link";
import { useInView } from "@/hooks/use-in-view";
import { PLUS_FEATURES } from "@/lib/data";
import { cn, type CSSVars } from "@/lib/utils";

export function PlusBox() {
  const [ref, seen] = useInView<HTMLDivElement>(0.35);
  return (
    <section className="sec pt-0" id="plus">
      <div className="wrap">
        <div ref={ref} className={cn("plusbox", seen && "in")}>
          <div>
            <h2 className="h2">Plus: your kitchen, planned</h2>
            <p className="price">
              KES <CountUp to={199} active={seen} duration={1200} />
              <small> / month · Cancel any time</small>
            </p>
            <p style={{ opacity: 0.7, marginBottom: "1.5rem", fontSize: ".95rem" }}>
              M-Pesa accepted. No credit card needed.
            </p>
            <MagneticLink className="btn" href="/plus">
              Upgrade to Plus
            </MagneticLink>
          </div>
          <ul>
            {PLUS_FEATURES.map((f, i) => (
              <li key={f} style={{ "--k": i } as CSSVars}>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

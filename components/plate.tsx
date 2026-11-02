import type { ElementType } from "react";
import { Bowl } from "./icons";
import { cn, type CSSVars } from "@/lib/utils";

interface PlateProps {
  name: string;
  /** Secondary label; pass "" to keep the empty slot the original markup had. */
  alt?: string;
  tone: "exact" | "can" | "almost";
  tag?: string;
  index?: number;
  onClick?: () => void;
  /** When supplied, wraps the plate in an <a> so users can navigate to the dish page. */
  href?: string;
}

export function Plate({ name, alt, tone, tag, index = 0, onClick, href }: PlateProps) {
  const Comp: ElementType = href ? "a" : onClick ? "button" : "div";
  return (
    <Comp
      className={cn("plate", tone)}
      style={{ "--i": index } as CSSVars}
      type={!href && onClick ? "button" : undefined}
      href={href}
      onClick={onClick}
    >
      <span className="rim">
        <Bowl />
      </span>
      <b>{name}</b>
      {alt !== undefined && <i>{alt === name ? "" : alt}</i>}
      {tag && <small>{tag}</small>}
    </Comp>
  );
}

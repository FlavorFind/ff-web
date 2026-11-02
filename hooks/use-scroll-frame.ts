import { useEffect, useRef } from "react";

/** Runs `update` once per animation frame while scrolling, and `measure` + `update` on resize. */
export function useScrollFrame(update: () => void, measure?: () => void) {
  const fns = useRef({ update, measure });
  useEffect(() => {
    fns.current = { update, measure };
  });
  useEffect(() => {
    let tick = 0;
    const onScroll = () => {
      if (!tick)
        tick = requestAnimationFrame(() => {
          tick = 0;
          fns.current.update();
        });
    };
    const onResize = () => {
      fns.current.measure?.();
      fns.current.update();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(tick);
    };
  }, []);
}

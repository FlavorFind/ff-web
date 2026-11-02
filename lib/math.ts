export const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const sg = (p: number, a: number, b: number) => cl((p - a) / (b - a));
export const es = (t: number) => t * t * (3 - 2 * t);
export const lp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

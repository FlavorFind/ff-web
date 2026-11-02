"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Theme = "forest" | "light" | "dark";

const THEMES: Theme[] = ["forest", "light", "dark"];
const STORAGE_KEY = "ff-theme";

const NEXT_LABEL: Record<Theme, string> = {
  forest: "Light theme",
  light:  "Dark theme",
  dark:   "Forest theme",
};

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconForest() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" width="18" height="18">
      <path d="M9 3C9 3 4 6 4 11a5 5 0 0010 0c0-5-5-8-5-8z" fill="currentColor" opacity=".9"/>
      <line x1="9" y1="16" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconLight() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" width="18" height="18">
      <circle cx="9" cy="9" r="3.2" fill="currentColor"/>
      {([0,45,90,135,180,225,270,315] as const).map((deg) => (
        <line
          key={deg}
          x1={9 + 4.8 * Math.cos((deg * Math.PI) / 180)}
          y1={9 + 4.8 * Math.sin((deg * Math.PI) / 180)}
          x2={9 + 6.6 * Math.cos((deg * Math.PI) / 180)}
          y2={9 + 6.6 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function IconDark() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" width="18" height="18">
      <path d="M13.5 10.5A6 6 0 017.5 4.5a6 6 0 100 9 6 6 0 006-3z" fill="currentColor"/>
    </svg>
  );
}

const ICONS: Record<Theme, () => React.ReactElement> = {
  forest: IconForest,
  light:  IconLight,
  dark:   IconDark,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyTheme(theme: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;

  if ("startViewTransition" in document && origin) {
    root.style.setProperty("--tx-x", `${origin.x}px`);
    root.style.setProperty("--tx-y", `${origin.y}px`);
    // startViewTransition is available in modern browsers (Chrome 111+, Safari 18+)
    (document as Document & {
      startViewTransition: (cb: () => void) => void;
    }).startViewTransition(() => {
      root.setAttribute("data-theme", theme);
    });
  } else {
    root.setAttribute("data-theme", theme);
  }

  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private browsing */ }
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && THEMES.includes(stored)) return stored;
  } catch { /* SSR or private */ }
  return "forest";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("forest");
  const [animating, setAnimating] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = readTheme();
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  function cycle() {
    if (animating) return;

    const btn = btnRef.current;
    const origin = btn
      ? {
          x: btn.getBoundingClientRect().left + btn.offsetWidth / 2,
          y: btn.getBoundingClientRect().top  + btn.offsetHeight / 2,
        }
      : undefined;

    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];

    setAnimating(true);
    setTimeout(() => {
      setTheme(next);
      applyTheme(next, origin);
      setAnimating(false);
    }, 200);
  }

  const CurrentIcon = ICONS[theme];

  return (
    <button
      ref={btnRef}
      type="button"
      className="theme-btn"
      onClick={cycle}
      aria-label={`Switch to ${NEXT_LABEL[theme]}`}
      data-tip={NEXT_LABEL[theme]}
    >
      <span className={`ti ${animating ? "out" : "in"}`}>
        <CurrentIcon />
      </span>
    </button>
  );
}

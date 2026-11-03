"use client";

/**
 * BottomTabs — mobile/tablet bottom navigation bar.
 * Shown only at ≤1024px. Replaces the hamburger on small screens.
 *
 * Tabs: Home · Cook · Pantry · Saved · Profile
 */

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const TABS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path
          d="M9 21V12h6v9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/cook",
    label: "Cook",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="11"
          cy="11"
          r="7"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <path
          d="M17.5 17.5L21 21"
          stroke="currentColor"
          strokeWidth={active ? 2.5 : 2}
          strokeLinecap="round"
        />
        {/* fork tines */}
        <path
          d="M8 7v3m3-3v3"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={active ? 0.9 : 0.6}
        />
      </svg>
    ),
  },
  {
    href: "/pantry",
    label: "Pantry",
    requiresAuth: true,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="6"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <path
          d="M3 10h18"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
        />
        <path
          d="M8 3v3M16 3v3"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.6}
          strokeLinecap="round"
        />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    requiresAuth: true,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 3h14a1 1 0 011 1v17l-8-4-8 4V4a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Profile",
    requiresAuth: true,
    guestHref: "/auth/sign-in",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.8}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Exact match for home, prefix match for everything else
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="btabs" aria-label="Main navigation">
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        const href = !isAuthenticated && tab.guestHref ? tab.guestHref : tab.href;
        return (
          <a
            key={tab.href}
            href={href}
            className={`btab${active ? " btab-active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={tab.label}
          >
            <span className="btab-icon">{tab.icon(active)}</span>
            <span className="btab-label">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

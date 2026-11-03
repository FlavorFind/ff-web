"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // User avatar dropdown
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Mobile hamburger nav
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close mobile nav on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  // User initial for avatar
  const initial = user?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="top">
        <div className="wrap">
          {/* Logo — text hidden on mobile/tablet */}
          <a className="brand" href="/" aria-label="Flavor Find home">
            <svg aria-hidden="true" width="34" height="34">
              <use href="#logo" />
            </svg>
            <span className="brand-text">Flavor Find</span>
          </a>

          {/* Desktop nav */}
          <nav aria-label="Main" className="top-nav-desktop">
            {isAuthenticated && <a href="/">{t("n0")}</a>}
            <a href="/cook">{t("n1")}</a>
            <a href="/regions">{t("n2")}</a>
            <a href="/plus">{t("n3")}</a>
          </nav>

          {/* EN/SW toggle */}
          <div className="lang" role="group" aria-label="Language">
            {(["en", "sw"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Theme */}
          <ThemeToggle />

          {/* Auth — skeleton during restore */}
          {isLoading ? (
            <span className="hdr-auth-skeleton" aria-hidden="true" />
          ) : isAuthenticated && user ? (
            /* ── Logged-in state ── */
            <div className="hdr-user" ref={menuRef}>
              <button
                className="hdr-avatar"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="hdr-avatar-initial">{initial}</span>
              </button>

              {menuOpen && (
                <div className="hdr-menu" role="menu">
                  <div className="hdr-menu-info">
                    <span className="hdr-menu-name">{user.username}</span>
                    <span className="hdr-menu-email">{user.email}</span>
                  </div>
                  <hr className="hdr-menu-sep" />
                  <a className="hdr-menu-item" href="/account" role="menuitem" onClick={() => setMenuOpen(false)}>
                    Account
                  </a>
                  <a className="hdr-menu-item" href="/pantry" role="menuitem" onClick={() => setMenuOpen(false)}>
                    My Pantry
                  </a>
                  <a className="hdr-menu-item" href="/saved" role="menuitem" onClick={() => setMenuOpen(false)}>
                    Saved Recipes
                  </a>
                  <hr className="hdr-menu-sep" />
                  <button className="hdr-menu-item hdr-menu-signout" role="menuitem" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Logged-out state ──
               Desktop: text "Sign in" + "Get started" button
               Mobile:  three icons — Cook, Plus, Sign-in
            ── */
            <>
              {/* Mobile icon strip — hidden on desktop */}
              <div className="hdr-icon-strip">
                {/* Cook / Search */}
                <a href="/cook" className="hdr-icon-btn" aria-label="Search dishes">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M17.5 17.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>
                {/* Plus / Upgrade */}
                <a href="/plus" className="hdr-icon-btn hdr-icon-plus" aria-label="Upgrade to Plus">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3l2.5 6.5H21l-5.5 4 2 6.5L12 16l-5.5 4 2-6.5L3 9.5h6.5L12 3z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
                      fill="currentColor" fillOpacity="0.15"/>
                  </svg>
                </a>
                {/* Sign in */}
                <a href="/auth/sign-in" className="hdr-icon-btn" aria-label="Sign in">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>

              {/* Desktop text links — hidden on mobile */}
              <a href="/auth/sign-in" className="hdr-signin hdr-signin-desktop">
                Sign in
              </a>
              <a className="btn hdr-cta" href="/auth/sign-up">
                {t("go")}
              </a>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="hdr-burger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className={`hdr-burger-icon ${mobileOpen ? "hdr-burger-open" : ""}`} aria-hidden="true">
              <span /><span /><span />
            </span>
          </button>
        </div>
      </header>

      {/* ── Mobile nav overlay ── */}
      {mobileOpen && (
        <div className="mob-nav-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}
      <div
        id="mobile-nav"
        className={`mob-nav ${mobileOpen ? "mob-nav-open" : ""}`}
        ref={mobileRef}
        aria-hidden={!mobileOpen}
      >
        <nav aria-label="Mobile navigation">
          {isAuthenticated && <a className="mob-nav-link" href="/" onClick={closeMobile}>{t("n0")}</a>}
          <a className="mob-nav-link" href="/cook" onClick={closeMobile}>{t("n1")}</a>
          <a className="mob-nav-link" href="/regions" onClick={closeMobile}>{t("n2")}</a>
          <a className="mob-nav-link" href="/plus" onClick={closeMobile}>{t("n3")}</a>
        </nav>

        <hr className="mob-nav-sep" />

        {isAuthenticated && user ? (
          <nav aria-label="Account">
            <a className="mob-nav-link" href="/pantry" onClick={closeMobile}>My Pantry</a>
            <a className="mob-nav-link" href="/saved" onClick={closeMobile}>Saved Recipes</a>
            <a className="mob-nav-link" href="/account" onClick={closeMobile}>Account</a>
            <button type="button" className="mob-nav-signout" onClick={handleLogout}>Sign out</button>
          </nav>
        ) : (
          <div className="mob-nav-auth">
            <a className="btn" href="/auth/sign-up" onClick={closeMobile}>{t("go")}</a>
            <a className="mob-nav-signin" href="/auth/sign-in" onClick={closeMobile}>Sign in</a>
          </div>
        )}
      </div>
    </>
  );
}

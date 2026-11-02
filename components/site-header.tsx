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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  }

  // User initial for avatar
  const initial = user?.username?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <header className="top">
      <div className="wrap">
        {/* Logo */}
        <a className="brand" href="/" aria-label="Flavor Find home">
          <svg aria-hidden="true" width="34" height="34">
            <use href="#logo" />
          </svg>
          Flavor Find
        </a>

        {/* Nav */}
        <nav aria-label="Main">
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

        {/* Auth — skeleton during restore, then snaps to correct state */}
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
          /* ── Logged-out state ── */
          <>
            <a href="/auth/sign-in" className="hdr-signin">
              Sign in
            </a>
            <a className="btn" href="/auth/sign-up">
              {t("go")}
            </a>
          </>
        )}
      </div>
    </header>
  );
}

"use client";

/**
 * Sign In — /auth/sign-in
 * POST /v1/auth/login/  { email, password }
 * On success: stores tokens via AuthContext.login(), redirects to /cook
 * Already-authenticated users are redirected immediately.
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ access: string; refresh: string; user: { id: string; email: string; username: string; language: string; status: string; email_verified: boolean } }>(
        "/v1/auth/login/",
        { email: email.trim(), password },
        { skipAuth: true },
      );
      login(res.user, res.access, res.refresh);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Check your email and password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null; // wait for session restore before showing form

  return (
    <div className="ap-root">
      {/* Left panel — branding */}
      <div className="ap-left" aria-hidden="true">
        <div className="ap-left-inner">
          <a href="/" className="ap-logo">
            <svg width="40" height="40" viewBox="0 0 36 36">
              <use href="#logo" />
            </svg>
            <span>Flavor Find</span>
          </a>
          <blockquote className="ap-quote">
            "Tell us what you have.<br />We'll show you what Kenya cooks."
          </blockquote>
          <div className="ap-dots" aria-hidden="true">
            {["#b9472f","#4c8a4f","#D1AE5F","#5a7a8a","#8a5a7a"].map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <main className="ap-right">
        <div className="ap-card">
          {/* Mobile logo */}
          <a href="/" className="ap-logo ap-logo-mobile">
            <svg width="32" height="32" viewBox="0 0 36 36"><use href="#logo" /></svg>
            <span>Flavor Find</span>
          </a>

          <h1 className="ap-title">Welcome back</h1>
          <p className="ap-sub">Sign in to your pantry, saved recipes, and more.</p>

          {error && (
            <div className="ap-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form className="ap-form" onSubmit={handleSubmit} noValidate>
            <div className="ap-field">
              <label htmlFor="si-email">Email address</label>
              <input
                id="si-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
              />
            </div>

            <div className="ap-field">
              <div className="ap-field-row">
                <label htmlFor="si-password">Password</label>
              </div>
              <div className="ap-input-wrap">
                <input
                  id="si-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="ap-eye"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPass ? "👁" : "👁‍🗨"}
                </button>
              </div>
            </div>

            <button
              className="btn ap-submit"
              type="submit"
              disabled={submitting || !email || !password}
            >
              {submitting ? (
                <span className="ap-spinner" aria-label="Signing in…" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="ap-switch">
            Don't have an account?{" "}
            <Link href="/auth/sign-up">Create one free →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

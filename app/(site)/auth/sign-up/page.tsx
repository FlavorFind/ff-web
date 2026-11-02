"use client";

/**
 * Sign Up — /auth/sign-up
 * POST /v1/auth/register/ { email, username, password, language, terms_version }
 * Backend notes: login works immediately after register — email verification is
 * NOT required. A verification email is sent automatically in the background.
 * On success: auth context is populated, user goes to /cook, a banner tells them
 * to verify their email when convenient.
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [email, setEmail]       = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isLoading, isAuthenticated, router]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim())       e.email    = "Email is required.";
    if (username.trim().length < 3) e.username = "Username must be at least 3 characters.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!terms)              e.terms    = "You must accept the terms to continue.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ access: string; refresh: string; user: { id: string; email: string; username: string; language: string; status: string; email_verified: boolean } }>(
        "/v1/auth/register/",
        { email: email.trim(), username: username.trim(), password, language: "en", terms_version: "2026-10" },
        { skipAuth: true },
      );
      login(res.user, res.access, res.refresh);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const detail = err.detail as Record<string, string[]> | undefined;
        if (detail && typeof detail === "object" && !Array.isArray(detail)) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(detail)) {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          }
          setFieldErrors(mapped);
        } else {
          setError(err.message);
        }
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="ap-root">
      {/* Left panel */}
      <div className="ap-left" aria-hidden="true">
        <div className="ap-left-inner">
          <a href="/" className="ap-logo">
            <svg width="40" height="40" viewBox="0 0 36 36"><use href="#logo" /></svg>
            <span>Flavor Find</span>
          </a>
          <blockquote className="ap-quote">
            "300 Kenyan dishes.<br />878 ingredients.<br />What's in your kitchen?"
          </blockquote>
          <div className="ap-dots" aria-hidden="true">
            {["#b9472f","#4c8a4f","#D1AE5F","#5a7a8a","#8a5a7a"].map((c, i) => (
              <span key={i} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <main className="ap-right">
        <div className="ap-card">
          <a href="/" className="ap-logo ap-logo-mobile">
            <svg width="32" height="32" viewBox="0 0 36 36"><use href="#logo" /></svg>
            <span>Flavor Find</span>
          </a>

          <h1 className="ap-title">Create your account</h1>
          <p className="ap-sub">Free forever. No credit card. Start cooking in seconds.</p>

          {error && (
            <div className="ap-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form className="ap-form" onSubmit={handleSubmit} noValidate>
            <div className="ap-field">
              <label htmlFor="su-email">Email address</label>
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
                disabled={submitting}
              />
              {fieldErrors.email && <span className="ap-field-err">{fieldErrors.email}</span>}
            </div>

            <div className="ap-field">
              <label htmlFor="su-username">Username</label>
              <input
                id="su-username"
                type="text"
                autoComplete="username"
                placeholder="your_name"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldErrors((p) => ({ ...p, username: "" })); }}
                disabled={submitting}
              />
              {fieldErrors.username && <span className="ap-field-err">{fieldErrors.username}</span>}
            </div>

            <div className="ap-field">
              <label htmlFor="su-password">Password</label>
              <div className="ap-input-wrap">
                <input
                  id="su-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
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
              {fieldErrors.password && <span className="ap-field-err">{fieldErrors.password}</span>}
            </div>

            <label className="ap-check">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => { setTerms(e.target.checked); setFieldErrors((p) => ({ ...p, terms: "" })); }}
                disabled={submitting}
              />
              <span>
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/legal/privacy" target="_blank">Privacy Policy</Link>
              </span>
            </label>
            {fieldErrors.terms && <span className="ap-field-err">{fieldErrors.terms}</span>}

            <button
              className="btn ap-submit"
              type="submit"
              disabled={submitting || !email || !username || !password || !terms}
            >
              {submitting ? <span className="ap-spinner" aria-label="Creating account…" /> : "Create account"}
            </button>
          </form>

          <p className="ap-switch">
            Already have an account?{" "}
            <Link href="/auth/sign-in">Sign in →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

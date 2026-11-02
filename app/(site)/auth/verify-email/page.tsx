"use client";

/**
 * Verify Email — /auth/verify-email?token=<token>
 * Wrapped in Suspense because useSearchParams requires it during static build.
 */

import { Suspense } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail, resendVerification, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type State = "idle" | "verifying" | "success" | "error" | "resending" | "resent";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "verifying" : "idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email ?? "");

  // Auto-verify when token is in URL
  useEffect(() => {
    if (!token) return;
    setState("verifying");
    verifyEmail(token)
      .then((updatedUser) => {
        // Update the user in auth context with email_verified: true
        setUser(updatedUser);
        setState("success");
      })
      .catch((err) => {
        setErrorMsg(err instanceof ApiError ? err.message : "Verification failed. The link may have expired.");
        setState("error");
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResend() {
    if (!email.trim()) return;
    setState("resending");
    try {
      await resendVerification(email.trim());
      setState("resent");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Couldn't resend. Try again.");
      setState("error");
    }
  }

  return (
    <div className="ap-root ap-root-centered">
      <div className="ap-verify-card">
        {/* ── Verifying ── */}
        {state === "verifying" && (
          <div className="ap-verify-state">
            <div className="ap-verify-spinner" aria-label="Verifying…">
              <svg viewBox="0 0 50 50" className="ap-spin">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="80 40" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="ap-title">Verifying your email…</h1>
            <p className="ap-sub">Just a moment.</p>
          </div>
        )}

        {/* ── Success ── */}
        {state === "success" && (
          <div className="ap-verify-state ap-verify-success">
            <div className="ap-verify-icon ap-verify-icon-success">
              <svg viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" stroke="#4c8a4f" strokeWidth="2" />
                <path d="M14 26l8 8 14-14" stroke="#4c8a4f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 40, strokeDashoffset: 0, transition: "stroke-dashoffset .5s .1s" }} />
              </svg>
            </div>
            <h1 className="ap-title">Email verified!</h1>
            <p className="ap-sub">Your account is fully verified. Start discovering Kenyan dishes.</p>
            <button className="btn ap-submit" onClick={() => router.push("/cook")}>
              Start cooking →
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <div className="ap-verify-state">
            <div className="ap-verify-icon ap-verify-icon-error">
              <svg viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" stroke="var(--chili)" strokeWidth="2" />
                <path d="M17 17l16 16M33 17L17 33" stroke="var(--chili)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="ap-title">Link expired</h1>
            <p className="ap-sub">{errorMsg ?? "This verification link is no longer valid."}</p>
            <div className="ap-verify-resend-form">
              <p className="ap-sub" style={{ marginBottom: ".5rem" }}>Get a new link:</p>
              <div className="ap-verify-row">
                <input
                  className="ap-verify-email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn" onClick={handleResend} disabled={!email.trim()}>
                  Resend
                </button>
              </div>
            </div>
            <Link href="/cook" className="ap-skip">Skip for now →</Link>
          </div>
        )}

        {/* ── Resending ── */}
        {state === "resending" && (
          <div className="ap-verify-state">
            <div className="ap-verify-spinner">
              <svg viewBox="0 0 50 50" className="ap-spin">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="80 40" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="ap-title">Sending…</h1>
          </div>
        )}

        {/* ── Resent ── */}
        {state === "resent" && (
          <div className="ap-verify-state ap-verify-success">
            <div className="ap-verify-icon ap-verify-icon-success">
              <svg viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" stroke="#4c8a4f" strokeWidth="2" />
                <path d="M14 26l8 8 14-14" stroke="#4c8a4f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="ap-title">Email sent!</h1>
            <p className="ap-sub">Check your inbox and click the verification link. It expires in 24 hours.</p>
            <Link href="/cook" className="ap-skip">Continue to app →</Link>
          </div>
        )}

        {/* ── Idle (no token in URL) ── */}
        {state === "idle" && (
          <div className="ap-verify-state">
            <div className="ap-verify-icon">
              <svg viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" stroke="var(--gold)" strokeWidth="2" opacity=".5" />
                <path d="M12 19l13 9 13-9" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
                <rect x="12" y="17" width="26" height="18" rx="2" stroke="var(--gold)" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="ap-title">Check your inbox</h1>
            <p className="ap-sub">
              We sent a verification link to{" "}
              {user?.email ? <strong>{user.email}</strong> : "your email address"}.
              {" "}Click the link in the email to verify your account.
            </p>
            <p className="ap-sub" style={{ fontSize: ".85rem", opacity: .7 }}>
              You can use Flavor Find now — verification just unlocks your full profile.
            </p>
            <div className="ap-verify-resend-form">
              <p className="ap-sub" style={{ marginBottom: ".5rem" }}>Didn't get it? Resend:</p>
              <div className="ap-verify-row">
                <input
                  className="ap-verify-email-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn" onClick={handleResend} disabled={!email.trim()}>
                  Resend
                </button>
              </div>
            </div>
            <Link href="/cook" className="ap-skip">Continue to Cook →</Link>
          </div>
        )}

        {/* Back link */}
        {state !== "verifying" && state !== "resending" && (
          <p className="ap-verify-back">
            <Link href="/auth/sign-in">← Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoPulse } from "@/components/LogoPulse";
import { useAuth } from "@/components/AuthContext";
import { validatePassword, passwordsMatch } from "@/lib/auth-validation";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Reset-password page.
 *
 * The user arrives here after clicking the link in the reset email. Supabase
 * delivers the recovery token as a URL hash fragment and @supabase/ssr detects
 * it (`detectSessionInUrl`), which establishes a short-lived recovery session.
 * We then call `updateUser({ password })` to set the new password.
 *
 * Because this page reads URL search params it must be wrapped in <Suspense>.
 */
function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword } = useAuth();

  // The Supabase recovery link may carry ?type=recovery and an error in the
  // query string if something went wrong on the redirect.
  const flowType = searchParams.get("type");
  const urlError = searchParams.get("error_description") || searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(urlError ? { type: "error", message: urlError } : null);

  // Surface a clear error if the user lands here without a valid recovery flow.
  const invalidFlow = flowType !== null && flowType !== "recovery";

  useEffect(() => {
    if (invalidFlow && !feedback) {
      setFeedback({
        type: "error",
        message:
          "This password reset link is invalid or has expired. Please request a new one.",
      });
    }
  }, [invalidFlow, feedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const passErr = validatePassword(password);
    if (passErr) {
      setFeedback({ type: "error", message: passErr });
      return;
    }
    const matchErr = passwordsMatch(password, confirm);
    if (matchErr) {
      setFeedback({ type: "error", message: matchErr });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setFeedback({
        type: "error",
        message:
          "We couldn't update your password. The link may have expired — please request a new reset email.",
      });
      return;
    }

    setDone(true);
    setFeedback({
      type: "success",
      message: "Your password has been updated. You can now sign in.",
    });
  };

  return (
    <div style={s.root}>
      <style>{`@keyframes pp-spin { to { transform: rotate(360deg); } }`}</style>

      {/* decorative blob */}
      <div style={s.blob} />

      {/* back button */}
      <button
        style={s.backBtn}
        onClick={() => router.push("/auth")}
        aria-label="Back to sign in"
      >
        <ChevronLeft size={18} />
        <span>Back to sign in</span>
      </button>

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={s.card}
      >
        {/* brand */}
        <div style={s.brand}>
          <LogoPulse size={44} />
          <div>
            <p style={s.brandName}>Pulse Pharma</p>
            <p style={s.brandTagline}>Choose a new password</p>
          </div>
        </div>

        {/* heading */}
        <h1 style={s.heading}>Reset your password</h1>
        <p style={s.subheading}>
          Choose a strong new password for your account. You&apos;ll use it to
          sign in from now on.
        </p>

        {/* feedback */}
        <AnimatePresence mode="wait">
          {feedback && (
            <Banner key={feedback.message} type={feedback.type} message={feedback.message} />
          )}
        </AnimatePresence>

        {/* form (hidden once updated) */}
        {!done && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            style={s.form}
          >
            {/* new password */}
            <div>
              <label style={s.label}>New Password</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                  style={{ ...s.input, ...s.inputWithPadRight }}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  style={s.eyeBtn}
                  onClick={() => setShowPass((p) => !p)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* confirm password */}
            <div>
              <label style={s.label}>Confirm New Password</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ ...s.input, ...s.inputWithPadRight }}
                  placeholder="Re-enter your new password"
                />
              </div>
            </div>

            {/* password rules hint */}
            <ul style={s.hintList}>
              <li>At least 8 characters</li>
              <li>Upper &amp; lower case letters</li>
              <li>At least one number</li>
            </ul>

            <button type="submit" disabled={loading} style={s.submitBtn(loading)}>
              {loading ? (
                <>
                  <Spinner /> Updating…
                </>
              ) : (
                <>
                  Update Password <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* post-success actions */}
        {done && (
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              style={{ ...s.submitBtn(false), marginTop: 0 }}
              onClick={() => router.push("/account")}
            >
              Continue to my account <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* security badge */}
        <div style={s.badge}>
          <ShieldCheck size={14} color="#dc2626" />
          <span>Vault-grade defense health data protection</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────
   Feedback Banner
───────────────────────────────────────────── */
interface BannerProps {
  type: "success" | "error";
  message: string;
}
function Banner({ type, message }: BannerProps) {
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      style={s.banner(type)}
      role="alert"
    >
      <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Spinner
───────────────────────────────────────────── */
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 18,
        height: 18,
        border: "2.5px solid rgba(255,255,255,0.4)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "pp-spin 0.6s linear infinite",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Styles — mirrors src/app/auth/page.tsx for visual consistency
───────────────────────────────────────────── */
const s = {
  root: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    position: "relative" as const,
  } as React.CSSProperties,

  blob: {
    position: "fixed" as const,
    top: -160,
    right: -160,
    width: 520,
    height: 520,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)",
    pointerEvents: "none" as const,
    zIndex: 0,
  } as React.CSSProperties,

  backBtn: {
    position: "fixed" as const,
    top: "1.25rem",
    left: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    color: "#6b7280",
    fontSize: "0.875rem",
    fontWeight: 500,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "0.45rem 1rem 0.45rem 0.7rem",
    cursor: "pointer",
    zIndex: 20,
  } as React.CSSProperties,

  card: {
    position: "relative" as const,
    zIndex: 10,
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "1.5rem",
    padding: "2.25rem 2rem 1.75rem",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(220,38,38,0.04)",
  } as React.CSSProperties,

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    marginBottom: "1.5rem",
  } as React.CSSProperties,

  brandName: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    margin: 0,
  } as React.CSSProperties,

  brandTagline: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    marginTop: "0.15rem",
    margin: 0,
  } as React.CSSProperties,

  heading: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.02em",
    margin: 0,
  } as React.CSSProperties,

  subheading: {
    fontSize: "0.85rem",
    color: "#6b7280",
    lineHeight: 1.55,
    margin: "0.5rem 0 1.5rem",
  } as React.CSSProperties,

  banner: (type: "success" | "error"): React.CSSProperties => ({
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
    padding: "0.75rem 1rem",
    borderRadius: "0.75rem",
    fontSize: "0.82rem",
    lineHeight: 1.5,
    marginBottom: "0.5rem",
    background: type === "success" ? "#f0fdf4" : "#fef2f2",
    border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
    color: type === "success" ? "#166534" : "#991b1b",
  }),

  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.1rem",
  } as React.CSSProperties,

  label: {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "0.4rem",
  } as React.CSSProperties,

  inputWrap: { position: "relative" as const } as React.CSSProperties,

  inputIcon: {
    position: "absolute" as const,
    left: "0.85rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#d1d5db",
    pointerEvents: "none" as const,
  } as React.CSSProperties,

  input: {
    width: "100%",
    paddingLeft: "2.5rem",
    paddingRight: "1rem",
    paddingTop: "0.75rem",
    paddingBottom: "0.75rem",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "0.75rem",
    color: "#111827",
    fontSize: "0.875rem",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,

  inputWithPadRight: { paddingRight: "2.75rem" } as React.CSSProperties,

  eyeBtn: {
    position: "absolute" as const,
    right: "0.85rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
  } as React.CSSProperties,

  hintList: {
    margin: 0,
    paddingLeft: "1.1rem",
    color: "#9ca3af",
    fontSize: "0.75rem",
    lineHeight: 1.7,
  } as React.CSSProperties,

  submitBtn: (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem",
    borderRadius: "0.875rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#fff",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    boxShadow: "0 8px 20px -6px rgba(220,38,38,0.45)",
    marginTop: "0.25rem",
    transition: "box-shadow 0.2s, transform 0.15s, opacity 0.2s",
  }),

  badge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    marginTop: "1.5rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid #f3f4f6",
    fontSize: "0.72rem",
    color: "#9ca3af",
  } as React.CSSProperties,
};

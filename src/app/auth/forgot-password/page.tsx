"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogoPulse } from "@/components/LogoPulse";
import { useAuth } from "@/components/AuthContext";
import { validateEmail } from "@/lib/auth-validation";
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Forgot-password page.
 *
 * Asks the user for their account email and sends the Supabase password-reset
 * email (the link inside redirects back to `/auth/reset-password`).
 *
 * SECURITY: the success message is shown regardless of whether the email
 * actually exists, so this form cannot be used to enumerate accounts.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFeedback({ type: "error", message: emailErr });
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    // Intentionally generic — never reveal whether the email is registered.
    setSent(true);
    setFeedback({
      type: "success",
      message:
        "If an account exists for that email, a password reset link is on its way. Check your inbox.",
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
            <p style={s.brandTagline}>Reset your password</p>
          </div>
        </div>

        {/* heading */}
        <h1 style={s.heading}>Forgot your password?</h1>
        <p style={s.subheading}>
          Enter the email linked to your account and we&apos;ll send you a link
          to choose a new password.
        </p>

        {/* feedback */}
        <AnimatePresence mode="wait">
          {feedback && (
            <Banner key={feedback.message} type={feedback.type} message={feedback.message} />
          )}
        </AnimatePresence>

        {/* form (hidden after success so the user isn't prompted to resend) */}
        {!sent && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            style={s.form}
          >
            <div>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrap}>
                <span style={s.inputIcon}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  style={s.input}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={s.submitBtn(loading)}>
              {loading ? (
                <>
                  <Spinner /> Sending…
                </>
              ) : (
                <>
                  Send Reset Link <ArrowRight size={16} />
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* post-send actions */}
        {sent && (
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              style={s.linkBtn}
              onClick={() => router.push("/auth")}
            >
              &larr; Back to sign in
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

  linkBtn: {
    color: "#dc2626",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
    padding: 0,
  } as React.CSSProperties,

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

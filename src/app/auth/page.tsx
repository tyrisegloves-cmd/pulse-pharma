"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoPulse } from "@/components/LogoPulse";
import { useAuth } from "@/components/AuthContext";
import {
  validateEmail,
  validatePassword,
  passwordsMatch,
  validateFullName,
} from "@/lib/auth-validation";
import {
  LogIn,
  UserPlus,
  Phone,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   Style helpers (plain objects — no style jsx)
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
    marginBottom: "1.75rem",
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

  tabsWrap: {
    display: "flex",
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: "0.875rem",
    padding: "0.3rem",
    marginBottom: "1.75rem",
    gap: "0.25rem",
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.45rem",
    padding: "0.6rem",
    borderRadius: "0.625rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: active ? "#ffffff" : "#6b7280",
    background: active ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "transparent",
    border: "none",
    cursor: "pointer",
    boxShadow: active ? "0 4px 12px -4px rgba(220,38,38,0.4)" : "none",
    transition: "background 0.2s, color 0.2s",
  }),

  /* feedback banners */
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

  forgotWrap: { textAlign: "right" as const, marginTop: "0.4rem" } as React.CSSProperties,

  forgotBtn: {
    fontSize: "0.75rem",
    color: "#dc2626",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
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

  switchText: {
    textAlign: "center" as const,
    fontSize: "0.8rem",
    color: "#6b7280",
  } as React.CSSProperties,

  switchLink: {
    color: "#dc2626",
    fontWeight: 600,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  } as React.CSSProperties,

  badge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    marginTop: "1.25rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid #f3f4f6",
    fontSize: "0.72rem",
    color: "#9ca3af",
  } as React.CSSProperties,
};

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
   Inner page (reads searchParams)
───────────────────────────────────────────── */
function AuthPageInner() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  /* feedback state */
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const clearFeedback = () => setFeedback(null);

  /* ── sign-in fields ── */
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");

  /* ── sign-up fields ── */
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suConfirmPass, setSuConfirmPass] = useState("");

  /* ── switch tab (clear feedback + pass) ── */
  const switchTab = (t: "signin" | "signup") => {
    setTab(t);
    clearFeedback();
    setShowPass(false);
    setShowConfirmPass(false);
  };

  /* ── handle sign in ── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    // Client-side validation
    const emailErr = validateEmail(siEmail);
    if (emailErr) {
      setFeedback({ type: "error", message: emailErr });
      return;
    }
    if (!siPass) {
      setFeedback({ type: "error", message: "Password is required." });
      return;
    }

    setLoading(true);

    const { error } = await signIn({ email: siEmail, password: siPass });

    if (error) {
      // Friendly message for the most common failure (wrong credentials).
      const msg =
        error.message.toLowerCase().includes("invalid login") ||
        error.message.toLowerCase().includes("invalid credentials")
          ? "Incorrect email or password. Please try again."
          : error.message;
      setFeedback({ type: "error", message: msg });
      setLoading(false);
      return;
    }

    // Success — onAuthStateChange fires SIGNED_IN in AuthContext automatically.
    // Redirect to homepage (or wherever the user came from).
    const next = searchParams.get("next") ?? "/";
    router.push(next);
  };

  /* ── handle sign up ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    // Full client-side validation
    const nameErr = validateFullName(suName);
    if (nameErr) {
      setFeedback({ type: "error", message: nameErr });
      return;
    }
    const emailErr = validateEmail(suEmail);
    if (emailErr) {
      setFeedback({ type: "error", message: emailErr });
      return;
    }
    const passErr = validatePassword(suPass);
    if (passErr) {
      setFeedback({ type: "error", message: passErr });
      return;
    }
    const matchErr = passwordsMatch(suPass, suConfirmPass);
    if (matchErr) {
      setFeedback({ type: "error", message: matchErr });
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email: suEmail,
      password: suPass,
      fullName: suName,
      phone: suPhone,
    });

    if (error) {
      setFeedback({ type: "error", message: error.message });
      setLoading(false);
      return;
    }

    // If email confirmation is enabled, Supabase does NOT create a session and
    // tells the user to confirm. If it's disabled, a session is created and
    // onAuthStateChange redirects them.
    setFeedback({
      type: "success",
      message:
        "Account created! Check your email to confirm your address, then sign in.",
    });
    setLoading(false);

    // Switch to sign-in tab after a short delay so the user sees the message
    setTimeout(() => switchTab("signin"), 3000);
  };

  /* ── handle forgot password ──
     Sends the Supabase reset email. We show a generic success message
     regardless of whether the email exists, so the form can't be used to
     enumerate accounts. */
  const [forgotLoading, setForgotLoading] = useState(false);
  const handleForgotPassword = async () => {
    const emailErr = validateEmail(siEmail);
    if (emailErr) {
      setFeedback({
        type: "error",
        message: "Enter your sign-in email above, then tap Forgot password.",
      });
      return;
    }
    setForgotLoading(true);
    const { error } = await resetPassword(siEmail);
    setForgotLoading(false);
    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }
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
      <button style={s.backBtn} onClick={() => router.back()} aria-label="Go back">
        <ChevronLeft size={18} />
        <span>Back</span>
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
            <p style={s.brandTagline}>Your health, delivered with care</p>
          </div>
        </div>

        {/* tab switcher */}
        <div style={s.tabsWrap}>
          <button style={s.tab(tab === "signin")} onClick={() => switchTab("signin")}>
            <LogIn size={15} />
            Sign In
          </button>
          <button style={s.tab(tab === "signup")} onClick={() => switchTab("signup")}>
            <UserPlus size={15} />
            Sign Up
          </button>
        </div>

        {/* feedback banner (lives outside AnimatePresence so it doesn't get unmounted on tab switch) */}
        <AnimatePresence mode="wait">
          {feedback && (
            <Banner key={feedback.message} type={feedback.type} message={feedback.message} />
          )}
        </AnimatePresence>

        {/* forms */}
        <AnimatePresence mode="wait">
          {tab === "signin" ? (
            <motion.form
              key="signin"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSignIn}
              style={s.form}
            >
              {/* email */}
              <div>
                <label style={s.label}>Email Address</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><Mail size={16} /></span>
                  <input
                    id="signin-email"
                    type="email"
                    value={siEmail}
                    onChange={(e) => setSiEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={s.input}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><Lock size={16} /></span>
                  <input
                    id="signin-password"
                    type={showPass ? "text" : "password"}
                    value={siPass}
                    onChange={(e) => setSiPass(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ ...s.input, ...s.inputWithPadRight }}
                    placeholder="••••••••"
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
                <div style={s.forgotWrap}>
                  <Link href="/auth/forgot-password" style={s.forgotBtn}>
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button type="submit" disabled={loading} style={s.submitBtn(loading)}>
                {loading ? <><Spinner /> Signing In…</> : <>Sign In <ArrowRight size={16} /></>}
              </button>

              <p style={s.switchText}>
                Don&apos;t have an account?{" "}
                <button type="button" style={s.switchLink} onClick={() => switchTab("signup")}>
                  Create one
                </button>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSignUp}
              style={s.form}
            >
              {/* full name */}
              <div>
                <label style={s.label}>Full Name</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><User size={16} /></span>
                  <input
                    id="signup-name"
                    type="text"
                    value={suName}
                    onChange={(e) => setSuName(e.target.value)}
                    required
                    autoComplete="name"
                    style={s.input}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* email */}
              <div>
                <label style={s.label}>Email Address</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><Mail size={16} /></span>
                  <input
                    id="signup-email"
                    type="email"
                    value={suEmail}
                    onChange={(e) => setSuEmail(e.target.value)}
                    required
                    autoComplete="email"
                    style={s.input}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* phone */}
              <div>
                <label style={s.label}>Phone Number</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><Phone size={16} /></span>
                  <input
                    id="signup-phone"
                    type="tel"
                    value={suPhone}
                    onChange={(e) => setSuPhone(e.target.value)}
                    autoComplete="tel"
                    style={s.input}
                    placeholder="+233 20 123 4567"
                  />
                </div>
              </div>

              {/* password */}
              <div>
                <label style={s.label}>Create Password</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}><Lock size={16} /></span>
                  <input
                    id="signup-password"
                    type={showPass ? "text" : "password"}
                    value={suPass}
                    onChange={(e) => setSuPass(e.target.value)}
                    required
                    autoComplete="new-password"
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

              <button type="submit" disabled={loading} style={s.submitBtn(loading)}>
                {loading ? <><Spinner /> Creating Account…</> : <>Create Account <ArrowRight size={16} /></>}
              </button>

              <p style={s.switchText}>
                Already have an account?{" "}
                <button type="button" style={s.switchLink} onClick={() => switchTab("signin")}>
                  Sign in
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>

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
   Page export (Suspense wraps useSearchParams)
───────────────────────────────────────────── */
export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  );
}

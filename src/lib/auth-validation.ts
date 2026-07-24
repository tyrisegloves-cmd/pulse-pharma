/**
 * src/lib/auth-validation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, dependency-free validation helpers shared by the signup, login, and
 * password-reset flows. Centralized so every form enforces identical rules and
 * returns identical, user-friendly messages.
 *
 * Nothing here touches Supabase or React — it is fully unit-testable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * A loose-but-safe email check. We intentionally don't use a heavy regex — the
 * authoritative check is Supabase's own validator. This just catches obvious
 * typos before a round-trip.
 */
export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required.";
  // something@something.tld — minimal structural check
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(value)) return "Please enter a valid email address.";
  return null;
}

/**
 * Enforce a reasonably secure password. Returns `null` when valid, otherwise a
 * specific, actionable message explaining exactly what is missing.
 *
 * Rules:
 *   • At least 8 characters
 *   • At least one uppercase letter
 *   • At least one lowercase letter
 *   • At least one digit
 */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

/**
 * Confirm that two password entries match. Used by signup + reset-password.
 */
export function passwordsMatch(
  password: string,
  confirm: string
): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/**
 * Validate a full name. Kept permissive — we only require non-empty after trim.
 */
export function validateFullName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  return null;
}

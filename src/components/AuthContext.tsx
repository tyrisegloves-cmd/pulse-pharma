"use client";

/**
 * AuthContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides real Supabase authentication to the entire app.
 *
 * Exposed via useAuth():
 *   isLoggedIn      — true once a Supabase session is confirmed
 *   isLoading       — true while the initial session is being hydrated (prevents flash)
 *   user            — the Supabase User object (or null)
 *   role            — the user's role ('customer' | 'admin'), or null when signed out
 *   signIn()        — email + password sign-in, returns { error }
 *   signUp()        — email + password registration (+ profile metadata), returns { error }
 *   signOut()       — signs the user out of Supabase + clears local state
 *   resetPassword() — sends the Supabase password-reset email, returns { error }
 *   updatePassword()— sets a new password via supabase.auth.updateUser, returns { error }
 *
 * Session persistence is handled automatically by Supabase's cookie-based
 * storage (@supabase/ssr) + the onAuthStateChange listener — no manual
 * localStorage needed, and middleware can read the same session.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/services/profiles";
import type { UserRole } from "@/services/types";

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface SignInParams {
  email: string;
  password: string;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

interface AuthResult {
  error: AuthError | null;
}

interface AuthContextType {
  /** True once Supabase has confirmed a live session */
  isLoggedIn: boolean;
  /** True while the initial session check is in progress (avoids UI flash) */
  isLoading: boolean;
  /** The raw Supabase User object, or null if not signed in */
  user: User | null;
  /** The user's role, or null when signed out / still loading */
  role: UserRole | null;
  /** Sign in with email + password */
  signIn: (params: SignInParams) => Promise<AuthResult>;
  /** Register a new user with email + password (+ optional profile fields) */
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  /** Sign the current user out */
  signOut: () => Promise<void>;
  /** Send the Supabase password-reset email */
  resetPassword: (email: string) => Promise<AuthResult>;
  /** Set a new password for the authenticated user (post-reset) */
  updatePassword: (newPassword: string) => Promise<AuthResult>;

  // ── Backward-compat aliases so old call-sites don't break immediately ──
  /** @deprecated Use signIn() instead */
  login: () => void;
  /** @deprecated Use signOut() instead */
  logout: () => void;
}

/* ── Context ───────────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  user: null,
  role: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  login: () => {},
  logout: () => {},
});

/* ── Provider ──────────────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch the signed-in user's role from the profiles table. Called after the
   * session is established. Failures are non-fatal — we just fall back to null
   * (UI treats null as "customer-like"); the DB trigger creates the profile.
   */
  const refreshRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setRole(null);
      return;
    }
    const { data } = await getMyProfile();
    setRole(data?.role ?? null);
  }, []);

  /**
   * Subscribe to Supabase auth state changes.
   * This fires on:
   *   • App load   → INITIAL_SESSION  (restores a persisted session)
   *   • Sign in    → SIGNED_IN
   *   • Sign out   → SIGNED_OUT
   *   • Token refresh → TOKEN_REFRESHED
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsLoading(false);
      // Fetch the role whenever the user identity changes. Intentionally not
      // awaited — we don't want to block first paint of the session.
      void refreshRole(nextUser);
    });

    // Cleanup listener on unmount
    return () => subscription.unsubscribe();
  }, [refreshRole]);

  /* ── signIn ────────────────────────────────────────────────────────────── */
  const signIn = useCallback(
    async ({ email, password }: SignInParams): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      return { error };
    },
    []
  );

  /* ── signUp ────────────────────────────────────────────────────────────── */
  const signUp = useCallback(
    async ({ email, password, fullName, phone }: SignUpParams): Promise<AuthResult> => {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // Store extra profile fields in the user's metadata.
          // The DB trigger (handle_new_user) copies these into the profiles row
          // and assigns the default `customer` role.
          data: {
            full_name: fullName ?? "",
            phone: phone ?? "",
          },
        },
      });
      return { error };
    },
    []
  );

  /* ── signOut ───────────────────────────────────────────────────────────── */
  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setRole(null);
    // onAuthStateChange fires SIGNED_OUT → setUser(null) automatically
  }, []);

  /* ── resetPassword ─────────────────────────────────────────────────────── */
  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          // Where the user lands after clicking the link in the email.
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );
      return { error };
    },
    []
  );

  /* ── updatePassword ────────────────────────────────────────────────────── */
  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { error };
    },
    []
  );

  /* ── Backward-compat stubs ─────────────────────────────────────────────── */
  const login = useCallback(() => {
    console.warn(
      "[AuthContext] login() is deprecated. Use signIn() from useAuth()."
    );
  }, []);

  const logout = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        isLoading,
        user,
        role,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

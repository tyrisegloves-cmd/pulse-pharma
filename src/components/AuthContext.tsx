"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

const DEFAULT_USER = {
  name: "Kwame Mensah",
  email: "kwame.mensah@example.com",
  phone: "+233 20 123 4567",
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  user: DEFAULT_USER,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Single effect for initialization — reduces re-render passes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const stored = localStorage.getItem("pulse_isLoggedIn");
        setIsLoggedIn(stored === "true");
      } catch {
        // ignore storage error
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    try {
      localStorage.setItem("pulse_isLoggedIn", "true");
    } catch {
      // ignore storage error
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.setItem("pulse_isLoggedIn", "false");
    } catch {
      // ignore storage error
    }
  };

  // Return early while initializing to avoid exposing uninitialized state
  if (!isInitialized) {
    return (
      <AuthContext.Provider
        value={{
          isLoggedIn: false,
          login: () => {},
          logout: () => {},
          user: DEFAULT_USER,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        user: DEFAULT_USER,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

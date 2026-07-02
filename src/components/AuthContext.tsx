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

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  user: {
    name: "Kwame Mensah",
    email: "kwame.mensah@example.com",
    phone: "+233 20 123 4567",
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pulse_isLoggedIn");
      if (stored === "true") {
        setIsLoggedIn(true);
      }
    } catch {
      // ignore storage error
    } finally {
      setIsInitialized(true);
    }
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

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        user: {
          name: "Kwame Mensah",
          email: "kwame.mensah@example.com",
          phone: "+233 20 123 4567",
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

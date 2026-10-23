'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService, AuthUser } from "@/services/auth.service";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => AuthService.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      AuthService.getProfile()
        .then((fetched) => setUser(fetched))
        .catch(() => {
          // Token expired or invalid
          AuthService.logout();
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<AuthUser> => {
    const response = await AuthService.login({ identifier, password });
    const signedInUser = { ...response.user, mustChangePassword: response.mustChangePassword };
    setUser(signedInUser);
    return signedInUser;
  };

  const logout = () => {
    setUser(null);
    AuthService.logout();
    router.replace("/login");
  };

  const refreshProfile = async () => {
    try {
      const updated = await AuthService.getProfile();
      setUser(updated);
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

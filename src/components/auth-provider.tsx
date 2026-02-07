"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import PocketBase, { type RecordModel } from "pocketbase";
import pb from "@/lib/pocketbase";

interface AuthContext {
  pb: PocketBase;
  user: RecordModel | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithOAuth: (provider: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

/** Sync PocketBase auth token to a cookie so middleware can read it. */
function syncCookie(pbInstance: PocketBase) {
  const isValid = pbInstance.authStore.isValid;
  if (isValid) {
    document.cookie = `pb_auth=${pbInstance.authStore.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    document.cookie = "pb_auth=; path=/; max-age=0";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<RecordModel | null>(
    pb.authStore.record as RecordModel | null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as RecordModel | null);
      syncCookie(pb);
    });

    // Initial sync
    setUser(pb.authStore.record as RecordModel | null);
    syncCookie(pb);
    setIsLoading(false);

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string) => {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name,
      });
      // Auto-login after signup
      await pb.collection("users").authWithPassword(email, password);
    },
    []
  );

  const loginWithOAuth = useCallback(
    async (provider: string) => {
      await pb.collection("users").authWithOAuth2({ provider });
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
    router.push("/login");
  }, [router]);

  return (
    <AuthContext value={{ pb, user, isLoading, login, signup, loginWithOAuth, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

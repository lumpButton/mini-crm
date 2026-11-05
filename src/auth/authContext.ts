import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "../lib/types";

export type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

// For pages behind RequireAuth, where a profile is guaranteed.
export function useProfile(): Profile {
  const { profile } = useAuth();
  if (!profile) {
    throw new Error("useProfile must be used behind RequireAuth");
  }
  return profile;
}

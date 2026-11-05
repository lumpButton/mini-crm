import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import type { Profile } from "../lib/types";
import { AuthContext, type AuthState } from "./authContext";

type ProfileState = {
  userId: string | null;
  profile: Profile | null;
  error: string | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState>({
    userId: null,
    profile: null,
    error: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });

    // Only store the session here: calling other supabase methods inside this
    // callback can deadlock the auth client, so the profile is loaded in a separate effect.
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLoaded(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfileState({
          userId,
          profile: data,
          error: error
            ? error.message
            : data
              ? null
              : "Для этой учётной записи не настроен профиль. Обратитесь к администратору.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const profileReady = profileState.userId === userId;

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile: userId && profileReady ? profileState.profile : null,
      profileError: userId && profileReady ? profileState.error : null,
      loading: !sessionLoaded || (userId !== null && !profileReady),
      signOut,
    }),
    [session, userId, profileReady, profileState, sessionLoaded, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

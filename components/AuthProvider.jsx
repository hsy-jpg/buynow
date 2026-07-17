"use client";

// Supabase Auth 기반 인증. signUp/signIn/signOut/user 시그니처는 이전 localStorage mock과 동일하게 유지.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile(session) {
      if (!session?.user) {
        if (active) setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("buynow_profiles")
        .select("nickname")
        .eq("id", session.user.id)
        .single();
      if (!active) return;
      setUser({
        id: session.user.id,
        email: session.user.email,
        nickname: profile?.nickname || session.user.email.split("@")[0],
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session).then(() => {
        if (active) setReady(true);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      signUp: async ({ email, password, nickname }) => {
        const emailNorm = email.trim().toLowerCase();
        if (!emailNorm || !password) return { error: "이메일과 비밀번호를 입력해주세요" };
        const { data, error } = await supabase.auth.signUp({
          email: emailNorm,
          password,
          options: { data: { nickname: nickname?.trim() || emailNorm.split("@")[0] } },
        });
        if (error) return { error: error.message };
        if (!data.session) {
          return { error: null, needsEmailConfirm: true };
        }
        return { error: null };
      },
      signIn: async ({ email, password }) => {
        const emailNorm = email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({ email: emailNorm, password });
        if (error) return { error: "이메일 또는 비밀번호가 올바르지 않아요" };
        return { error: null };
      },
      signOut: () => supabase.auth.signOut(),
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

// 모의 인증: 실제 서버/DB 없이 localStorage에 계정을 저장한다.
// 나중에 Supabase Auth로 교체할 때 signUp/signIn/signOut/user 시그니처만 유지하면 됨.
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setUsers(JSON.parse(localStorage.getItem("auth_users") || "[]"));
      setSession(JSON.parse(localStorage.getItem("auth_session") || "null"));
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("auth_users", JSON.stringify(users));
  }, [users, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("auth_session", JSON.stringify(session));
  }, [session, ready]);

  const value = useMemo(
    () => ({
      user: session,
      ready,
      signUp: ({ email, password, nickname }) => {
        const emailNorm = email.trim().toLowerCase();
        if (!emailNorm || !password) return { error: "이메일과 비밀번호를 입력해주세요" };
        if (users.some((u) => u.email === emailNorm)) {
          return { error: "이미 가입된 이메일이에요" };
        }
        const newUser = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email: emailNorm,
          password,
          nickname: nickname.trim() || emailNorm.split("@")[0],
        };
        setUsers((prev) => [...prev, newUser]);
        setSession({ id: newUser.id, email: newUser.email, nickname: newUser.nickname });
        return { error: null };
      },
      signIn: ({ email, password }) => {
        const emailNorm = email.trim().toLowerCase();
        const found = users.find((u) => u.email === emailNorm && u.password === password);
        if (!found) return { error: "이메일 또는 비밀번호가 올바르지 않아요" };
        setSession({ id: found.id, email: found.email, nickname: found.nickname });
        return { error: null };
      },
      signOut: () => setSession(null),
    }),
    [users, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

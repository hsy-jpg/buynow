"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const { error } = await signIn({ email, password });
    if (error) {
      setError(error);
      return;
    }
    router.push("/mypage");
  }

  return (
    <>
      <div className="subpage-back">
        <Link href="/mypage">‹ 마이페이지</Link>
      </div>
      <div className="auth-card">
        <h2>로그인</h2>
        <form onSubmit={onSubmit}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="pill-btn primary">로그인</button>
        </form>
        <p className="auth-switch">
          계정이 없으신가요? <Link href="/signup">회원가입</Link>
        </p>
      </div>
    </>
  );
}

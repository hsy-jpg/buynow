"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    const { error } = signUp({ email, password, nickname });
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
        <h2>회원가입</h2>
        <form onSubmit={onSubmit}>
          <label>
            닉네임
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 (선택)"
            />
          </label>
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
          <button type="submit" className="pill-btn primary">회원가입</button>
        </form>
        <p className="auth-switch">
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export function MypageHeader() {
  const { user, ready, signOut } = useAuth();

  if (!ready) return null;

  if (!user) {
    return (
      <div className="login-banner">
        <img src="/images/hero-grocery.jpg" alt="장보기하는 사람 일러스트" />
        <div className="overlay">
          <p>로그인하고 내 찜 목록과 가계부를 저장해보세요</p>
          <Link href="/login">
            <button type="button">로그인 / 회원가입</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="account-card">
      <span className="account-emoji">🙂</span>
      <div className="account-info">
        <div className="account-name">{user.nickname}님</div>
        <div className="account-email">{user.email}</div>
      </div>
      <button type="button" className="logout-btn" onClick={signOut}>로그아웃</button>
    </div>
  );
}

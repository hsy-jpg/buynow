import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <img src="/images/logo-header.png" alt="오늘사요?" className="brand-logo" />
      </Link>
      <div className="header-icons">
        <NotificationBell />
        <Link href="/mypage" className="icon-btn" title="마이페이지">👤</Link>
      </div>
    </header>
  );
}

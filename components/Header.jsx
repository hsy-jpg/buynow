import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="mascot">🌱</span> 오늘사요?
      </Link>
      <div className="header-icons">
        <NotificationBell />
        <Link href="/mypage" className="icon-btn" title="마이페이지">👤</Link>
      </div>
    </header>
  );
}

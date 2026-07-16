"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "🏠", label: "홈" },
  { href: "/main", icon: "📊", label: "메인" },
  { href: "/mypage", icon: "👤", label: "마이" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={pathname === tab.href ? "active" : ""}
        >
          <span className="icon">{tab.icon}</span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

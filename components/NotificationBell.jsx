"use client";

import Link from "next/link";
import { useNotifications } from "./NotificationProvider";

export function NotificationBell() {
  const { unreadCount, ready } = useNotifications();

  return (
    <Link href="/mypage/notifications" className="icon-btn" title="알림">
      🔔
      {ready && unreadCount > 0 && (
        <span className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
      )}
    </Link>
  );
}

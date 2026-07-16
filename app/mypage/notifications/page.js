"use client";

import Link from "next/link";
import { useNotifications } from "@/components/NotificationProvider";

const LEVEL_DOT = { good: "🟢", bad: "🔴" };

export default function NotificationsPage() {
  const { notifications, ready, markRead, markAllRead } = useNotifications();

  if (!ready) return null;

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <>
      <div className="subpage-back">
        <Link href="/mypage">‹ 마이페이지</Link>
      </div>
      <div className="section-title">
        🔔 알림함
        {hasUnread && (
          <button type="button" className="notif-readall" onClick={markAllRead}>
            모두 읽음
          </button>
        )}
      </div>
      <div className="notif-hint">
        월 1회 데이터 갱신 시, 찜한 품목이 전월 대비 ±{10}% 이상 변동하면 여기로 알려드려요.
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🔔</span>
          아직 알림이 없어요
          <br />
          <Link href="/main">메인에서 관심 품목에 알림을 켜보세요</Link>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <button
              type="button"
              className={`notif-row ${n.read ? "read" : "unread"}`}
              key={n.id}
              onClick={() => markRead(n.id)}
            >
              <span className="dot">{LEVEL_DOT[n.level]}</span>
              <span className="notif-body">
                <span className="notif-msg">{n.message}</span>
                <span className="notif-month">{n.yearMonth}</span>
              </span>
              {!n.read && <span className="notif-new">NEW</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

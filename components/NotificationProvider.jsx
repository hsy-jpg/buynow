"use client";

// 앱 내 알림함: 실시간 푸시 대신, 월 1회 데이터 갱신마다 찜+알림설정된 품목의
// 전월비 등락률이 임계치를 넘으면 알림함에 항목을 쌓아둔다. (PRD 3.3 "알림 설정")
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useZzim } from "./ZzimProvider";

const NotificationContext = createContext(null);
const THRESHOLD_PCT = 10;

export function NotificationProvider({ feed, latestMonth, children }) {
  const { alarm } = useZzim();
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setNotifications(JSON.parse(localStorage.getItem("notifications") || "[]"));
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications, ready]);

  useEffect(() => {
    if (!ready || !latestMonth) return;
    const feedById = new Map(feed.map((f) => [f.id, f]));
    setNotifications((prev) => {
      const existingKeys = new Set(prev.map((n) => `${n.productId}__${n.yearMonth}`));
      const fresh = [];
      for (const id of alarm) {
        const f = feedById.get(id);
        if (!f || f.change == null || Math.abs(f.change) < THRESHOLD_PCT) continue;
        const key = `${id}__${latestMonth}`;
        if (existingKeys.has(key)) continue;
        const level = f.change >= 0 ? "bad" : "good";
        const sign = f.change >= 0 ? "+" : "";
        fresh.push({
          id: `${key}__${Math.random().toString(36).slice(2, 8)}`,
          productId: id,
          name: f.name,
          emoji: f.emoji,
          change: f.change,
          yearMonth: latestMonth,
          level,
          message: `${f.emoji} ${f.name} 전월 대비 ${sign}${f.change}% 변동했어요 (${latestMonth})`,
          read: false,
        });
      }
      return fresh.length > 0 ? [...fresh, ...prev] : prev;
    });
  }, [alarm, feed, latestMonth, ready]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      ready,
      markRead: (id) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    }),
    [notifications, ready]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

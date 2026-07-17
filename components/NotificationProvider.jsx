"use client";

// 앱 내 알림함: 실시간 푸시 대신, 월 1회 데이터 갱신마다 찜+알림설정된 품목의
// 전월비 등락률이 임계치를 넘으면 알림함에 항목을 쌓아둔다. (PRD 3.3 "알림 설정")
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";
import { useZzim } from "./ZzimProvider";

const NotificationContext = createContext(null);
const THRESHOLD_PCT = 10;

function toClient(row) {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    emoji: row.emoji,
    change: row.change,
    yearMonth: row.year_month,
    level: row.level,
    message: row.message,
    read: row.read,
  };
}

export function NotificationProvider({ feed, latestMonth, children }) {
  const { user, ready: authReady } = useAuth();
  const { alarm, ready: zzimReady } = useZzim();
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);
  const notificationsRef = useRef([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (!authReady) return;
    let active = true;

    if (!user) {
      setNotifications([]);
      setReady(true);
      return;
    }

    setReady(false);
    supabase
      .from("buynow_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setNotifications((data || []).map(toClient));
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [user, authReady]);

  useEffect(() => {
    if (!ready || !zzimReady || !user || !latestMonth) return;
    const feedById = new Map(feed.map((f) => [f.id, f]));
    const existingKeys = new Set(notificationsRef.current.map((n) => `${n.productId}__${n.yearMonth}`));
    const fresh = [];
    for (const id of alarm) {
      const f = feedById.get(id);
      if (!f || f.change == null || Math.abs(f.change) < THRESHOLD_PCT) continue;
      const key = `${id}__${latestMonth}`;
      if (existingKeys.has(key)) continue;
      const level = f.change >= 0 ? "bad" : "good";
      const sign = f.change >= 0 ? "+" : "";
      fresh.push({
        user_id: user.id,
        product_id: id,
        name: f.name,
        emoji: f.emoji,
        change: f.change,
        year_month: latestMonth,
        level,
        message: `${f.emoji} ${f.name} 전월 대비 ${sign}${f.change}% 변동했어요 (${latestMonth})`,
        read: false,
      });
    }
    if (fresh.length === 0) return;
    supabase
      .from("buynow_notifications")
      .insert(fresh)
      .select()
      .then(({ data }) => {
        if (data) setNotifications((prev) => [...data.map(toClient), ...prev]);
      });
  }, [alarm, feed, latestMonth, ready, zzimReady, user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      ready,
      markRead: (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        supabase.from("buynow_notifications").update({ read: true }).eq("id", id).then();
      },
      markAllRead: () => {
        if (!user) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        supabase
          .from("buynow_notifications")
          .update({ read: true })
          .eq("user_id", user.id)
          .eq("read", false)
          .then();
      },
    }),
    [notifications, ready, user]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

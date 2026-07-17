"use client";

// 찜/알림: 로그인한 사용자는 Supabase buynow_zzim/buynow_alarm 테이블에, 로그인하지 않은
// 사용자는 이 브라우저의 localStorage에 저장한다(기기 간 동기화는 되지 않음) — LedgerClient와 동일한 패턴.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";

const GUEST_ZZIM_KEY = "oneulsaya_zzim_guest";
const GUEST_ALARM_KEY = "oneulsaya_alarm_guest";

function loadGuestList(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestList(key, list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(list));
}

const ZzimContext = createContext(null);

export function ZzimProvider({ children }) {
  const { user, ready: authReady } = useAuth();
  const [zzim, setZzim] = useState([]);
  const [alarm, setAlarm] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    let active = true;

    if (!user) {
      setZzim(loadGuestList(GUEST_ZZIM_KEY));
      setAlarm(loadGuestList(GUEST_ALARM_KEY));
      setReady(true);
      return;
    }

    setReady(false);
    Promise.all([
      supabase.from("buynow_zzim").select("product_id").eq("user_id", user.id),
      supabase.from("buynow_alarm").select("product_id").eq("user_id", user.id),
    ]).then(([zzimRes, alarmRes]) => {
      if (!active) return;
      setZzim((zzimRes.data || []).map((r) => r.product_id));
      setAlarm((alarmRes.data || []).map((r) => r.product_id));
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [user, authReady]);

  const value = useMemo(
    () => ({
      zzim,
      alarm,
      ready,
      toggleZzim: async (id) => {
        const has = zzim.includes(id);
        const next = has ? zzim.filter((x) => x !== id) : [...zzim, id];
        setZzim(next);
        if (!user) {
          saveGuestList(GUEST_ZZIM_KEY, next);
          return;
        }
        if (has) {
          await supabase.from("buynow_zzim").delete().eq("user_id", user.id).eq("product_id", id);
        } else {
          await supabase.from("buynow_zzim").insert({ user_id: user.id, product_id: id });
        }
      },
      toggleAlarm: async (id) => {
        const has = alarm.includes(id);
        const next = has ? alarm.filter((x) => x !== id) : [...alarm, id];
        setAlarm(next);
        if (!user) {
          saveGuestList(GUEST_ALARM_KEY, next);
          return;
        }
        if (has) {
          await supabase.from("buynow_alarm").delete().eq("user_id", user.id).eq("product_id", id);
        } else {
          await supabase.from("buynow_alarm").insert({ user_id: user.id, product_id: id });
        }
      },
    }),
    [zzim, alarm, ready, user]
  );

  return <ZzimContext.Provider value={value}>{children}</ZzimContext.Provider>;
}

export function useZzim() {
  const ctx = useContext(ZzimContext);
  if (!ctx) throw new Error("useZzim must be used within ZzimProvider");
  return ctx;
}

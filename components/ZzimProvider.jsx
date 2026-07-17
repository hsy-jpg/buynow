"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthProvider";

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
      setZzim([]);
      setAlarm([]);
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
        if (!user) return;
        const has = zzim.includes(id);
        setZzim((prev) => (has ? prev.filter((x) => x !== id) : [...prev, id]));
        if (has) {
          await supabase.from("buynow_zzim").delete().eq("user_id", user.id).eq("product_id", id);
        } else {
          await supabase.from("buynow_zzim").insert({ user_id: user.id, product_id: id });
        }
      },
      toggleAlarm: async (id) => {
        if (!user) return;
        const has = alarm.includes(id);
        setAlarm((prev) => (has ? prev.filter((x) => x !== id) : [...prev, id]));
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

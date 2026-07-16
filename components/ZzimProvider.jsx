"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ZzimContext = createContext(null);

export function ZzimProvider({ children }) {
  const [zzim, setZzim] = useState([]);
  const [alarm, setAlarm] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setZzim(JSON.parse(localStorage.getItem("zzim") || "[]"));
      setAlarm(JSON.parse(localStorage.getItem("alarm") || "[]"));
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("zzim", JSON.stringify(zzim));
  }, [zzim, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("alarm", JSON.stringify(alarm));
  }, [alarm, ready]);

  const value = useMemo(
    () => ({
      zzim,
      alarm,
      ready,
      toggleZzim: (id) =>
        setZzim((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleAlarm: (id) =>
        setAlarm((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    }),
    [zzim, alarm, ready]
  );

  return <ZzimContext.Provider value={value}>{children}</ZzimContext.Provider>;
}

export function useZzim() {
  const ctx = useContext(ZzimContext);
  if (!ctx) throw new Error("useZzim must be used within ZzimProvider");
  return ctx;
}

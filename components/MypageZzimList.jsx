"use client";

import { useZzim } from "./ZzimProvider";

export function MypageZzimList({ products, deviationById, signals }) {
  const { zzim, ready } = useZzim();

  if (!ready) return null;

  if (zzim.length === 0) {
    return (
      <div className="empty-state" style={{ margin: "12px 0" }}>
        <span className="emoji">🤍</span>찜한 품목이 없어요
      </div>
    );
  }

  return (
    <div className="zzim-list-card">
      {zzim.map((id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return null;
        const change = deviationById[id];
        const sig = signals[id];
        const sign = change != null && change >= 0 ? "+" : "";
        const color = change != null && change >= 0 ? "var(--color-signal-red)" : "var(--color-signal-green)";
        return (
          <div className="zzim-row" key={id}>
            <span className="emoji">{product.emoji}</span>
            <span className="name">{product.name}</span>
            <span className="pct" style={{ color }}>
              {change != null ? `${sign}${change}%` : "-"}
            </span>
            <span className={`dot ${sig?.level ?? "unknown"}`} />
          </div>
        );
      })}
    </div>
  );
}

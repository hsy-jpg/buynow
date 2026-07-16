"use client";

import { useZzim } from "./ZzimProvider";

const LEVEL_DOT = { good: "🟢", normal: "🟡", bad: "🔴", unknown: "⚪" };

export function ZzimHomeSection({ products, signals }) {
  const { zzim, ready } = useZzim();

  if (!ready) return null;

  if (zzim.length === 0) {
    return (
      <div className="empty-state">
        <span className="emoji">🌱</span>
        아직 찜한 품목이 없어요
        <br />
        메인 화면에서 관심 품목을 찜해보세요
      </div>
    );
  }

  return (
    <div>
      {zzim.map((id) => {
        const product = products.find((p) => p.id === id);
        const sig = signals[id];
        if (!product || !sig) return null;
        const gaugePos = sig.percentile == null ? 50 : Math.min(100, Math.max(0, sig.percentile));
        const fillVar =
          sig.level === "good" ? "var(--color-signal-green)"
          : sig.level === "bad" ? "var(--color-signal-red)"
          : "var(--color-signal-yellow)";
        return (
          <div className="zzim-card" key={id}>
            <div className="row">
              <div className="item">
                <span className="emoji">{product.emoji}</span>
                {product.name}
              </div>
              <span className={`badge ${sig.level}`}>
                {sig.label} {LEVEL_DOT[sig.level]}
              </span>
            </div>
            <div className="desc">{sig.message}</div>
            <div className="gauge">
              <div className="fill" style={{ width: `${gaugePos}%`, background: fillVar }} />
              <div className="marker" style={{ left: `calc(${gaugePos}% - 1px)` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

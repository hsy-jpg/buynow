"use client";

import { useState } from "react";

function verdictFor(diffPct) {
  if (diffPct == null) return { level: "unknown", label: "정보 부족" };
  if (diffPct <= 3) return { level: "good", label: "지금 사기 좋음" };
  if (diffPct <= 15) return { level: "normal", label: "보통" };
  return { level: "bad", label: "미루면 좋음" };
}

export function SimulatorClient({ products, simStats }) {
  const [selectedIds, setSelectedIds] = useState(products[0] ? [products[0].id] : []);

  function addProduct(id) {
    if (!id || selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
  }

  function removeProduct(id) {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  const items = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map((product) => {
      const stats = simStats[product.id] ?? null;
      return { product, stats, verdict: verdictFor(stats?.diffPct ?? null) };
    });

  const buyNow = items.filter((i) => i.verdict.level === "good" || i.verdict.level === "normal");
  const postpone = items.filter((i) => i.verdict.level === "bad");

  return (
    <div className="sim-card">
      <select
        className="sim-select"
        value=""
        onChange={(e) => addProduct(e.target.value)}
      >
        <option value="" disabled>+ 비교할 품목 추가</option>
        {products
          .filter((p) => !selectedIds.includes(p.id))
          .map((p) => (
            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
          ))}
      </select>

      {items.length === 0 ? (
        <div className="conclusion">품목을 추가하면 비교 결과를 보여드려요</div>
      ) : (
        <>
          <div className="sim-chip-row">
            {items.map(({ product }) => (
              <span className="sim-chip" key={product.id}>
                {product.emoji} {product.name}
                <button type="button" onClick={() => removeProduct(product.id)}>✕</button>
              </span>
            ))}
          </div>
          <div className="sim-row">
            <span>보통 가장 쌌던 달</span>
            <span className="val">지수 {stats.low.toFixed(1)} ({stats.lowLabel})</span>
          </div>

          <div className="conclusion">
            {stats.diffPct <= 3
              ? `지금이 보통 가장 쌌던 시기와 비슷해요. 지금 사도 좋아요! 🟢`
              : `보통 가장 쌌던 시기 대비 현재 약 ${stats.diffPct}% 비싼 도매가 수준이에요.`}
          </div>
        </>
      )}
    </div>
  );
}

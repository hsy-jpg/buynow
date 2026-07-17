"use client";

import { useState } from "react";

export function SimulatorClient({ products, simStats }) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = products.find((p) => p.id === productId);
  const stats = simStats[productId];

  return (
    <div className="sim-card">
      <select
        className="sim-select"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
        ))}
      </select>

      {stats ? (
        <>
          <div className="sim-row">
            <span>이번 달 도매가 지수</span>
            <span className="val">지수 {stats.now.toFixed(1)}</span>
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
      ) : (
        <div className="conclusion">품목을 선택하면 비교 결과를 보여드려요</div>
      )}
    </div>
  );
}

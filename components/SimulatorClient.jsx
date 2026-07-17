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

          <div className="sim-compare-list">
            {items.map(({ product, stats, verdict }) => (
              <div className="sim-compare-row" key={product.id}>
                <div className="sim-compare-head">
                  <span className="emoji">{product.emoji}</span>
                  <span className="name">{product.name}</span>
                  <span className={`badge ${verdict.level}`}>{verdict.label}</span>
                </div>
                {stats ? (
                  <>
                    <div className="sim-row">
                      <span>이번 달 도매가 지수</span>
                      <span className="val">지수 {stats.now.toFixed(1)}</span>
                    </div>
                    <div className="sim-row">
                      <span>보통 가장 쌌던 달 ({stats.lowMonth}월)</span>
                      <span className="val">지수 {stats.lowAvgIndex.toFixed(1)}</span>
                    </div>
                    <div className="sim-row">
                      <span>차이</span>
                      <span className="val">{stats.diffPct > 0 ? "+" : ""}{stats.diffPct}%</span>
                    </div>
                  </>
                ) : (
                  <div className="sim-row"><span>비교할 데이터가 부족해요</span></div>
                )}
              </div>
            ))}
          </div>

          <div className="conclusion">
            {postpone.length === 0
              ? "고른 품목 모두 지금 사도 좋은 시기예요! 🟢"
              : buyNow.length === 0
              ? "고른 품목 전부 다음으로 미루는 걸 추천해요."
              : (
                <>
                  ✅ 지금 사도 좋아요: {buyNow.map((i) => i.product.name).join(", ")}
                  <br />
                  ⏸ 다음으로 미뤄도 좋아요: {postpone.map((i) => i.product.name).join(", ")}
                </>
              )}
          </div>
        </>
      )}
    </div>
  );
}

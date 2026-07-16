"use client";

import { useMemo, useState } from "react";
import { LineChart } from "./LineChart";
import { useZzim } from "./ZzimProvider";

const SIGNAL_EMOJI = { good: "😊", normal: "😐", bad: "😥", unknown: "🤔" };
const SIGNAL_DOT = { good: "🟢", normal: "🟡", bad: "🔴", unknown: "⚪" };

export function ExploreClient({ categories, products, signals }) {
  const { zzim, alarm, toggleZzim, toggleAlarm, ready } = useZzim();
  const [selectedCategory, setSelectedCategory] = useState(categories[0].key);
  const [selectedProductId, setSelectedProductId] = useState(
    products.find((p) => p.uiCategory === categories[0].key)?.id ?? null
  );
  const [search, setSearch] = useState("");

  const productsInCategory = useMemo(
    () => products.filter((p) => p.uiCategory === selectedCategory),
    [products, selectedCategory]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  function pickCategory(key) {
    setSelectedCategory(key);
    const first = products.find((p) => p.uiCategory === key);
    setSelectedProductId(first ? first.id : null);
  }

  function onSearchChange(e) {
    const q = e.target.value;
    setSearch(q);
    const trimmed = q.trim();
    if (!trimmed) return;
    const match = products.find((p) => p.name.includes(trimmed));
    if (match) {
      setSelectedCategory(match.uiCategory);
      setSelectedProductId(match.id);
    }
  }

  const sig = selectedProduct ? signals[selectedProduct.id] : null;
  const isZzim = selectedProduct ? zzim.includes(selectedProduct.id) : false;
  const isAlarm = selectedProduct ? alarm.includes(selectedProduct.id) : false;
  const isNonStandardBase = selectedProduct && selectedProduct.basePeriod !== "2020=100";

  return (
    <>
      <div className="search-row">
        <span>🔍</span>
        <input
          type="text"
          placeholder="품목 검색 (예: 배추, 계란)"
          value={search}
          onChange={onSearchChange}
        />
        <button className="filter-btn" type="button">필터 ▾</button>
      </div>

      <div className="section-title">카테고리</div>
      <div className="category-grid">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`category-tile ${c.key === selectedCategory ? "active" : ""}`}
            onClick={() => pickCategory(c.key)}
          >
            <img src={c.image} alt={c.label} />
            <div className="label">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="chip-row">
        {productsInCategory.length === 0 ? (
          <div className="no-result">이 카테고리엔 품목이 없어요</div>
        ) : (
          productsInCategory.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip ${p.id === selectedProductId ? "active" : ""}`}
              onClick={() => setSelectedProductId(p.id)}
            >
              {p.emoji} {p.name}
            </button>
          ))
        )}
      </div>

      <div className="chart-card">
        <div className="head">
          <div>
            <div className="name">
              {selectedProduct ? `${selectedProduct.emoji} ${selectedProduct.name}` : "품목을 선택하세요"}
            </div>
            <div className="base">
              {selectedProduct ? `기준: ${selectedProduct.basePeriod} · 도매(생산자) 물가지수` : ""}
            </div>
          </div>
          <div className="base">월별 · 2021.01~2026.05</div>
        </div>
        {selectedProduct && <LineChart series={selectedProduct.series} />}
        <div className="disclaimer">⚠️ 생산자물가지수(도매가) 기준이에요. 실제 마트 소매가와 차이가 있을 수 있어요.</div>
        {isNonStandardBase && (
          <div className="disclaimer warn">
            ⚠️ {selectedProduct.name}은(는) 기준 연월이 {selectedProduct.basePeriod}로 달라요. 다른 품목과 지수를 직접 비교하지 말고, 등락률로만 참고하세요.
          </div>
        )}
      </div>

      {sig && (
        <div className={`signal-card ${sig.level}`}>
          <div className="signal-emoji">{SIGNAL_EMOJI[sig.level]}</div>
          <div className="signal-label">{SIGNAL_DOT[sig.level]} {sig.label}</div>
          <div className="signal-msg">{sig.message}</div>
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          className={`pill-btn ghost ${isZzim ? "on" : ""}`}
          disabled={!selectedProduct || !ready}
          onClick={() => selectedProduct && toggleZzim(selectedProduct.id)}
        >
          {isZzim ? "❤️ 찜 완료" : "🤍 찜하기"}
        </button>
        <button
          type="button"
          className={`pill-btn ghost ${isAlarm ? "on" : ""}`}
          disabled={!selectedProduct || !ready}
          onClick={() => selectedProduct && toggleAlarm(selectedProduct.id)}
        >
          {isAlarm ? "🔔 알림 설정됨" : "🔔 알림설정"}
        </button>
      </div>
    </>
  );
}

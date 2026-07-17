"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeviationBarChart } from "./LineChart";
import { useZzim } from "./ZzimProvider";

const CATEGORY_EMOJI = { grain: "🍚", vegetable: "🥬", fruit: "🍇", seafood: "🦐", meat: "🥩" };

// 품목명 -> 이모지 매핑 (메인화면_실제앱_반영_명령어.md 8절 표 그대로)
const EMOJI_BY_NAME = {
  쌀: "🍚", 보리쌀: "🌾", 콩: "🫘", 감자: "🥔", 고구마: "🍠",
  배추: "🥬", 시금치: "🥬", 상추: "🥬", 부추: "🥬", 수박: "🍉", 참외: "🍈", 오이: "🥒", 호박: "🎃", 토마토: "🍅",
  딸기: "🍓", 파프리카: "🫑", 무: "🥕", 풋고추: "🌶️", 건고추: "🌶️", 마늘: "🧄", 파: "🥬", 양파: "🧅", 생강: "🫚", 버섯: "🍄", 피망: "🫑", 양배추: "🥬",
  사과: "🍎", 배: "🍐", 복숭아: "🍑", 포도: "🍇", 감귤: "🍊", 감: "🟠",
  쇠고기: "🥩", 돼지고기: "🐷", 닭고기: "🍗", 오리고기: "🦆", 달걀: "🥚", 벌꿀: "🍯",
  원목: "🪵", 산나물: "🌿", 밤: "🌰",
  가자미: "🐟", 넙치: "🐟", 조기: "🐟", 갈치: "🐟", 고등어: "🐟", "조피볼락(우럭)": "🐟", 기타어류: "🐟", 멸치: "🐟", 게: "🦀", 새우: "🦐",
  굴: "🦪", 조개: "🐚", 전복: "🐚", 물오징어: "🦑", 냉동고등어: "🐟", 냉동오징어: "🦑", 냉동명태: "🐟", 명태건제품: "🐟", 멸치건제품: "🐟", 오징어건제품: "🦑", 김: "🍙",
};

function emojiFor(name) {
  return EMOJI_BY_NAME[name] || "🌿";
}

const TIER_COLOR = { vgreen: "#2E7D32", green: "#4CAF50", yellow: "#FFC107", orange: "#FB8C00", red: "#F1553E" };

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

/** 원자료(월별지수)만으로 캘린더 월별(1~12월) "연평균 대비 편차(%)"를 계산한다 (품목당 1회, 재사용). */
function computeMonthlyDeviation(series) {
  const byMonth = Array.from({ length: 12 }, () => []);
  series.forEach((d) => {
    if (d.index != null) byMonth[d.month - 1].push(d.index);
  });
  const monthAvg = byMonth.map((arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null));
  const validAvgs = monthAvg.filter((v) => v != null);
  if (validAvgs.length === 0) return monthAvg;
  const annualAvg = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length;
  return monthAvg.map((v) => (v == null ? null : Math.round((v / annualAvg - 1) * 1000) / 10));
}

/** 5단계 분류: 이번 달 편차값이 12개월 분포에서 차지하는 위치 */
function classifyTier(devs, curIdx) {
  const curVal = devs[curIdx];
  if (curVal == null) return null;
  const valid = devs.filter((v) => v != null);
  const n = valid.length;
  const lessCount = valid.filter((v) => v < curVal).length;
  const pct = n > 1 ? lessCount / (n - 1) : 0.5;
  if (pct <= 0.2) return "vgreen";
  if (pct <= 0.4) return "green";
  if (pct <= 0.6) return "yellow";
  if (pct <= 0.8) return "orange";
  return "red";
}

function tierInfo(tier, isMin, isMax) {
  return {
    vgreen: { label: isMin ? "가장 쌈" : "많이 쌈", emoji: "😄", phrase: isMin ? "가장 쌀 때" : "많이 쌀 때", bg: "#E3F2E3" },
    green: { label: "쌈", emoji: "🙂", phrase: "쌀 때", bg: "#EAF7EA" },
    yellow: { label: "보통", emoji: "😐", phrase: "보통일 때", bg: "#FFF8E1" },
    orange: { label: "비쌈", emoji: "😕", phrase: "비쌀 때", bg: "#FFEEDD" },
    red: { label: isMax ? "가장 비쌈" : "많이 비쌈", emoji: isMax ? "😫" : "😟", phrase: isMax ? "가장 비쌀 때" : "많이 비쌀 때", bg: "#FDEDEA" },
  }[tier];
}

/** 그래프 하단 "보통 O월에 비싸요/싸요" 문구 — 상/하위 33% 월 그룹핑 */
function riseFallInfo(devs) {
  const valid = devs.map((v, i) => ({ v, month: i + 1 })).filter((x) => x.v != null);
  const n = valid.length;
  const rankPct = (v) => (n > 1 ? valid.filter((x) => x.v < v).length / (n - 1) : 0.5);
  const expensive = [];
  const cheap = [];
  valid.forEach(({ v, month }) => {
    const p = rankPct(v);
    if (p > 0.66) expensive.push(month);
    else if (p <= 0.33) cheap.push(month);
  });
  const maxAbs = Math.max(...valid.map((x) => Math.abs(x.v)), 0);
  if (maxAbs < 5 || expensive.length === 0 || cheap.length === 0) {
    return { flat: true, text: "보통 가격 변동이 없는 편이에요" };
  }
  return {
    flat: false,
    riseText: `보통 ${expensive.join(", ")}월에 비싸요`,
    fallText: `보통 ${cheap.join(", ")}월에 싸요`,
  };
}

function fmtPct(v) {
  return (v > 0 ? "+" : "") + v.toFixed(1) + "%";
}

/** 그래프 박스 전용 2차원(플랫) 하트 아이콘 — 하단 액션 버튼의 이모지 하트와는 별개 스타일 */
function FlatHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function ExploreClient({ categories, products }) {
  const { zzim, alarm, toggleZzim, toggleAlarm, ready } = useZzim();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(categories[0].key);
  const [selectedProductId, setSelectedProductId] = useState(
    products.find((p) => p.uiCategory === categories[0].key)?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [caveatOpen, setCaveatOpen] = useState(false);
  const caveatRef = useRef(null);

  // 다른 화면(대시보드 등)에서 특정 품목을 눌러 /main?product=ID 로 들어오면 해당 품목 그래프를 바로 보여준다.
  useEffect(() => {
    const productId = searchParams.get("product");
    if (!productId) return;
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setSelectedCategory(target.uiCategory);
    setSelectedProductId(target.id);
  }, [searchParams, products]);

  useEffect(() => {
    function onDocClick(e) {
      if (caveatRef.current && !caveatRef.current.contains(e.target)) setCaveatOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const now = useMemo(() => new Date(), []);
  const curMonthIdx = now.getMonth();
  const curMonthLabel = MONTH_NAMES[curMonthIdx];

  const productsInCategory = useMemo(
    () => products.filter((p) => p.uiCategory === selectedCategory),
    [products, selectedCategory]
  );
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  // 품목당 1회만 계산해서 재사용 (칩 점 색상 + 선택된 품목 그래프/신호등 공통 소스)
  const deviationByProduct = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, computeMonthlyDeviation(p.series)));
    return map;
  }, [products]);

  const deviations = selectedProduct ? deviationByProduct.get(selectedProduct.id) : null;
  const tier = deviations ? classifyTier(deviations, curMonthIdx) : null;
  const curVal = deviations ? deviations[curMonthIdx] : null;
  const validDevs = deviations ? deviations.filter((v) => v != null) : [];
  const isMin = curVal != null && curVal === Math.min(...validDevs);
  const isMax = curVal != null && curVal === Math.max(...validDevs);
  const info = tier ? tierInfo(tier, isMin, isMax) : null;
  const riseFall = deviations ? riseFallInfo(deviations) : null;

  const nextIdx = (curMonthIdx + 1) % 12;
  const nextVal = deviations ? deviations[nextIdx] : null;
  const diff = curVal != null && nextVal != null ? Math.round((nextVal - curVal) * 10) / 10 : null;
  const trend = diff != null && diff >= 0 ? "비싸질" : "싸질";

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

  const isZzim = selectedProduct ? zzim.includes(selectedProduct.id) : false;
  const isAlarm = selectedProduct ? alarm.includes(selectedProduct.id) : false;
  const isNonStandardBase = selectedProduct && selectedProduct.basePeriod !== "2020=100";
  const periodLabel = selectedProduct
    ? `월별 · ${selectedProduct.series[0]?.label}~${selectedProduct.series[selectedProduct.series.length - 1]?.label}`
    : "";

  const productDeviation = selectedProduct ? deviations[selectedProduct.id] : null;
  const monthPattern = useMemo(() => {
    if (!selectedProduct || !productDeviation) return null;
    const validSeries = selectedProduct.series.filter((d) => d.index != null);
    const currentMonth = validSeries.length > 0 ? validSeries[validSeries.length - 1].month : null;
    let worstMonth = null, worstDev = null, bestMonth = null, bestDev = null;
    productDeviation.forEach((d, idx) => {
      if (d == null) return;
      const month = idx + 1;
      if (worstDev == null || d > worstDev) { worstDev = d; worstMonth = month; }
      if (bestDev == null || d < bestDev) { bestDev = d; bestMonth = month; }
    });
    if (worstMonth == null) return null;
    return { currentMonth, worstMonth, worstDev, bestMonth, bestDev };
  }, [selectedProduct, productDeviation]);

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
      </div>

      <div className="section-title">카테고리</div>
      <div className="cat-row">
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`cat-box ${c.key === selectedCategory ? "active" : ""}`}
            onClick={() => pickCategory(c.key)}
          >
            <div className="cat-icon">{CATEGORY_EMOJI[c.key]}</div>
            <div className="cat-label">{c.label}</div>
          </button>
        ))}
      </div>

      <div className="chip-row">
        {productsInCategory.length === 0 ? (
          <div className="no-result">이 카테고리엔 품목이 없어요</div>
        ) : (
          productsInCategory.map((p) => {
            const pDevs = deviationByProduct.get(p.id);
            const pTier = classifyTier(pDevs, curMonthIdx);
            return (
              <button
                key={p.id}
                type="button"
                className={`chip ${p.id === selectedProductId ? "active" : ""}`}
                onClick={() => setSelectedProductId(p.id)}
              >
                {emojiFor(p.name)} {p.name}
                <span className="dot" style={{ background: pTier ? TIER_COLOR[pTier] : "#ccc" }} />
              </button>
            );
          })
        )}
      </div>

      <div className="chart-card">
        <div className="item-title-row">
          <div className="item-title">
            <span>{selectedProduct ? emojiFor(selectedProduct.name) : ""}</span>
            <span>{selectedProduct ? selectedProduct.name : "품목을 선택하세요"}</span>
            <span className="caveat-wrap" ref={caveatRef}>
              <button
                type="button"
                className="chart-caveat-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setCaveatOpen((o) => !o);
                }}
              >
                ?
              </button>
              <div className={`chart-caveat-panel ${caveatOpen ? "open" : ""}`}>
                이번 달 가격이 연중 평균보다 높은 시기인지 낮은 시기인지를 최근 5년 데이터로 판단한
                값이에요. 실제 이번 달 가격과는 다를 수 있어요.
              </div>
            </span>
            {selectedProduct && (
              <button
                type="button"
                className={`heart-icon svg ${isZzim ? "active" : ""}`}
                disabled={!ready}
                onClick={() => toggleZzim(selectedProduct.id)}
              >
                <FlatHeartIcon />
              </button>
            )}
          </div>
          <div className="item-period">{periodLabel}</div>
        </div>
        <div className="item-basis">기준: 연평균 대비 월별 가격 수준(최근 5년) · 도매(생산자) 물가지수</div>

        {deviations && <DeviationBarChart deviations={deviations} curMonthIdx={curMonthIdx} />}

        <div className="rise-fall-row">
          {!riseFall ? null : riseFall.flat ? (
            <span className="flat">{riseFall.text}</span>
          ) : (
            <>
              <span className="rise">{riseFall.riseText}</span>
              <span className="fall">{riseFall.fallText}</span>
            </>
          )}
        </div>

        {isNonStandardBase && (
          <div className="disclaimer warn">
            ⚠️ {selectedProduct.name}은(는) 기준 연월이 {selectedProduct.basePeriod}로 달라요. 다른
            품목과 지수를 직접 비교하지 말고, 등락률로만 참고하세요.
          </div>
        )}
      </div>

      {info && selectedProduct && (
        <div className="signal-card" style={{ background: info.bg }}>
          <div className="signal-badge" style={{ background: TIER_COLOR[tier] }}>
            {info.emoji}
          </div>
          <div className="signal-title-row">
            <span className="signal-dot-big" style={{ background: TIER_COLOR[tier] }} />
            <span className="signal-result">{info.label}</span>
          </div>
          <div className="signal-reason">
            {curMonthLabel}은 <b>{selectedProduct.name}</b>값이 1년 중 {info.phrase}예요
            <br />
            (연평균 대비 {fmtPct(curVal)})
          </div>
          {diff != null && (
            <div
              className="signal-forecast"
              style={{ color: diff >= 0 ? "var(--color-signal-red)" : "var(--color-signal-green)" }}
            >
              *다음달에 {Math.abs(diff).toFixed(1)}% {trend} 예정이에요.
            </div>
          )}
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          className={`pill-btn ghost ${isZzim ? "on" : ""}`}
          disabled={!selectedProduct || !ready}
          onClick={() => selectedProduct && toggleZzim(selectedProduct.id)}
        >
          <span className="heart-icon inline">{isZzim ? "❤️" : "🤍"}</span> 찜하기
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

      <style jsx>{`
        .cat-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }
        .cat-row::-webkit-scrollbar {
          display: none;
        }
        .cat-box {
          flex: 0 0 auto;
          width: 70px;
          text-align: center;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }
        .cat-icon {
          width: 70px;
          height: 70px;
          border-radius: 18px;
          background: var(--color-card-white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          box-shadow: var(--shadow-card);
          border: 3px solid transparent;
          margin-bottom: 6px;
        }
        .cat-box.active .cat-icon {
          border-color: var(--color-lime-primary);
        }
        .cat-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-ink);
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chip :global(.dot) {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }

        .item-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .item-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 16px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .item-period {
          font-size: 11px;
          color: var(--color-ink-soft);
          white-space: nowrap;
        }
        .item-basis {
          font-size: 11.5px;
          color: var(--color-ink-soft);
          margin: 4px 0 12px;
        }

        .caveat-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .chart-caveat-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(107, 117, 104, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-ink-soft);
          cursor: pointer;
          padding: 0;
        }
        .chart-caveat-panel {
          position: absolute;
          top: 22px;
          left: 0;
          width: 220px;
          background: var(--color-mint-bg);
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--color-ink-soft);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          transform-origin: top left;
          transform: scaleY(0);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.22s ease, opacity 0.18s ease;
          z-index: 5;
        }
        .chart-caveat-panel.open {
          transform: scaleY(1);
          opacity: 1;
          pointer-events: auto;
        }

        .heart-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .heart-icon.inline {
          font-size: 16px;
          line-height: 1;
          margin-right: 2px;
        }
        .heart-icon.svg {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          color: rgba(107, 117, 104, 0.4);
        }
        .heart-icon.svg :global(svg) {
          display: block;
          width: 100%;
          height: 100%;
        }
        .heart-icon.svg :global(path) {
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }
        .heart-icon.svg.active {
          color: var(--color-signal-red);
        }
        .heart-icon.svg.active :global(path) {
          fill: currentColor;
        }

        .rise-fall-row {
          display: flex;
          gap: 14px;
          font-size: 12px;
          margin-top: 10px;
        }
        .rise-fall-row .rise {
          color: var(--color-signal-red);
          font-weight: 600;
        }
        .rise-fall-row .fall {
          color: var(--color-signal-green);
          font-weight: 600;
        }
        .rise-fall-row .flat {
          color: var(--color-ink-soft);
        }

        .signal-card {
          margin-top: 14px;
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 26px 16px 22px;
          text-align: center;
          color: var(--color-ink);
        }
        .signal-badge {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
        }
        .signal-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .signal-dot-big {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .signal-result {
          font-size: 19px;
          font-weight: 700;
        }
        .signal-reason {
          font-size: 13px;
          color: var(--color-ink-soft);
          line-height: 1.5;
          margin-top: 4px;
        }
        .signal-forecast {
          font-size: 11.5px;
          color: var(--color-ink-soft);
          margin-top: 10px;
        }
      `}</style>
    </>
  );
}

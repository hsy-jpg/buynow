// 서버 전용 모듈: 생산자물가지수_품목별_월별등락분석.xlsx 를 파싱해 내부 데이터 모델로 변환한다.
// PRD v2 "데이터 소스 통합 원칙" 을 따름 — 정적 파일 기반, 배치(=모듈 로드 시 1회) 파싱 후 메모리에 적재.
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { emojiFor } from "./emoji";

const FILE_PATH = path.join(process.cwd(), "생산자물가지수_품목별_월별등락분석.xlsx");

export const UI_CATEGORIES = [
  { key: "grain", label: "쌀", sub: "곡물류·서류", image: "/images/cat-grain.png", raw: ["곡물류", "서류"] },
  { key: "vegetable", label: "채소", sub: "채소류", image: "/images/cat-vegetable.png", raw: ["채소류(엽경채)", "채소류(기타)"] },
  { key: "fruit", label: "과일", sub: "과실류", image: "/images/cat-fruit.png", raw: ["과실류"] },
  { key: "seafood", label: "해산물", sub: "수산물", image: "/images/cat-seafood.png", raw: ["수산물(생물)", "수산물(가공)"] },
  { key: "meat", label: "육류", sub: "축산물", image: "/images/cat-meat.png", raw: ["축산물"] },
];

// 홈 화면 "제철 카드뉴스"에 노출할 카테고리별 대표 품목 (준비된 일러스트와 1:1 매칭)
const FLAGSHIP_NAME = { grain: "쌀", vegetable: "배추", fruit: "포도", seafood: "고등어", meat: "돼지고기" };

function rawToUiCategory(raw) {
  const found = UI_CATEGORIES.find((c) => c.raw.includes(raw));
  return found ? found.key : null;
}

function monthLabel(raw) {
  const [y, m] = String(raw).split("/").map(Number);
  return { year: y, month: m, label: `${y}.${String(m).padStart(2, "0")}` };
}

function round1(v) {
  return v == null ? null : Math.round(v * 1000) / 10; // fraction -> percent, 소수 1자리
}

let cache = null;

function loadWorkbook() {
  if (cache) return cache;
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`PPI xlsx 파일을 찾을 수 없어요: ${FILE_PATH}`);
  }
  const wb = XLSX.readFile(FILE_PATH);
  const rawSheet = XLSX.utils.sheet_to_json(wb.Sheets["원자료(월별지수)"], { header: 1, defval: null, raw: true });
  const momSheet = XLSX.utils.sheet_to_json(wb.Sheets["월별증감률(전월비)"], { header: 1, defval: null, raw: true });

  const rawMonthCols = rawSheet[0].slice(4);
  const momMonthCols = momSheet[0].slice(2);

  const momIndex = new Map();
  for (let i = 1; i < momSheet.length; i++) {
    const r = momSheet[i];
    if (r && r[1]) momIndex.set(`${r[0]}__${r[1]}`, r);
  }

  const products = [];
  for (let i = 1; i < rawSheet.length; i++) {
    const row = rawSheet[i];
    if (!row || !row[1]) continue;
    const [category, name, basePeriod, weight] = row;
    const uiCategory = rawToUiCategory(category);
    if (!uiCategory) continue; // 임산물 등 이 앱의 5개 카테고리 범위 밖 품목은 제외

    const series = rawMonthCols.map((raw, idx) => {
      const { year, month, label } = monthLabel(raw);
      return { year, month, label, index: row[4 + idx] ?? null };
    });

    const momRow = momIndex.get(`${category}__${name}`) || [];
    const momSeries = momMonthCols.map((raw, idx) => {
      const { year, month, label } = monthLabel(raw);
      return { year, month, label, pct: round1(momRow[2 + idx]) };
    });

    products.push({
      id: `${category}__${name}`,
      name,
      category,
      uiCategory,
      basePeriod,
      weight: weight ?? null,
      emoji: emojiFor(name),
      series,
      momSeries,
    });
  }

  cache = { products };
  return cache;
}

/** 프론트로 넘길 필요 없는 무거운 필드(65개월 원시 series 등)를 뺀 경량 사본 */
function toSummary(p) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    uiCategory: p.uiCategory,
    basePeriod: p.basePeriod,
    emoji: p.emoji,
  };
}

export function getAllProducts() {
  return loadWorkbook().products;
}

export function getAllProductSummaries() {
  return getAllProducts().map(toSummary);
}

export function getProductsByCategory(uiCategoryKey) {
  return getAllProducts().filter((p) => p.uiCategory === uiCategoryKey);
}

export function getProduct(id) {
  return getAllProducts().find((p) => p.id === id) || null;
}

// 달력 월(1~12)별 관측치가 이 값 미만이면 그 달은 "데이터 부족"으로 취급해 계산에서 제외한다.
const MIN_MONTH_OBS = 3;

/**
 * 원자료(월별지수) 시트만으로 달력 월별 평균 레벨과, 연평균 대비 편차(%)를 계산한다.
 * "몇 월이 비싼지/싼지"를 다루는 모든 화면이 공유하는 단일 계산 로직 — 계절평균(월별등락률) 시트는 쓰지 않는다.
 */
function monthlyLevelStats(p) {
  const byMonth = Array.from({ length: 12 }, () => []);
  for (const d of p.series) {
    if (d.index != null) byMonth[d.month - 1].push(d.index);
  }
  const monthAvg = byMonth.map((vals) =>
    vals.length >= MIN_MONTH_OBS ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  );
  const validAvgs = monthAvg.filter((v) => v != null);
  const annualAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;
  const deviation = monthAvg.map((avg) =>
    avg == null || annualAvg == null ? null : Math.round((avg / annualAvg - 1) * 1000) / 10
  );
  return { monthAvg, annualAvg, deviation };
}

/** 품목의 달력 월별(1~12월) 연평균 대비 레벨 편차(%). 관측치 부족 달은 null. 모든 화면이 이 함수 하나를 공유한다. */
export function getMonthlyLevelDeviation(id) {
  const p = getProduct(id);
  if (!p) return null;
  return monthlyLevelStats(p).deviation;
}

/** getMonthlyLevelDeviation()의 12개 값에서 가장 비싼/싼 달을 구하는 순수 함수 (서버 컴포넌트 전용 — 클라이언트에서는 ExploreClient가 동일 로직을 자체 보유) */
export function monthlyExtremes(deviation) {
  let worstMonth = null, worstDev = null, bestMonth = null, bestDev = null;
  deviation.forEach((d, idx) => {
    if (d == null) return;
    const month = idx + 1;
    if (worstDev == null || d > worstDev) { worstDev = d; worstMonth = month; }
    if (bestDev == null || d < bestDev) { bestDev = d; bestMonth = month; }
  });
  if (worstMonth == null) return null;
  return { worstMonth, worstDev, bestMonth, bestDev };
}

function stdevOfMomSeries(momSeries) {
  const valid = momSeries.filter((d) => d.pct != null).slice(-60);
  if (valid.length < 12) return null;
  const mean = valid.reduce((a, d) => a + d.pct, 0) / valid.length;
  const variance = valid.reduce((a, d) => a + (d.pct - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

/**
 * 변동성 지수: 최근 5년(최대 60개월)간 전월비 등락률의 표준편차.
 * 전체 품목 대비 상위 40%(표준편차 큰 쪽)면 "변동형", 나머지는 "안정형".
 */
export function getVolatility(id) {
  const p = getProduct(id);
  if (!p) return null;
  const stdev = stdevOfMomSeries(p.momSeries);
  if (stdev == null) return null;

  const allStdevs = getAllProducts()
    .map((q) => stdevOfMomSeries(q.momSeries))
    .filter((v) => v != null)
    .sort((a, b) => a - b);

  const below = allStdevs.filter((v) => v <= stdev).length;
  const percentile = Math.round((below / allStdevs.length) * 100);
  const level = percentile >= 60 ? "volatile" : "stable";
  return { stdev: Math.round(stdev * 10) / 10, percentile, level };
}

/** 이번 달(최신월) 전월비 등락률 TOP N 상승/하락 (PRD 3.1 "이번 달 최다 상승/하락 TOP5") */
export function getTopMovers(limit = 5) {
  const withChange = getAllProducts()
    .map((p) => {
      const last = p.momSeries[p.momSeries.length - 1];
      return { product: toSummary(p), change: last ? last.pct : null };
    })
    .filter((x) => x.change != null);

  const rising = [...withChange].sort((a, b) => b.change - a.change).slice(0, limit);
  const falling = [...withChange].sort((a, b) => a.change - b.change).slice(0, limit);
  return { rising, falling };
}

/**
 * 신호등 판정: 달력 월별 12개 레벨 편차값 중 "이번 달(=최신 관측월)" 값의 백분위로 계산.
 * 하위 33% = 🟢(지금 사기 좋음), 중간 = 🟡(보통), 상위 33% = 🔴(비쌈).
 * 모든 화면(홈/메인/마이)이 이 함수 하나를 공유한다.
 */
export function signalFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const deviation = monthlyLevelStats(p).deviation;
  const validCount = deviation.filter((v) => v != null).length;
  if (validCount < 6) {
    return { level: "unknown", label: "데이터 부족", message: "계절별 데이터가 충분하지 않아 판정이 어려워요", percentile: null, diffPct: null };
  }

  const valid = p.series.filter((d) => d.index != null);
  const currentMonth = valid[valid.length - 1].month;
  const diffPct = deviation[currentMonth - 1];
  if (diffPct == null) {
    return { level: "unknown", label: "데이터 부족", message: "이번 달의 계절 데이터가 충분하지 않아 판정이 어려워요", percentile: null, diffPct: null };
  }

  const validDeviations = deviation.filter((v) => v != null);
  const below = validDeviations.filter((v) => v <= diffPct).length;
  const percentile = Math.round((below / validDeviations.length) * 100);

  let level, label, message;
  if (percentile <= 33) {
    level = "good"; label = "지금 사기 좋음";
    message = `연평균보다 ${Math.abs(diffPct)}% 싼 시기예요`;
  } else if (percentile <= 66) {
    level = "normal"; label = "보통";
    message = `연평균과 비슷한 시기예요 (${diffPct >= 0 ? "+" : ""}${diffPct}%)`;
  } else {
    level = "bad"; label = "비쌈";
    message = `연평균보다 ${Math.abs(diffPct)}% 비싼 시기예요`;
  }
  return { level, label, message, percentile, diffPct };
}

/** 전체 품목 공통 최신 월 라벨 (알림 발생 시 중복 방지용 키로 사용) */
export function getLatestMonthLabel() {
  const products = getAllProducts();
  const last = products[0]?.momSeries?.[products[0].momSeries.length - 1];
  return last ? last.label : null;
}

export function momChangeFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const last = p.momSeries[p.momSeries.length - 1];
  return last ? last.pct : null;
}

/** 장바구니 시뮬레이터: 이번 달 지수 vs "보통 가장 쌌던 달"(달력 월 평균 레벨이 가장 낮은 달) */
export function simulatorStatsFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const valid = p.series.filter((d) => d.index != null);
  if (valid.length === 0) return null;
  const now = valid[valid.length - 1];

  const { monthAvg } = monthlyLevelStats(p);
  let lowMonth = null;
  let low = null;
  monthAvg.forEach((avg, idx) => {
    if (avg != null && (low == null || avg < low)) {
      low = avg;
      lowMonth = idx + 1;
    }
  });
  if (low == null) return null;

  const diffPct = Math.round((now.index / low - 1) * 1000) / 10;
  return { now: now.index, nowLabel: now.label, low, lowLabel: `보통 ${lowMonth}월`, diffPct };
}

export function getAllSimulatorStats() {
  return Object.fromEntries(getAllProducts().map((p) => [p.id, simulatorStatsFor(p.id)]));
}

export function seasonalCardText(p) {
  const { deviation } = monthlyLevelStats(p);
  let bestMonth = null;
  let bestDev = null;
  deviation.forEach((d, idx) => {
    if (d != null && (bestDev == null || d < bestDev)) {
      bestDev = d;
      bestMonth = idx + 1;
    }
  });
  if (bestMonth == null) return `${p.name}은(는) 계절 통계가 아직 부족해요`;
  return `${p.name}은(는) 보통 ${bestMonth}월이 연평균보다 ${Math.abs(bestDev)}% 싼, 가장 저렴한 시기예요`;
}

/** 홈 화면 "지금 저렴한 제철 식료품" 카드뉴스 — 카테고리별 대표(플래그십) 품목 */
export function getSeasonalFlagshipCards() {
  return UI_CATEGORIES.map((cat) => {
    const products = getProductsByCategory(cat.key);
    const flagship = products.find((p) => p.name === FLAGSHIP_NAME[cat.key]) || products[0];
    return {
      categoryKey: cat.key,
      categoryLabel: cat.label,
      image: cat.image,
      productId: flagship.id,
      productName: flagship.name,
      emoji: flagship.emoji,
      text: seasonalCardText(flagship),
    };
  });
}

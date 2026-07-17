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
  const seasonSheet = XLSX.utils.sheet_to_json(wb.Sheets["계절평균(월별등락률)"], { header: 1, defval: null, raw: true });

  const rawMonthCols = rawSheet[0].slice(4);
  const momMonthCols = momSheet[0].slice(2);

  const momIndex = new Map();
  for (let i = 1; i < momSheet.length; i++) {
    const r = momSheet[i];
    if (r && r[1]) momIndex.set(`${r[0]}__${r[1]}`, r);
  }
  const seasonIndex = new Map();
  for (let i = 1; i < seasonSheet.length; i++) {
    const r = seasonSheet[i];
    if (r && r[1]) seasonIndex.set(`${r[0]}__${r[1]}`, r);
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

    const seasonRow = seasonIndex.get(`${category}__${name}`) || [];
    const monthlyAvgPct = seasonRow.slice(2, 14).map(round1);

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
      seasonal: {
        monthlyAvgPct,
        topRiseMonth: seasonRow[14] ?? null,
        topRisePct: round1(seasonRow[15]),
        topFallMonth: seasonRow[16] ?? null,
        topFallPct: round1(seasonRow[17]),
      },
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

/** 신호등 판정: 최근 36개월(결측 제외) 분포 대비 이번 달 지수의 백분위 (PRD 3.2 로직) */
export function signalFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const valid = p.series.filter((d) => d.index != null);
  const recent = valid.slice(-36);
  if (recent.length < 12) {
    return { level: "unknown", label: "데이터 부족", message: "최근 데이터가 충분하지 않아 판정이 어려워요", percentile: null, diffPct: null };
  }
  const current = recent[recent.length - 1].index;
  const below = recent.filter((d) => d.index <= current).length;
  const percentile = Math.round((below / recent.length) * 100);
  const avg = recent.reduce((a, d) => a + d.index, 0) / recent.length;
  const diffPct = Math.round((current / avg - 1) * 1000) / 10;
  const years = Math.max(1, Math.round(recent.length / 12));

  let level, label, message;
  if (percentile <= 33) {
    level = "good"; label = "지금 사기 좋음";
    message = `최근 ${years}년 평균보다 ${Math.abs(diffPct)}% 저렴한 도매가 수준이에요`;
  } else if (percentile <= 66) {
    level = "normal"; label = "보통";
    message = `최근 ${years}년 평균과 비슷한 도매가 수준이에요 (${diffPct >= 0 ? "+" : ""}${diffPct}%)`;
  } else {
    level = "bad"; label = "비쌈";
    message = `최근 ${years}년 평균보다 ${Math.abs(diffPct)}% 비싼 도매가 수준이에요`;
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

/** 장바구니 시뮬레이터: 이번 달 지수 vs 최근 3년 저점 (지수 등락률 기준 상대 비교, PRD 3.3) */
export function simulatorStatsFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const valid = p.series.filter((d) => d.index != null);
  const recent = valid.slice(-36);
  const now = recent[recent.length - 1];
  const low = recent.reduce((min, d) => (d.index < min.index ? d : min), recent[0]);
  const diffPct = Math.round((now.index / low.index - 1) * 1000) / 10;
  return { now: now.index, nowLabel: now.label, low: low.index, lowLabel: low.label, diffPct };
}

export function getAllSimulatorStats() {
  return Object.fromEntries(getAllProducts().map((p) => [p.id, simulatorStatsFor(p.id)]));
}

/** 전환_명령어.md 공통 판정 기준: "원자료(월별지수)" 만으로 계산하는 연평균 대비 월별(1~12월) 레벨 편차(%).
 * 등락률이 아니라 "그 달이 실제로 비싼지/싼지"를 보기 위한 값 — 달력 월별 평균을 동일 가중치로 낸 연평균과 비교한다. */
export function getMonthlyLevelDeviation(id) {
  const p = getProduct(id);
  if (!p) return null;
  const MIN_OBS = 2;
  const byMonth = Array.from({ length: 12 }, () => []);
  p.series.forEach((d) => {
    if (d.index != null) byMonth[d.month - 1].push(d.index);
  });
  const monthAvg = byMonth.map((vals) =>
    vals.length >= MIN_OBS ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  );
  const validAvgs = monthAvg.filter((v) => v != null);
  const annualAvg = validAvgs.length > 0 ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length : null;

  return monthAvg.map((avg, idx) => ({
    month: idx + 1,
    avgIndex: avg,
    deviationPct: avg != null && annualAvg != null ? Math.round((avg / annualAvg - 1) * 1000) / 10 : null,
  }));
}

/** 찜 목록 +%/-% 뱃지용: 데이터상 최신월의 레벨 편차 (달력월 기준 "평균보다 O% 비싼/싼" 값) */
export function levelDeviationNow(id) {
  const p = getProduct(id);
  if (!p) return null;
  const latest = [...p.series].reverse().find((d) => d.index != null);
  if (!latest) return null;
  const deviation = getMonthlyLevelDeviation(id);
  const row = deviation.find((d) => d.month === latest.month);
  return row ? row.deviationPct : null;
}

/** 장바구니 시뮬레이터: "이번 달 실제 지수" vs "그 품목이 보통 가장 쌌던 달"(레벨 편차 최솟값)의 평균 수준 비교 */
export function levelSimulatorStatsFor(id) {
  const p = getProduct(id);
  if (!p) return null;
  const deviation = getMonthlyLevelDeviation(id).filter((d) => d.avgIndex != null);
  if (deviation.length === 0) return null;
  const latest = [...p.series].reverse().find((d) => d.index != null);
  if (!latest) return null;
  const lowRow = deviation.reduce((min, d) => (d.deviationPct < min.deviationPct ? d : min), deviation[0]);
  const diffPct = Math.round((latest.index / lowRow.avgIndex - 1) * 1000) / 10;
  return {
    now: latest.index,
    nowLabel: latest.label,
    lowMonth: lowRow.month,
    lowAvgIndex: lowRow.avgIndex,
    lowDeviationPct: lowRow.deviationPct,
    diffPct,
  };
}

export function getAllLevelSimulatorStats() {
  return Object.fromEntries(getAllProducts().map((p) => [p.id, levelSimulatorStatsFor(p.id)]));
}

export function seasonalCardText(p) {
  if (p.seasonal.topFallMonth == null) return `${p.name}은(는) 계절 통계가 아직 부족해요`;
  return `${p.name}은(는) 보통 ${p.seasonal.topFallMonth}에 가장 크게 저렴해져요 (평균 ${p.seasonal.topFallPct}%)`;
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

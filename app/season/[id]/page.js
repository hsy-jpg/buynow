import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProduct,
  signalFor,
  getMonthlyLevelDeviation,
  monthlyExtremes,
  getVolatility,
} from "@/lib/ppi";
import { RECIPE_IDEAS } from "@/lib/recipes";
import { MonthlyBarChart } from "@/components/MonthlyBarChart";

const SIGNAL_EMOJI = { good: "😊", normal: "😐", bad: "😥", unknown: "🤔" };
const SIGNAL_DOT = { good: "🟢", normal: "🟡", bad: "🔴", unknown: "⚪" };

export default function SeasonDetailPage({ params }) {
  const id = decodeURIComponent(params.id);
  const product = getProduct(id);
  if (!product) return notFound();

  const sig = signalFor(id);
  const deviation = getMonthlyLevelDeviation(id);
  const extremes = monthlyExtremes(deviation);
  const volatility = getVolatility(id);
  const recipes = RECIPE_IDEAS[product.name] || [];

  const validSeries = product.series.filter((d) => d.index != null);
  const currentMonth = validSeries.length > 0 ? validSeries[validSeries.length - 1].month : null;

  return (
    <>
      <div className="subpage-back">
        <Link href="/">‹ 홈</Link>
      </div>
      <div className="section-title">{product.emoji} {product.name}</div>

      {sig && (
        <div className={`signal-card ${sig.level}`}>
          <div className="signal-emoji">{SIGNAL_EMOJI[sig.level]}</div>
          <div className="signal-label">{SIGNAL_DOT[sig.level]} {sig.label}</div>
          <div className="signal-msg">{sig.message}</div>
        </div>
      )}

      {extremes && (
        <div className="insight-card">
          <div className="insight-title">📅 계절성 히트맵 (5년 데이터 · 연평균 대비 레벨 편차)</div>
          <MonthlyBarChart deviations={deviation} currentMonth={currentMonth} />
          <div className="season-pattern-summary">
            <span className="tag-bad">
              🔴 가장 비싼 달 {extremes.worstMonth}월 ({extremes.worstDev >= 0 ? "+" : ""}{extremes.worstDev}%)
            </span>
            <span className="tag-good">
              🟢 가장 싼 달 {extremes.bestMonth}월 ({extremes.bestDev >= 0 ? "+" : ""}{extremes.bestDev}%)
            </span>
          </div>
        </div>
      )}

      {volatility && (
        <div className="insight-card">
          <div className="insight-title">📊 변동성 지수</div>
          <div className={`volatility-badge ${volatility.level}`}>
            {volatility.level === "volatile" ? "변동형 🟧" : "안정형 🟦"}
          </div>
          <p className="insight-desc">
            {volatility.level === "volatile"
              ? `최근 5년간 월별 가격 변동폭이 큰 편이에요 (변동률 표준편차 ${volatility.stdev}%p). 가격이 오르내리는 폭이 큰 품목이니 타이밍을 잘 보고 사세요.`
              : `최근 5년간 월별 가격 변동폭이 작은 편이에요 (변동률 표준편차 ${volatility.stdev}%p). 가격이 비교적 안정적이라 아무 때나 사도 괜찮은 편이에요.`}
          </p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="insight-card">
          <div className="insight-title">🍳 이 재료로 만드는 요리</div>
          <div className="recipe-chip-row">
            {recipes.map((dish) => (
              <span className="recipe-chip" key={dish}>{dish}</span>
            ))}
          </div>
        </div>
      )}

      <div className="menu-list" style={{ marginTop: 14 }}>
        <Link href={`/main?product=${encodeURIComponent(product.id)}`} className="menu-item">
          <span className="emoji">📈</span> 가격 그래프 자세히 보기 <span className="arrow">›</span>
        </Link>
      </div>
    </>
  );
}

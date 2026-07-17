import { UI_CATEGORIES, getAllProducts } from "@/lib/ppi";
import { ExploreClient } from "@/components/ExploreClient";

// 판정 로직이 "연평균 대비 월별 편차"(캘린더 월 기준, ExploreClient에서 계산)로 바뀌면서
// 서버에서 미리 계산해 내려주던 signalFor()는 더 이상 쓰지 않는다 — 원본 월별 지수(series)만
// 그대로 내려주면 클라이언트에서 전부 계산 가능하다.
export default function MainPage() {
  const categories = UI_CATEGORIES.map((c) => ({ key: c.key, label: c.label }));

  const products = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    uiCategory: p.uiCategory,
    basePeriod: p.basePeriod,
    series: p.series.map((d) => ({ year: d.year, month: d.month, label: d.label, index: d.index })),
  }));

  return <ExploreClient categories={categories} products={products} />;
}

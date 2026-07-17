import { UI_CATEGORIES, getAllProducts, getProduct, signalFor, getMonthlyLevelDeviation } from "@/lib/ppi";
import { ExploreClient } from "@/components/ExploreClient";

export default function MainPage({ searchParams }) {
  const categories = UI_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label,
    sub: c.sub,
    image: c.image,
  }));

  const products = getAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    uiCategory: p.uiCategory,
    basePeriod: p.basePeriod,
    series: p.series.map((d) => ({ year: d.year, month: d.month, label: d.label, index: d.index })),
  }));

  const signals = Object.fromEntries(products.map((p) => [p.id, signalFor(p.id)]));
  const deviations = Object.fromEntries(products.map((p) => [p.id, getMonthlyLevelDeviation(p.id)]));

  const requested = searchParams?.product ? getProduct(searchParams.product) : null;
  const initialCategory = requested ? requested.uiCategory : categories[0].key;
  const initialProductId = requested ? requested.id : null;

  return (
    <ExploreClient
      categories={categories}
      products={products}
      signals={signals}
      deviations={deviations}
      initialCategory={initialCategory}
      initialProductId={initialProductId}
    />
  );
}

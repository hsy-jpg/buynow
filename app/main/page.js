import { UI_CATEGORIES, getAllProducts, signalFor } from "@/lib/ppi";
import { ExploreClient } from "@/components/ExploreClient";

export default function MainPage() {
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

  return <ExploreClient categories={categories} products={products} signals={signals} />;
}

import Link from "next/link";
import {
  getAllProductSummaries,
  getTopMovers,
  signalFor,
  getSeasonalFlagshipCards,
} from "@/lib/ppi";
import { getRecipeSuggestions } from "@/lib/recipes";
import { ZzimHomeSection } from "@/components/ZzimHomeSection";

function MoverCard({ entry }) {
  const { product, change } = entry;
  const cls = change >= 0 ? "up" : "down";
  const sign = change >= 0 ? "+" : "";
  return (
    <Link href={`/main?product=${encodeURIComponent(product.id)}`} className="mover-card">
      <div className="emoji">{product.emoji}</div>
      <div className="name">{product.name}</div>
      <div className={`pct ${cls}`}>{sign}{change}%</div>
    </Link>
  );
}

export default function HomePage() {
  const { rising, falling } = getTopMovers(5);
  const seasonCards = getSeasonalFlagshipCards();
  const products = getAllProductSummaries();
  const signals = Object.fromEntries(products.map((p) => [p.id, signalFor(p.id)]));

  const recipeSuggestions = getRecipeSuggestions();
  const recipeCard =
    recipeSuggestions.find((c) => signals[c.productId]?.level === "good") || recipeSuggestions[0];
  const recipeIdeas = recipeCard.recipes;

  return (
    <>
      <div className="hero-scroll">
        <div className="hero-banner">
          <img src="/images/hero-market.png" alt="장보기 일러스트" />
          <div className="hero-text">
            <span className="tag">오늘의 물가</span>
            <h2>오늘 뭐 사지? 오늘사요가 먼저 살펴봤어요</h2>
            <p>도매가 기준 이번 달 등락 요약, 아래에서 바로 확인하세요</p>
          </div>
        </div>
        <Link href="/recipes" className="hero-banner hero-banner--recipe">
          <img src="/images/hero-grocery.jpg" alt="장보기하는 사람 일러스트" />
          <div className="hero-text">
            <span className="tag tag--recipe">레시피 제안</span>
            <h2>{recipeCard.emoji} {recipeCard.productName}로 이런 요리 어때요?</h2>
            <p>
              {recipeIdeas.length > 0
                ? `${recipeIdeas.join(" · ")} — 레시피 더보기`
                : "지금 저렴한 제철 식료품으로 만드는 집밥, 레시피 더보기"}
            </p>
          </div>
        </Link>
      </div>

      <div className="section-title">📈 이번 달 많이 오른 상품</div>
      <div className="hscroll">
        {rising.map((entry) => (
          <MoverCard entry={entry} key={entry.product.id} />
        ))}
      </div>

      <div className="section-title">📉 이번 달 많이 내린 상품</div>
      <div className="hscroll">
        {falling.map((entry) => (
          <MoverCard entry={entry} key={entry.product.id} />
        ))}
      </div>

      <div className="section-title">❤️ 내가 찜한 품목</div>
      <ZzimHomeSection products={products} signals={signals} />

      <div className="section-title" id="season">🍠 지금 저렴한 제철 식료품</div>
      <div className="season-grid">
        {seasonCards.map((card) => {
          const sig = signals[card.productId];
          return (
            <Link
              href={`/season/${encodeURIComponent(card.productId)}`}
              className="season-card"
              key={card.categoryKey}
            >
              <div className="season-media">
                <span className="season-emoji" aria-hidden="true">{card.emoji}</span>
              </div>
              <div className="body">
                <div className="season-head">
                  <span className="eyebrow">{card.categoryLabel}</span>
                  {sig && <span className={`badge ${sig.level}`}>{sig.label}</span>}
                </div>
                <h3>{card.emoji} {card.productName}</h3>
                <p className="season-desc">{card.text}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

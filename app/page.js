import {
  getAllProductSummaries,
  getTopMovers,
  signalFor,
  getSeasonalFlagshipCards,
} from "@/lib/ppi";
import { ZzimHomeSection } from "@/components/ZzimHomeSection";

function MoverCard({ entry }) {
  const { product, change } = entry;
  const cls = change >= 0 ? "up" : "down";
  const sign = change >= 0 ? "+" : "";
  return (
    <div className="mover-card">
      <div className="emoji">{product.emoji}</div>
      <div className="name">{product.name}</div>
      <div className={`pct ${cls}`}>{sign}{change}%</div>
    </div>
  );
}

export default function HomePage() {
  const { rising, falling } = getTopMovers(5);
  const seasonCards = getSeasonalFlagshipCards();
  const products = getAllProductSummaries();
  const signals = Object.fromEntries(products.map((p) => [p.id, signalFor(p.id)]));

  return (
    <>
      <div className="hero-banner">
        <img src="/images/hero-market.png" alt="장보기 일러스트" />
        <div className="hero-text">
          <span className="tag">오늘의 물가</span>
          <h2>오늘 뭐 사지? 오늘사요가 먼저 살펴봤어요</h2>
          <p>도매가 기준 이번 달 등락 요약, 아래에서 바로 확인하세요</p>
        </div>
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

      <div className="section-title">🍠 지금 저렴한 제철 식료품</div>
      <div className="season-scroll">
        {seasonCards.map((card) => (
          <div className="season-card" key={card.categoryKey}>
            <img src={card.image} alt={card.productName} />
            <div className="body">
              <span className="tag">제철정보 · {card.categoryLabel}</span>
              <h3>{card.text}</h3>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

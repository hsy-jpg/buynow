import Link from "next/link";
import { getRecipeSuggestions } from "@/lib/recipes";

export default function RecipesPage() {
  const suggestions = getRecipeSuggestions();

  return (
    <>
      <div className="subpage-back">
        <Link href="/">‹ 홈</Link>
      </div>
      <div className="section-title">🍳 제철 재료로 만드는 레시피</div>
      <div className="notif-hint">
        지금 저렴한 제철 식료품으로 바로 만들어볼 수 있는 요리를 모아봤어요.
      </div>

      <div className="recipe-list">
        {suggestions.map((card) => (
          <div className="recipe-card" key={card.categoryKey}>
            <div className="recipe-card-head">
              <span className="eyebrow">{card.categoryLabel}</span>
              <h3>{card.emoji} {card.productName}</h3>
            </div>
            {card.recipes.length > 0 ? (
              <div className="recipe-chip-row">
                {card.recipes.map((dish) => (
                  <span className="recipe-chip" key={dish}>{dish}</span>
                ))}
              </div>
            ) : (
              <div className="recipe-chip-row">
                <span className="recipe-chip">레시피 준비 중이에요</span>
              </div>
            )}
            <p className="recipe-note">{card.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

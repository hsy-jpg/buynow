import { getSeasonalFlagshipCards } from "./ppi";

// 카테고리별 대표(플래그십) 품목에 맞춘 실제 레시피 아이디어 — 홈 배너 "레시피 제안"과 /recipes 페이지가 공유한다.
export const RECIPE_IDEAS = {
  쌀: ["누룽지", "영양솥밥", "볶음밥"],
  배추: ["배추전", "배추된장국", "겉절이"],
  포도: ["포도잼", "포도 요거트", "생과일로"],
  고등어: ["고등어조림", "고등어구이", "고등어무조림"],
  돼지고기: ["제육볶음", "돼지고기김치찜", "수육"],
};

/** 제철 카드뉴스의 5개 대표 품목에 실제 레시피 아이디어를 붙여 반환 */
export function getRecipeSuggestions() {
  return getSeasonalFlagshipCards().map((card) => ({
    ...card,
    recipes: RECIPE_IDEAS[card.productName] || [],
  }));
}

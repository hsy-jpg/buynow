// 가계부 전용 카테고리 (클라이언트 컴포넌트에서 사용 — lib/ppi.js 는 fs 기반 서버 전용 모듈이라 재사용하지 않음)
export const LEDGER_CATEGORIES = [
  { key: "grain", label: "쌀/곡물", emoji: "🍚", color: "#D4A24C" },
  { key: "vegetable", label: "채소류", emoji: "🥬", color: "#7ED321" },
  { key: "fruit", label: "과일류", emoji: "🍎", color: "#FF6F91" },
  { key: "seafood", label: "수산물", emoji: "🐟", color: "#4FC3D9" },
  { key: "meat", label: "육류", emoji: "🥩", color: "#C1440E" },
  { key: "etc", label: "기타", emoji: "🛒", color: "#A2AC9C" },
];

export function categoryMeta(key) {
  return LEDGER_CATEGORIES.find((c) => c.key === key) || LEDGER_CATEGORIES[LEDGER_CATEGORIES.length - 1];
}

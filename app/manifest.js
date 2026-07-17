export default function manifest() {
  return {
    name: "오늘사요? - 식료품 물가 상승 알리미",
    short_name: "오늘사요?",
    description: "생산자물가지수 기반 식료품 구매 타이밍 도우미",
    start_url: "/",
    display: "standalone",
    background_color: "#DDE9D4",
    theme_color: "#7ED321",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

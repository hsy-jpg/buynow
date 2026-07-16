import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ZzimProvider } from "@/components/ZzimProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getAllProductSummaries, momChangeFor, getLatestMonthLabel } from "@/lib/ppi";

export const metadata = {
  title: "오늘사요?",
  description: "생산자물가지수 기반 식료품 구매 타이밍 도우미",
};

export default function RootLayout({ children }) {
  const products = getAllProductSummaries();
  const alarmFeed = products.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    change: momChangeFor(p.id),
  }));
  const latestMonth = getLatestMonthLabel();

  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <ZzimProvider>
            <NotificationProvider feed={alarmFeed} latestMonth={latestMonth}>
              <div id="app-shell">
                <Header />
                <main className="screen">{children}</main>
                <BottomNav />
              </div>
            </NotificationProvider>
          </ZzimProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

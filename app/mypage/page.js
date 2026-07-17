import Link from "next/link";
import {
  getAllProductSummaries,
  levelDeviationNow,
  signalFor,
  getAllLevelSimulatorStats,
} from "@/lib/ppi";
import { MypageHeader } from "@/components/MypageHeader";
import { MypageZzimList } from "@/components/MypageZzimList";
import { SimulatorClient } from "@/components/SimulatorClient";
import { MypageModal } from "@/components/MypageModal";

export default function MypagePage() {
  const products = getAllProductSummaries();
  const levelDevById = Object.fromEntries(products.map((p) => [p.id, levelDeviationNow(p.id)]));
  const signals = Object.fromEntries(products.map((p) => [p.id, signalFor(p.id)]));
  const simStats = getAllLevelSimulatorStats();

  return (
    <>
      <MypageHeader />

      <div className="menu-list">
        <MypageModal emoji="❤️" label="찜한 품목">
          <MypageZzimList products={products} levelDevById={levelDevById} signals={signals} />
        </MypageModal>
        <Link className="menu-item" href="/mypage/notifications">
          <span className="emoji">🔔</span> 알림함 (월 1회 갱신 기준) <span className="arrow">›</span>
        </Link>
        <Link className="menu-item" href="/mypage/ledger">
          <span className="emoji">📒</span> 소비 기록 (가계부) <span className="arrow">›</span>
        </Link>
        <MypageModal emoji="🛒" label="장바구니 시뮬레이터">
          <SimulatorClient products={products} simStats={simStats} />
        </MypageModal>
      </div>
    </>
  );
}

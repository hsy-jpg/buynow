import Link from "next/link";
import {
  getAllProductSummaries,
  momChangeFor,
  signalFor,
  getAllSimulatorStats,
} from "@/lib/ppi";
import { MypageHeader } from "@/components/MypageHeader";
import { MypageZzimList } from "@/components/MypageZzimList";
import { SimulatorClient } from "@/components/SimulatorClient";

export default function MypagePage() {
  const products = getAllProductSummaries();
  const momById = Object.fromEntries(products.map((p) => [p.id, momChangeFor(p.id)]));
  const signals = Object.fromEntries(products.map((p) => [p.id, signalFor(p.id)]));
  const simStats = getAllSimulatorStats();

  return (
    <>
      <MypageHeader />

      <div className="menu-list">
        <a className="menu-item" href="#zzim-section">
          <span className="emoji">❤️</span> 찜한 품목 <span className="arrow">›</span>
        </a>
        <Link className="menu-item" href="/mypage/notifications">
          <span className="emoji">🔔</span> 알림함 (월 1회 갱신 기준) <span className="arrow">›</span>
        </Link>
        <Link className="menu-item" href="/mypage/ledger">
          <span className="emoji">📒</span> 소비 기록 (가계부) <span className="arrow">›</span>
        </Link>
        <a className="menu-item" href="#simulator-section">
          <span className="emoji">🛒</span> 장바구니 시뮬레이터 <span className="arrow">›</span>
        </a>
      </div>

      <div className="section-title" id="zzim-section">❤️ 찜한 품목</div>
      <MypageZzimList products={products} momById={momById} signals={signals} />

      <div className="section-title" id="simulator-section">🛒 장바구니 시뮬레이터</div>
      <SimulatorClient products={products} simStats={simStats} />
    </>
  );
}

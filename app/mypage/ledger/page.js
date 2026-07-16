import Link from "next/link";
import { LedgerClient } from "@/components/LedgerClient";

export default function LedgerPage() {
  return (
    <>
      <div className="subpage-back">
        <Link href="/mypage">‹ 마이페이지</Link>
      </div>
      <div className="section-title">📒 소비 기록 (가계부)</div>
      <LedgerClient />
    </>
  );
}

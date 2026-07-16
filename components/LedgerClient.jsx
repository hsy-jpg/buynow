"use client";

// 소비 기록(가계부): 사용자가 직접 입력한 실제 구매 내역. PPI 지수 데이터와 무관한 자체 로컬 기록.
import { useEffect, useState } from "react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function LedgerClient() {
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem("ledger") || "[]"));
    } catch {
      // ignore malformed storage
    }
    setDate(todayStr());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("ledger", JSON.stringify(entries));
  }, [entries, ready]);

  function onSubmit(e) {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;
    const entry = {
      id: `${date}__${Math.random().toString(36).slice(2, 8)}`,
      itemName: itemName.trim(),
      amount: Number(amount),
      quantity: Number(quantity) || 1,
      date,
      memo: memo.trim(),
    };
    setEntries((prev) => [entry, ...prev]);
    setItemName("");
    setAmount("");
    setQuantity("1");
    setMemo("");
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (!ready) return null;

  const thisMonth = todayStr().slice(0, 7);
  const monthTotal = entries
    .filter((e) => e.date.slice(0, 7) === thisMonth)
    .reduce((sum, e) => sum + e.amount * e.quantity, 0);

  return (
    <>
      <div className="ledger-summary">
        <span>이번 달 지출</span>
        <span className="val">{monthTotal.toLocaleString()}원</span>
      </div>

      <form className="ledger-form" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="품목명 (예: 배추)"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />
        <div className="ledger-form-row">
          <input
            type="number"
            placeholder="금액(원)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            required
          />
          <input
            type="number"
            placeholder="수량"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
          />
        </div>
        <div className="ledger-form-row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input
            type="text"
            placeholder="메모(선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <button type="submit" className="pill-btn primary">기록 추가</button>
      </form>

      {entries.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 14 }}>
          <span className="emoji">📒</span>아직 기록이 없어요
        </div>
      ) : (
        <div className="ledger-list">
          {entries.map((e) => (
            <div className="ledger-row" key={e.id}>
              <div className="ledger-row-main">
                <div className="ledger-row-name">{e.itemName}</div>
                <div className="ledger-row-meta">
                  {e.date} · {e.quantity}개{e.memo ? ` · ${e.memo}` : ""}
                </div>
              </div>
              <div className="ledger-row-amount">{(e.amount * e.quantity).toLocaleString()}원</div>
              <button type="button" className="ledger-del" onClick={() => removeEntry(e.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

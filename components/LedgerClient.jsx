"use client";

// 소비 기록(가계부): 사용자가 직접 입력한 실제 구매 내역. PPI 지수 데이터와 무관한 자체 기록.
// 로그인한 사용자는 Supabase buynow_ledger 테이블에, 로그인하지 않은 사용자는 이 브라우저의
// localStorage에 저장한다(기기 간 동기화는 되지 않음).
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { LEDGER_CATEGORIES, categoryMeta } from "@/lib/ledgerCategories";
import { DonutChart } from "@/components/DonutChart";
import { BarChart } from "@/components/BarChart";

const GUEST_LEDGER_KEY = "oneulsaya_ledger_guest";

function loadGuestEntries() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestEntries(entries) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_LEDGER_KEY, JSON.stringify(entries));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthKeysBack(n) {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function toClient(row) {
  return {
    id: row.id,
    itemName: row.item_name,
    amount: Number(row.amount),
    quantity: Number(row.quantity),
    date: row.entry_date,
    category: row.category,
    memo: row.memo || "",
  };
}

export function LedgerClient() {
  const { user, ready: authReady } = useAuth();
  const [entries, setEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(LEDGER_CATEGORIES[0].key);
  const [memo, setMemo] = useState("");

  useEffect(() => {
    setDate(todayStr());
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let active = true;

    if (!user) {
      setEntries(loadGuestEntries());
      setReady(true);
      return;
    }

    setReady(false);
    supabase
      .from("buynow_ledger")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setEntries((data || []).map(toClient));
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [user, authReady]);

  function resetForm() {
    setEditingId(null);
    setItemName("");
    setAmount("");
    setQuantity("1");
    setCategory(LEDGER_CATEGORIES[0].key);
    setDate(todayStr());
    setMemo("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;

    if (!user) {
      if (editingId) {
        const patch = {
          itemName: itemName.trim(),
          amount: Number(amount),
          quantity: Number(quantity) || 1,
          date,
          category,
          memo: memo.trim(),
        };
        setEntries((prev) => {
          const next = prev.map((entry) => (entry.id === editingId ? { ...entry, ...patch } : entry));
          saveGuestEntries(next);
          return next;
        });
      } else {
        const entry = {
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          itemName: itemName.trim(),
          amount: Number(amount),
          quantity: Number(quantity) || 1,
          date,
          category,
          memo: memo.trim(),
        };
        setEntries((prev) => {
          const next = [entry, ...prev];
          saveGuestEntries(next);
          return next;
        });
      }
      resetForm();
      return;
    }

    if (editingId) {
      const patch = {
        item_name: itemName.trim(),
        amount: Number(amount),
        quantity: Number(quantity) || 1,
        entry_date: date,
        category,
        memo: memo.trim(),
      };
      setEntries((prev) =>
        prev.map((entry) => (entry.id === editingId ? { ...entry, ...toClient({ id: editingId, ...patch }) } : entry))
      );
      await supabase.from("buynow_ledger").update(patch).eq("id", editingId).eq("user_id", user.id);
    } else {
      const row = {
        user_id: user.id,
        item_name: itemName.trim(),
        amount: Number(amount),
        quantity: Number(quantity) || 1,
        entry_date: date,
        category,
        memo: memo.trim(),
      };
      const { data } = await supabase.from("buynow_ledger").insert(row).select().single();
      if (data) setEntries((prev) => [toClient(data), ...prev]);
    }
    resetForm();
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setItemName(entry.itemName);
    setAmount(String(entry.amount));
    setQuantity(String(entry.quantity));
    setDate(entry.date);
    setCategory(entry.category || "etc");
    setMemo(entry.memo || "");
  }

  async function removeEntry(id) {
    if (editingId === id) resetForm();
    if (!user) {
      setEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        saveGuestEntries(next);
        return next;
      });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("buynow_ledger").delete().eq("id", id).eq("user_id", user.id);
  }

  if (!authReady || !ready) return null;

  const grandTotal = entries.reduce((sum, e) => sum + e.amount * e.quantity, 0);
  const thisMonth = todayStr().slice(0, 7);
  const monthEntries = entries.filter((e) => e.date.slice(0, 7) === thisMonth);
  const monthTotal = monthEntries.reduce((sum, e) => sum + e.amount * e.quantity, 0);

  const byCategory = new Map();
  monthEntries.forEach((e) => {
    const key = e.category || "etc";
    byCategory.set(key, (byCategory.get(key) || 0) + e.amount * e.quantity);
  });
  const categoryBreakdown = LEDGER_CATEGORIES.map((c) => ({ ...c, value: byCategory.get(c.key) || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const topCategory = categoryBreakdown[0] || null;
  const topPct = topCategory && monthTotal > 0 ? Math.round((topCategory.value / monthTotal) * 100) : 0;

  const monthlyTotals = monthKeysBack(6).map((key) => ({
    key,
    label: `${Number(key.slice(5, 7))}월`,
    value: entries
      .filter((e) => e.date.slice(0, 7) === key)
      .reduce((sum, e) => sum + e.amount * e.quantity, 0),
  }));
  const prevMonths = monthlyTotals.slice(0, -1).filter((m) => m.value > 0);
  const prevAvg = prevMonths.length > 0 ? prevMonths.reduce((a, m) => a + m.value, 0) / prevMonths.length : null;
  let compareText = "비교할 지난달 기록이 아직 부족해요";
  if (prevAvg != null && monthTotal > 0) {
    const diffPct = Math.round((monthTotal / prevAvg - 1) * 100);
    if (diffPct >= 10) compareText = `평소보다 ${diffPct}% 많이 썼어요`;
    else if (diffPct <= -10) compareText = `평소보다 ${Math.abs(diffPct)}% 적게 썼어요`;
    else compareText = "평소와 비슷하게 썼어요";
  }

  return (
    <>
      {!user && (
        <div className="ledger-guest-notice">
          🔓 로그인 없이도 기록할 수 있어요 (단, 이 브라우저에만 저장돼요)
        </div>
      )}

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
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {LEDGER_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="메모(선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
        <div className="ledger-form-row">
          <button type="submit" className="pill-btn primary">
            {editingId ? "수정 완료" : "기록 추가"}
          </button>
          {editingId && (
            <button type="button" className="pill-btn ghost" onClick={resetForm}>
              취소
            </button>
          )}
        </div>
      </form>

      {monthTotal > 0 && (
        <div className="ledger-chart-card">
          <div className="chart-card-title">🍩 이번 달 카테고리별 지출 비중</div>
          <div className="donut-row">
            <DonutChart
              slices={categoryBreakdown.map((c) => ({ label: c.label, value: c.value, color: c.color }))}
              centerLabel={`${monthTotal.toLocaleString()}원`}
            />
            <div className="cat-legend">
              {categoryBreakdown.map((c) => (
                <div className="cat-legend-row" key={c.key}>
                  <span className="dot" style={{ background: c.color }} />
                  <span className="label">{c.emoji} {c.label}</span>
                  <span className="pct">{Math.round((c.value / monthTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
          {topCategory && (
            <div className="ledger-insight">
              이번 달 {topCategory.label}에 {topPct}% 썼어요
            </div>
          )}
        </div>
      )}

      <div className="ledger-chart-card">
        <div className="chart-card-title">📊 최근 6개월 지출 추이</div>
        <BarChart bars={monthlyTotals} />
        <div className="ledger-insight">{compareText}</div>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 14 }}>
          <span className="emoji">📒</span>아직 기록이 없어요
        </div>
      ) : (
        <div className="ledger-table-wrap">
          <table className="ledger-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>카테고리</th>
                <th>품목</th>
                <th>수량</th>
                <th>금액</th>
                <th>메모</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const meta = categoryMeta(e.category);
                return (
                  <tr key={e.id} className={editingId === e.id ? "editing" : ""}>
                    <td>{e.date}</td>
                    <td>
                      <span className="cat-chip" style={{ background: meta.color }}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>
                    <td>{e.itemName}</td>
                    <td>{e.quantity}</td>
                    <td className="num">{(e.amount * e.quantity).toLocaleString()}원</td>
                    <td className="memo">{e.memo || "-"}</td>
                    <td className="actions">
                      <button type="button" className="ledger-edit" onClick={() => startEdit(e)}>
                        수정
                      </button>
                      <button type="button" className="ledger-del" onClick={() => removeEntry(e.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="ledger-table-total">
            <span>총 합계</span>
            <span className="val">{grandTotal.toLocaleString()}원</span>
          </div>
        </div>
      )}
    </>
  );
}

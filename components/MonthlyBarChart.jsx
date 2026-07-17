"use client";

export function MonthlyBarChart({ deviations, currentMonth }) {
  const validValues = deviations.filter((d) => d != null);
  if (validValues.length === 0) {
    return <div className="no-result">계절 데이터가 부족해요</div>;
  }
  const maxAbs = Math.max(...validValues.map((d) => Math.abs(d)), 1);

  return (
    <div className="month-bars">
      {deviations.map((d, idx) => {
        const month = idx + 1;
        const heightPct = d == null ? 4 : Math.max((Math.abs(d) / maxAbs) * 100, 4);
        const cls = d == null ? "empty" : d >= 0 ? "up" : "down";
        return (
          <div className={`month-bar ${cls} ${month === currentMonth ? "current" : ""}`} key={month}>
            <div className="bar-track">
              <div className="bar-fill" style={{ height: `${heightPct}%` }} />
            </div>
            <div className="bar-label">{month}</div>
          </div>
        );
      })}
    </div>
  );
}

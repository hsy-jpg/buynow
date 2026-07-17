"use client";

import { useEffect, useRef, useState } from "react";

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

/**
 * 캘린더 월별(1~12월) 편차(%) 막대그래프. 외부 라이브러리 없이 canvas로 그린다.
 * deviations: 12개(1~12월) 편차값 배열(null 가능). curMonthIdx: 0~11(이번 달).
 */
const ANIM_MS = 650;
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

export function DeviationBarChart({ deviations, curMonthIdx }) {
  const canvasRef = useRef(null);
  const prevDeviationsRef = useRef(null);
  const rafRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (vals) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const padL = 6, padR = 6, padT = 8, padB = 20;

      ctx.clearRect(0, 0, w, h);

      const maxAbs = Math.max(...deviations.filter((v) => v != null).map((v) => Math.abs(v)), 10);
      const scale = maxAbs * 1.15;
      const usableHalf = (h - padT - padB) / 2;
      const zeroY = padT + usableHalf;

      ctx.strokeStyle = "#E1E6DB";
      ctx.lineWidth = 1;
      [0.5, 1].forEach((f) => {
        [zeroY - usableHalf * f, zeroY + usableHalf * f].forEach((gy) => {
          ctx.beginPath();
          ctx.moveTo(padL, gy);
          ctx.lineTo(w - padR, gy);
          ctx.stroke();
        });
      });

      ctx.strokeStyle = "#C7D0C1";
      ctx.beginPath();
      ctx.moveTo(padL, zeroY);
      ctx.lineTo(w - padR, zeroY);
      ctx.stroke();

      const n = 12;
      const colW = (w - padL - padR) / n;
      const barW = colW * 0.55;
      const bars = [];

      for (let i = 0; i < n; i++) {
        const v = vals[i];
        const finalV = deviations[i];
        const cx = padL + colW * i + colW / 2;

        if (v != null) {
          const barH = (Math.abs(v) / scale) * usableHalf;
          const top = v >= 0 ? zeroY - barH : zeroY;
          const bx = cx - barW / 2;
          ctx.fillStyle = v >= 0 ? "#F1553E" : "#4CAF50";
          ctx.fillRect(bx, top, barW, barH);
          if (i === curMonthIdx) {
            ctx.strokeStyle = "#1F2A1A";
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, top, barW, barH);
          }
          bars.push({ cx, top, v: finalV });
        } else {
          bars.push(null);
        }

        ctx.fillStyle = "#6B7568";
        ctx.font = "10px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(MONTH_LABELS[i], cx, h - 6);
      }

      canvas._bars = bars;
      canvas._colW = colW;
      canvas._padL = padL;
      canvas._lastVals = vals;
    };

    const from = prevDeviationsRef.current || deviations.map((v) => (v == null ? null : 0));
    const to = deviations;
    let start = null;

    function frame(ts) {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / ANIM_MS);
      const eased = easeOutQuart(t);
      const vals = to.map((v, i) => {
        if (v == null) return null;
        const f = from[i] == null ? 0 : from[i];
        return f + (v - f) * eased;
      });
      draw(vals);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        prevDeviationsRef.current = to;
      }
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => draw(canvas._lastVals || to));
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [deviations, curMonthIdx]);

  function onMove(e) {
    const canvas = canvasRef.current;
    if (!canvas || !canvas._bars) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.min(11, Math.max(0, Math.floor((x - canvas._padL) / canvas._colW)));
    const bar = canvas._bars[idx];
    if (!bar) {
      setTooltipVisible(false);
      return;
    }
    const sign = bar.v >= 0 ? "+" : "";
    setTooltip({ x: bar.cx, y: Math.max(0, bar.top - 8), text: `${MONTH_LABELS[idx]} ${sign}${bar.v.toFixed(1)}%` });
    setTooltipVisible(true);
  }

  return (
    <div className="chart-wrap" onMouseMove={onMove} onMouseLeave={() => setTooltipVisible(false)}>
      <canvas ref={canvasRef} height={200} />
      {tooltip && (
        <div
          className={`bar-tooltip ${tooltipVisible ? "visible" : ""}`}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
      <style jsx>{`
        .chart-wrap {
          position: relative;
          width: 100%;
          height: 200px;
          margin-bottom: 8px;
        }
        .chart-wrap canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .bar-tooltip {
          position: absolute;
          transform: translate(-50%, -100%) scale(0.9);
          background: #1f2a1a;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease, left 0.12s ease, top 0.12s ease;
        }
        .bar-tooltip.visible {
          opacity: 1;
          transform: translate(-50%, -100%) scale(1);
        }
      `}</style>
    </div>
  );
}

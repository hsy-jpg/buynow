"use client";

import { useEffect, useRef } from "react";

/** 외부 라이브러리 없이 canvas 로 그리는 월별 지출 막대그래프 (+ 이전 달 평균 점선).
 * bars: [{label, value}] — 마지막 항목을 "이번 달"로 보고, 이전 달 평균 대비 색을 다르게 표시한다. */
export function BarChart({ bars }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bars.length === 0) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const w = rect.width, h = rect.height;
      const padL = 8, padR = 8, padT = 16, padB = 22;

      ctx.clearRect(0, 0, w, h);

      const values = bars.map((b) => b.value);
      const max = Math.max(...values, 1);
      const prev = bars.slice(0, -1).filter((b) => b.value > 0);
      const avg = prev.length > 0 ? prev.reduce((a, b) => a + b.value, 0) / prev.length : null;

      const innerW = w - padL - padR;
      const innerH = h - padT - padB;
      const slot = innerW / bars.length;
      const barW = Math.min(28, slot * 0.5);
      const y = (v) => padT + (1 - v / max) * innerH;

      if (avg != null) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#B9C4B4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padL, y(avg));
        ctx.lineTo(w - padR, y(avg));
        ctx.stroke();
        ctx.restore();
      }

      bars.forEach((b, i) => {
        const cx = padL + slot * i + slot / 2;
        const barH = innerH * (b.value / max);
        const isLast = i === bars.length - 1;
        const isAbove = avg != null && b.value > avg;
        ctx.fillStyle = isLast ? (isAbove ? "#F1553E" : "#7ED321") : "#CFE3BE";

        const x0 = cx - barW / 2;
        const y0 = padT + innerH - barH;
        const r = Math.min(6, barH);
        ctx.beginPath();
        ctx.moveTo(x0, y0 + r);
        ctx.arcTo(x0, y0, x0 + r, y0, r);
        ctx.lineTo(x0 + barW - r, y0);
        ctx.arcTo(x0 + barW, y0, x0 + barW, y0 + r, r);
        ctx.lineTo(x0 + barW, padT + innerH);
        ctx.lineTo(x0, padT + innerH);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#6B7568";
        ctx.font = "11px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.label, cx, h - 6);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [bars]);

  return <canvas ref={canvasRef} height={150} />;
}

"use client";

import { useEffect, useRef } from "react";

/** 외부 라이브러리 없이 canvas 로 그리는 월별 지수 라인 차트 (+ 평균 점선). series: [{year,month,label,index|null}] */
export function LineChart({ series }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const valid = series.filter((d) => d.index != null);
    if (valid.length < 2) return;

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
      const padL = 8, padR = 8, padT = 16, padB = 24;

      ctx.clearRect(0, 0, w, h);

      const values = valid.map((d) => d.index);
      const min = Math.min(...values), max = Math.max(...values);
      const range = max - min || 1;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      const x = (i) => padL + (i / (valid.length - 1)) * (w - padL - padR);
      const y = (v) => padT + (1 - (v - min) / range) * (h - padT - padB);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#B9C4B4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padL, y(avg));
      ctx.lineTo(w - padR, y(avg));
      ctx.stroke();
      ctx.restore();

      const grad = ctx.createLinearGradient(0, padT, 0, h - padB);
      grad.addColorStop(0, "rgba(126,211,33,0.28)");
      grad.addColorStop(1, "rgba(126,211,33,0.02)");
      ctx.beginPath();
      ctx.moveTo(x(0), y(values[0]));
      values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
      ctx.lineTo(x(values.length - 1), h - padB);
      ctx.lineTo(x(0), h - padB);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      values.forEach((v, i) => {
        const px = x(i), py = y(v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = "#7ED321";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.stroke();

      const lastX = x(values.length - 1), lastY = y(values[values.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#4CAF50";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      ctx.fillStyle = "#6B7568";
      ctx.font = "11px Pretendard, sans-serif";
      ctx.textAlign = "center";
      const shownYears = new Set();
      valid.forEach((d, i) => {
        if (!shownYears.has(d.year) && d.month === 1) {
          shownYears.add(d.year);
          ctx.fillText(String(d.year), x(i), h - 6);
        }
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [series]);

  return <canvas ref={canvasRef} height={150} />;
}

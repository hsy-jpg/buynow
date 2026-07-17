"use client";

import { useEffect, useRef } from "react";

/** 외부 라이브러리 없이 canvas 로 그리는 카테고리 비중 도넛 차트. slices: [{label,value,color}] */
export function DonutChart({ slices, centerLabel }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const total = slices.reduce((s, d) => s + d.value, 0);
    if (total <= 0) return;

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
      const cx = w / 2, cy = h / 2;
      const outerR = Math.min(w, h) / 2 - 4;
      const innerR = outerR * 0.6;

      ctx.clearRect(0, 0, w, h);

      let start = -Math.PI / 2;
      slices.forEach((s) => {
        if (s.value <= 0) return;
        const end = start + (s.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, start, end);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        start = end;
      });

      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      if (centerLabel) {
        ctx.fillStyle = "#1F2A1A";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 14px Pretendard, sans-serif";
        ctx.fillText(centerLabel, cx, cy);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [slices, centerLabel]);

  return <canvas ref={canvasRef} height={180} />;
}

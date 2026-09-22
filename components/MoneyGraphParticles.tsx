"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { usePerformanceMode } from "@/context/PerformanceModeContext";

interface MoneyGraphParticlesProps {
  isWarping?: boolean;
}

interface ChartPoint {
  x: number;
  y: number;
  baseXRatio: number;
  baseYOffset: number;
  phase: number;
  amplitude: number;
  frequency: number;
}

interface ChartSeries {
  id: string;
  name: string;
  colorBright: string;
  colorDeep: string;
  baseYRatio: number;
  points: ChartPoint[];
  lineWidth: number;
  showArea: boolean;
}

interface DollarPopup {
  id: number;
  seriesIdx: number;
  pointIdx: number;
  amount: number;
  formatted: string;
  isPositive: boolean;
  spawnTime: number;
  duration: number;
}

export default function MoneyGraphParticles({ isWarping = false }: MoneyGraphParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { performanceMode } = usePerformanceMode();

  const isWarpingRef = useRef(isWarping);
  useEffect(() => {
    isWarpingRef.current = isWarping;
  }, [isWarping]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || performanceMode || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDark = resolvedTheme === "dark";

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Mouse & Crosshair state
    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
    };

    let warpProgress = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
      mouse.active = false;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    let seriesList: ChartSeries[] = [];
    let popups: DollarPopup[] = [];
    let popupIdCounter = 0;
    let lastPopupSpawn = 0;

    const initChartData = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      const pointCount = Math.floor(Math.min(Math.max(width / 45, 18), 32));

      const seriesConfigs = [
        {
          id: "primary",
          name: "Portfolio Growth",
          baseYRatio: 0.52,
          lineWidth: 2.2,
          showArea: true,
          colorBright: isDark ? "rgba(52, 211, 153, " : "rgba(16, 185, 129, ",
          colorDeep: isDark ? "rgba(16, 185, 129, " : "rgba(5, 150, 105, ",
        },
        {
          id: "secondary",
          name: "Income Baseline",
          baseYRatio: 0.65,
          lineWidth: 1.5,
          showArea: false,
          colorBright: isDark ? "rgba(16, 185, 129, " : "rgba(5, 150, 105, ",
          colorDeep: isDark ? "rgba(6, 78, 59, " : "rgba(4, 120, 87, ",
        },
        {
          id: "tertiary",
          name: "Market Index",
          baseYRatio: 0.40,
          lineWidth: 1.2,
          showArea: false,
          colorBright: isDark ? "rgba(110, 231, 183, " : "rgba(52, 211, 153, ",
          colorDeep: isDark ? "rgba(4, 120, 87, " : "rgba(6, 95, 70, ",
        },
      ];

      seriesList = seriesConfigs.map((cfg, sIdx) => {
        const points: ChartPoint[] = [];
        for (let i = 0; i < pointCount; i++) {
          const baseXRatio = i / (pointCount - 1);
          const trendBias = (baseXRatio - 0.5) * -0.15 * height;
          
          points.push({
            x: baseXRatio * width,
            y: cfg.baseYRatio * height + trendBias,
            baseXRatio,
            baseYOffset: trendBias,
            phase: sIdx * 1.5 + i * 0.4,
            amplitude: Math.random() * 18 + 10,
            frequency: Math.random() * 0.002 + 0.001,
          });
        }
        return { ...cfg, points };
      });

      popups = [];
    };

    initChartData();

    const resizeObserver = new ResizeObserver(() => {
      initChartData();
    });
    resizeObserver.observe(container);

    const spawnDollarPopup = (now: number) => {
      if (!seriesList.length) return;

      const sIdx = Math.floor(Math.random() * seriesList.length);
      const points = seriesList[sIdx].points;
      if (!points.length) return;

      const outerIndices: number[] = [];
      points.forEach((pt, pIdx) => {
        const normX = pt.x / width;
        if (normX <= 0.33 || normX >= 0.67) {
          outerIndices.push(pIdx);
        }
      });

      if (!outerIndices.length) return;

      const pIdx = outerIndices[Math.floor(Math.random() * outerIndices.length)];
      const amount = Math.floor(Math.random() * 9998) + 1;
      const isPositive = Math.random() > 0.25;
      const formatted = `${isPositive ? "+" : "-"}\$${amount.toLocaleString()}`;

      popups.push({
        id: ++popupIdCounter,
        seriesIdx: sIdx,
        pointIdx: pIdx,
        amount,
        formatted,
        isPositive,
        spawnTime: now,
        duration: Math.random() * 1000 + 2600,
      });

      if (popups.length > 7) {
        popups.shift();
      }
    };

    let startTime = performance.now();

    const render = (now: number) => {
      const time = reduceMotion ? 0 : (now - startTime) * 0.001;

      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      const targetWarp = isWarpingRef.current ? 1 : 0;
      warpProgress += (targetWarp - warpProgress) * 0.04;

      if (!reduceMotion && now - lastPopupSpawn > 700) {
        spawnDollarPopup(now);
        lastPopupSpawn = now + Math.random() * 300;
      }

      ctx.clearRect(0, 0, width, height);

      // ── Step 1: Draw Financial Grid & Axis Lines ──
      const gridColor = isDark ? "rgba(16, 185, 129, 0.06)" : "rgba(5, 150, 105, 0.05)";
      const horizontalLevels = [0.25, 0.45, 0.65, 0.85];

      ctx.save();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      horizontalLevels.forEach((level) => {
        const y = level * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      });

      ctx.restore();

      const computedSeriesPoints: { x: number; y: number }[][] = [];
      let hoverPoint: { x: number; y: number; seriesName: string; val: string } | null = null;
      let minHoverDist = Infinity;

      // ── Step 2: Render Each Financial Line Chart ──
      seriesList.forEach((series) => {
        const currentPoints: { x: number; y: number }[] = [];

        series.points.forEach((p, pIdx) => {
          let y = series.baseYRatio * height + p.baseYOffset;

          if (!reduceMotion) {
            const wave1 = Math.sin(time * 1.6 + p.phase) * p.amplitude;
            const wave2 = Math.cos(time * 0.8 + p.baseXRatio * 6) * (p.amplitude * 0.5);
            y += wave1 + wave2;

            if (warpProgress > 0.001) {
              const surge = Math.pow(p.baseXRatio, 1.5) * (height * 0.35);
              y -= surge * warpProgress;
            }
          }

          const x = p.baseXRatio * width;

          const dx = x - mouse.x;
          if (Math.abs(dx) < 120 && mouse.active) {
            const influence = (1 - Math.abs(dx) / 120);
            y -= Math.sin(influence * Math.PI) * 12;
          }

          currentPoints.push({ x, y });

          if (mouse.active) {
            const dist = Math.abs(x - mouse.x);
            if (dist < minHoverDist && dist < 50) {
              minHoverDist = dist;
              const valNum = Math.floor(Math.abs(Math.sin(pIdx * 1.7) * 8800) + 1150);
              hoverPoint = {
                x,
                y,
                seriesName: series.name,
                val: `+\$${valNum.toLocaleString()}`,
              };
            }
          }
        });

        computedSeriesPoints.push(currentPoints);
        if (currentPoints.length < 2) return;

        // Area Fill
        if (series.showArea) {
          const areaGrad = ctx.createLinearGradient(0, height * 0.3, 0, height);
          areaGrad.addColorStop(0, `${series.colorBright}${isDark ? "0.18" : "0.10"})`);
          areaGrad.addColorStop(1, `${series.colorDeep}0)`);

          ctx.beginPath();
          ctx.moveTo(currentPoints[0].x, currentPoints[0].y);

          for (let i = 0; i < currentPoints.length - 1; i++) {
            const p1 = currentPoints[i];
            const p2 = currentPoints[i + 1];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          }
          ctx.lineTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();

          ctx.fillStyle = areaGrad;
          ctx.fill();
        }

        // Line Stroke
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);

        for (let i = 0; i < currentPoints.length - 1; i++) {
          const p1 = currentPoints[i];
          const p2 = currentPoints[i + 1];
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
        }
        ctx.lineTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);

        const alpha = isDark ? 0.85 : 0.75;
        ctx.strokeStyle = `${series.colorBright}${alpha * (1 + warpProgress * 0.2)})`;
        ctx.lineWidth = series.lineWidth + (series.id === "primary" ? warpProgress * 0.8 : 0);
        ctx.stroke();

        // Node Points
        currentPoints.forEach((pt, idx) => {
          const pulse = Math.sin(time * 2.5 + idx * 0.5) * 0.2 + 0.8;
          const nodeRadius = (series.id === "primary" ? 3.5 : 2.5) * pulse;

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, nodeRadius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${series.colorBright}${isDark ? "0.2" : "0.15"})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "#ffffff" : "#047857";
          ctx.fill();
          ctx.strokeStyle = `${series.colorBright}0.9)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // ── Step 3: Draw Outer Flank Floating Dollar Popups ──
      popups = popups.filter((pop) => now - pop.spawnTime < pop.duration);

      popups.forEach((pop) => {
        const sPoints = computedSeriesPoints[pop.seriesIdx];
        if (!sPoints || !sPoints[pop.pointIdx]) return;

        const anchor = sPoints[pop.pointIdx];
        const age = now - pop.spawnTime;
        const life = age / pop.duration;

        let opacity = 1;
        if (life < 0.15) {
          opacity = life / 0.15;
        } else if (life > 0.8) {
          opacity = (1 - life) / 0.2;
        }

        const floatY = anchor.y - 18 - life * 28;
        const badgeX = anchor.x;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

        const text = pop.formatted;
        ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
        const textMetrics = ctx.measureText(text);
        const padX = 8;
        const badgeW = textMetrics.width + padX * 2;
        const badgeH = 18;
        const rx = badgeX - badgeW / 2;
        const ry = floatY - badgeH / 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rx, ry, badgeW, badgeH, 9);
        } else {
          ctx.rect(rx, ry, badgeW, badgeH);
        }

        if (pop.isPositive) {
          ctx.fillStyle = isDark ? "rgba(6, 78, 59, 0.92)" : "rgba(209, 250, 229, 0.95)";
          ctx.strokeStyle = isDark ? "rgba(52, 211, 153, 0.75)" : "rgba(16, 185, 129, 0.85)";
        } else {
          ctx.fillStyle = isDark ? "rgba(136, 19, 55, 0.92)" : "rgba(ffe4e6, 0.95)";
          ctx.strokeStyle = isDark ? "rgba(251, 113, 133, 0.75)" : "rgba(225, 29, 72, 0.85)";
        }

        ctx.fill();
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = pop.isPositive
          ? (isDark ? "#6ee7b7" : "#047857")
          : (isDark ? "#fda4af" : "#be123c");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, badgeX, floatY + 0.5);

        ctx.restore();
      });

      // ── Step 4: Inspection Crosshair & Active Point Dollar Callout ──
      if (mouse.active && mouse.x > 0 && mouse.x < width) {
        ctx.save();
        ctx.strokeStyle = isDark ? "rgba(52, 211, 153, 0.4)" : "rgba(16, 185, 129, 0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);

        ctx.beginPath();
        ctx.moveTo(mouse.x, 0);
        ctx.lineTo(mouse.x, height);
        ctx.stroke();

        ctx.restore();

        if (hoverPoint) {
          const hp = hoverPoint as { x: number; y: number; seriesName: string; val: string };
          
          ctx.beginPath();
          ctx.arc(hp.x, hp.y, 7, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? "rgba(52, 211, 153, 0.9)" : "rgba(5, 150, 105, 0.9)";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.save();
          ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
          const hText = hp.val;
          const hMetrics = ctx.measureText(hText);
          const hW = hMetrics.width + 16;
          const hH = 22;
          const hX = hp.x - hW / 2;
          const hY = hp.y - 28 - hH / 2;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(hX, hY, hW, hH, 11);
          } else {
            ctx.rect(hX, hY, hW, hH);
          }

          ctx.fillStyle = isDark ? "rgba(6, 78, 59, 0.95)" : "rgba(255, 255, 255, 0.95)";
          ctx.strokeStyle = isDark ? "rgba(52, 211, 153, 0.9)" : "rgba(16, 185, 129, 0.9)";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = isDark ? "#a7f3d0" : "#047857";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(hText, hp.x, hp.y - 28);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [mounted, performanceMode, resolvedTheme]);

  if (!mounted || performanceMode) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Deep Financial Emerald Backdrop Gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? "radial-gradient(110% 110% at 50% 45%, rgba(6, 78, 59, 0.30) 0%, rgba(2, 44, 34, 0.18) 50%, rgba(5, 6, 15, 0.96) 100%)"
            : "radial-gradient(110% 110% at 50% 45%, rgba(16, 185, 129, 0.10) 0%, rgba(5, 150, 105, 0.04) 55%, rgba(255, 255, 255, 0) 100%)",
        }}
      />

      {/* Deep Central Vignette Shadow Layer behind center hero text & sign in button */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(5, 6, 15, 0.94) 0%, rgba(5, 6, 15, 0.75) 45%, rgba(5, 6, 15, 0.30) 75%, transparent 100%)"
            : "radial-gradient(ellipse 65% 65% at 50% 50%, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.75) 45%, rgba(255, 255, 255, 0.30) 75%, transparent 100%)",
        }}
      />

      {/* Financial Chart Grid Texture */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: isDark
            ? "linear-gradient(to right, rgba(16, 185, 129, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.08) 1px, transparent 1px)"
            : "linear-gradient(to right, rgba(5, 150, 105, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(5, 150, 105, 0.06) 1px, transparent 1px)",
          backgroundSize: "60px 40px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Interactive Canvas */}
      <canvas ref={canvasRef} className="pointer-events-auto absolute inset-0" />
    </div>
  );
}

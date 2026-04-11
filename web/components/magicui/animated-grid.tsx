"use client";

import { useEffect, useRef } from "react";

export function AnimatedGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const spacing = 50;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      // Grid lines
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= cols; i++) {
        const x = i * spacing;
        const dist = Math.abs(x - cx) / cx;
        const wave = Math.sin(time * 0.5 + i * 0.3) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(233,84,32,${(1 - dist) * wave * 0.06})`;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        const y = j * spacing;
        const dist = Math.abs(y - cy) / cy;
        const wave = Math.sin(time * 0.5 + j * 0.3) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(233,84,32,${(1 - dist) * wave * 0.06})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Intersection dots with pulse
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const nd = distFromCenter / maxDist;
          const pulse = Math.sin(time * 0.8 - nd * 5) * 0.5 + 0.5;
          const opacity = (1 - nd) * pulse * 0.2;
          const radius = 1 + pulse * 0.8;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(233,84,32,${opacity})`;
          ctx.fill();
        }
      }

      // Scanning beam — horizontal line that sweeps down
      const beamY = (time * 40) % height;
      const gradient = ctx.createLinearGradient(0, beamY - 30, 0, beamY + 30);
      gradient.addColorStop(0, "rgba(233,84,32,0)");
      gradient.addColorStop(0.5, "rgba(233,84,32,0.08)");
      gradient.addColorStop(1, "rgba(233,84,32,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, beamY - 30, width, 60);

      time += 0.016;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

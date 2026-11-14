/**
 * LiquidSimulation — Skipper UI / Vercel-style interactive fluid canvas.
 * Fluid dynamics and viscous mouse interaction simulation.
 * Linear Obsidian & Electric Iris styling.
 */
import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export function LiquidSimulation({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const mouse = {
      x: width * 0.5,
      y: height * 0.5,
      targetX: width * 0.5,
      targetY: height * 0.5,
      speed: 0,
      radius: 200,
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const dx = currentX - mouse.targetX;
      const dy = currentY - mouse.targetY;
      mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, 10);
      mouse.targetX = currentX;
      mouse.targetY = currentY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const blobs = [
      { x: width * 0.25, y: height * 0.3, vx: 0.5, vy: 0.35, r: 350, color: "rgba(99, 102, 241, 0.12)" }, // Electric Iris
      { x: width * 0.75, y: height * 0.4, vx: -0.4, vy: 0.5, r: 400, color: "rgba(129, 140, 248, 0.09)" }, // Lavender Iris
      { x: width * 0.45, y: height * 0.7, vx: 0.35, vy: -0.4, r: 370, color: "rgba(248, 250, 252, 0.05)" }, // Platinum
      { x: width * 0.6, y: height * 0.2, vx: -0.3, vy: 0.25, r: 320, color: "rgba(67, 56, 202, 0.08)" },  // Deep Indigo
    ];

    let t = 0;

    const render = () => {
      t += 0.015;
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      blobs.forEach((b, i) => {
        b.x += b.vx + Math.sin(t + i) * 0.5;
        b.y += b.vy + Math.cos(t * 0.8 + i) * 0.5;

        if (b.x < -100) b.x = width + 100;
        if (b.x > width + 100) b.x = -100;
        if (b.y < -100) b.y = height + 100;
        if (b.y > height + 100) b.y = -100;

        const dx = mouse.x - b.x;
        const dy = mouse.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius * 2) {
          const force = (1 - dist / (mouse.radius * 2)) * 3;
          b.x -= (dx / (dist || 1)) * force;
          b.y -= (dy / (dist || 1)) * force;
        }

        const currentR = b.r + Math.sin(t * 1.5 + i * 2) * 25 + mouse.speed * 4;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, Math.max(currentR, 50));
        grad.addColorStop(0, b.color);
        grad.addColorStop(0.5, b.color.replace(/[\d\.]+\)$/, "0.03)"));
        grad.addColorStop(1, "rgba(11, 12, 14, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, Math.max(currentR, 50), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
    />
  );
}

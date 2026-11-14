/**
 * CanvasCrowd — Skipper UI (https://skiper-ui.com)
 * Swarm node connectivity canvas simulation.
 * Interactive microservice node transmission with cursor reactivity.
 */
import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export function CanvasCrowd({ className, nodeCount = 55 }) {
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
      x: -1000,
      y: -1000,
      radius: 140,
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const nodes = [];
    const colors = [
      { r: 255, g: 255, b: 255 },
      { r: 228, g: 228, b: 231 },
      { r: 212, g: 212, b: 216 },
      { r: 161, g: 161, b: 170 },
    ];

    for (let i = 0; i < nodeCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        baseRadius: Math.random() * 2 + 1.2,
        color,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (1 - dist / mouse.radius) * 1.5;
          n.x -= (dx / (dist || 1)) * force;
          n.y -= (dy / (dist || 1)) * force;
        }

        const pulse = Math.sin(time + n.pulseOffset) * 0.5 + 0.5;
        const currentR = n.baseRadius + pulse * 1.2;

        ctx.beginPath();
        ctx.arc(n.x, n.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${0.5 + pulse * 0.4})`;
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist2 = Math.hypot(n.x - n2.x, n.y - n2.y);
          const maxDist = 120;

          if (dist2 < maxDist) {
            const alpha = (1 - dist2 / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 z-0", className)}
    />
  );
}

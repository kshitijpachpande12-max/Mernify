/**
 * KineticText / KineticTitle — Skipper UI (https://skiper-ui.com)
 * Kinetic typography with interactive letter physics, spring oscillation, and 3D tilt.
 * Linear Obsidian & Electric Iris styling.
 */
import React, { useState } from "react";
import { cn } from "../../lib/utils";

export function KineticTitle({
  text = "SENTINEL",
  subtitle = "DISTRIBUTED CLOUD OBSERVABILITY",
  className,
}) {
  const letters = text.split("");
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
    setHoveredIdx(null);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative inline-flex flex-col items-center select-none cursor-pointer group",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      {/* Background ambient iris glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/15 via-indigo-400/20 to-purple-500/15 rounded-3xl blur-2xl opacity-50 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none" />

      {/* Kinetic Letters Row */}
      <div
        className="flex items-center gap-1 sm:gap-2 transition-transform duration-300 ease-out"
        style={{
          transform: `rotateY(${mousePos.x * 20}deg) rotateX(${-mousePos.y * 20}deg)`,
        }}
      >
        {letters.map((char, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <span
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              className="relative inline-block font-black text-4xl sm:text-6xl md:text-7xl tracking-wider uppercase transition-all duration-300 transform"
              style={{
                transform: isHovered
                  ? "translateY(-12px) scale(1.15) rotate(-3deg)"
                  : `translateY(${Math.sin((idx / letters.length) * Math.PI) * -3}px)`,
                textShadow: isHovered
                  ? "0 0 35px rgba(99,102,241,0.8), 0 0 60px rgba(129,140,248,0.5)"
                  : "0 0 18px rgba(99,102,241,0.25)",
              }}
            >
              <span className="bg-gradient-to-b from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent group-hover:from-white group-hover:via-indigo-200 group-hover:to-indigo-400 transition-all duration-500">
                {char}
              </span>
            </span>
          );
        })}
      </div>

      {/* Subtitle Badge */}
      {subtitle && (
        <div className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#121316]/90 border border-[#22242a] backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-mono tracking-widest text-indigo-300 uppercase font-semibold">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

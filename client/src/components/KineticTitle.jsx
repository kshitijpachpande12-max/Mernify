import React, { useState } from 'react';

/**
 * KineticTitle — Magic UI / Skipper UI kinetic typography.
 * Displays "SENTINEL" with interactive letter physics, spring oscillation,
 * mouse-tracking 3D tilt, and chromatic iridescent gradient sheen.
 */
export default function KineticTitle({ subtitle = 'DISTRIBUTED CLOUD OBSERVABILITY', className = '' }) {
  const letters = 'SENTINEL'.split('');
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
      className={`relative inline-flex flex-col items-center select-none cursor-pointer group ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Background ambient neon glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

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
                  ? 'translateY(-12px) scale(1.15) rotate(-3deg)'
                  : `translateY(${Math.sin((idx / letters.length) * Math.PI) * -3}px)`,
                textShadow: isHovered
                  ? '0 0 35px rgba(6,182,212,0.8), 0 0 60px rgba(99,102,241,0.6)'
                  : '0 0 20px rgba(6,182,212,0.3)',
              }}
            >
              <span className="bg-gradient-to-br from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent group-hover:from-cyan-200 group-hover:via-white group-hover:to-indigo-300 transition-all duration-500">
                {char}
              </span>
            </span>
          );
        })}
      </div>

      {/* Polished Subtitle Pill */}
      {subtitle && (
        <div className="mt-3 flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[11px] sm:text-xs font-mono tracking-widest text-cyan-300 uppercase font-semibold">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

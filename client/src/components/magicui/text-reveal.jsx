/**
 * TextReveal / TextRevealCard — Magic UI (https://magicui.design/docs/components/text-reveal)
 * Animated text reveal component with sliding curtain unmasking.
 * Linear Obsidian & Electric Iris styling.
 */
import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export function TextRevealCard({
  text = "Engineered for sub-millisecond telemetry ingestion, automated Z-score anomaly detection, and timeline incident replay across distributed microservices.",
  title = "✦ AUTONOMOUS CLOUD TELEMETRY",
  highlights = [
    "100k+ ev/sec Ingest",
    "Z-Score Outlier AI",
    "Timeline Scrubbing",
    "Zero-Drop Buffers",
  ],
  className,
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#121316]/95 border border-[#22242a] p-5 sm:p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-indigo-500/40 hover:shadow-[0_0_35px_rgba(99,102,241,0.12)] group",
        className
      )}
    >
      {/* Sliding Accent Reveal Curtain */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-indigo-950/80 via-indigo-600 to-white z-20 pointer-events-none transition-all duration-1000 ease-out",
          revealed ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
        )}
      />

      {/* Decorative top shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

      {/* Header Pill */}
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wider text-indigo-300 uppercase">
            {title}
          </span>
        </div>
      )}

      {/* Content */}
      <p
        className={cn(
          "text-[#f8fafc] text-sm sm:text-base leading-relaxed font-normal transition-all duration-700",
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {text}
      </p>

      {/* Highlights Grid */}
      {highlights && highlights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#1e2026] grid grid-cols-2 gap-3 text-xs font-mono">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2 text-[#94a3b8]">
              <span className="text-indigo-400 font-bold">✓</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';

/**
 * TextRevealBox — Magic UI inspired Text Reveal Box.
 * Features an animated sliding reveal curtain sweep that unmasks
 * high-impact technical copy, bordered with an iridescent glass frame.
 */
export default function TextRevealBox({
  text = 'Engineered for sub-millisecond telemetry ingestion, automated Z-score anomaly detection, and timeline incident replay across distributed microservices.',
  title = '✦ AUTONOMOUS CLOUD TELEMETRY',
  className = '',
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 sm:p-6 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-cyan-500/40 hover:shadow-[0_0_35px_rgba(6,182,212,0.15)] group ${className}`}
    >
      {/* Sliding Accent Reveal Curtain */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 z-20 pointer-events-none transition-transform duration-1000 ease-in-out ${
          revealed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
      />

      {/* Decorative top shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* Header Pill */}
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
            {title}
          </span>
        </div>
      )}

      {/* Revealed Content */}
      <p
        className={`text-slate-300 text-sm sm:text-base leading-relaxed font-normal transition-all duration-700 ${
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {text}
      </p>

      {/* Highlights Grid */}
      <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-cyan-400">✓</span>
          <span>100k+ ev/sec Ingest</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-indigo-400">✓</span>
          <span>Z-Score Outlier AI</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-teal-400">✓</span>
          <span>Timeline Scrubbing</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-purple-400">✓</span>
          <span>Zero-Drop Buffers</span>
        </div>
      </div>
    </div>
  );
}

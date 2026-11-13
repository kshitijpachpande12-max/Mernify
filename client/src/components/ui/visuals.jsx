import React, { useRef } from 'react';

export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="aurora-blob aurora-blob-a" />
      <div className="aurora-blob aurora-blob-b" />
      <div className="aurora-grid" />
    </div>
  );
}

export function GradientText({ children, className = '' }) {
  return <span className={`gradient-text ${className}`}>{children}</span>;
}

export function MagicCard({ children, className = '' }) {
  const ref = useRef(null);

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        node.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }}
      className={`magic-card relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#121215]/90 shadow-2xl shadow-black/50 backdrop-blur-xl ${className}`}
    >
      <span className="border-beam" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function Panel({ children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#121215]/90 ${className}`}>
      <span className="border-beam border-beam-slow" aria-hidden />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function ShinyButton({ className = '', children, ...props }) {
  return (
    <button className={`shiny-btn rounded-xl px-6 py-2.5 font-bold transition-transform active:scale-[0.98] cursor-pointer ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

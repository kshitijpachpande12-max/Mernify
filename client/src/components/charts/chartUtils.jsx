import React, { useEffect, useRef, useState } from 'react';

export const DISPLAY_POINTS = 96;

export function downsample(data, max = DISPLAY_POINTS) {
  if (!data || data.length <= max) return data || [];
  const last = max - 1;
  const step = (data.length - 1) / last;
  const out = new Array(max);
  for (let i = 0; i < last; i += 1) {
    out[i] = data[Math.round(i * step)];
  }
  out[last] = data[data.length - 1];
  return out;
}

export function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toTimeString().split(' ')[0];
}

export const axisTick = { fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' };

export const tooltipStyle = {
  backgroundColor: 'rgba(18, 19, 22, 0.96)',
  backdropFilter: 'blur(16px)',
  border: '1px solid #22242a',
  borderRadius: '0.75rem',
  boxShadow: '0 12px 35px -5px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(99, 102, 241, 0.15)',
  fontSize: '11px',
  fontFamily: 'monospace',
  padding: '10px 14px',
  color: '#f8fafc',
};

// Smooth monotone curves with anti-aliasing
const lineProps = {
  type: 'monotone',
  dot: false,
  activeDot: { r: 4, strokeWidth: 2, stroke: '#ffffff' },
  isAnimationActive: false,
};

export { lineProps };

/**
 * Reusable SVG Gradients for Linear Obsidian & Electric Iris telemetry fills
 */
export function ChartGradients() {
  return (
    <defs>
      {/* Electric Iris to Transparent */}
      <linearGradient id="irisGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
      </linearGradient>

      {/* Pure White to Transparent */}
      <linearGradient id="whiteGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.28} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
      </linearGradient>

      {/* Cool Slate to Transparent */}
      <linearGradient id="silverGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.22} />
        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.0} />
      </linearGradient>

      {/* Emerald (Healthy Latency) */}
      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#34d399" stopOpacity={0.0} />
      </linearGradient>

      {/* Amber (Degraded / P95) */}
      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.0} />
      </linearGradient>

      {/* Rose (Critical / P99) */}
      <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.28} />
        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
      </linearGradient>

      {/* Fallback aliases */}
      <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
      </linearGradient>
    </defs>
  );
}

export function ChartFrame({ children, empty }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let frame = 0;
    const apply = (width, height) => {
      const w = Math.max(0, Math.floor(width));
      const h = Math.max(0, Math.floor(height));
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };

    apply(el.clientWidth, el.clientHeight);
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(rect.width, rect.height));
    });
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="h-64 w-full">
      {empty ? (
        <div className="flex h-full items-center justify-center text-xs text-[#94a3b8] font-mono">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {empty}
          </span>
        </div>
      ) : (
        size.w > 0 && children(size.w, size.h)
      )}
    </div>
  );
}

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

export const axisTick = { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' };

export const tooltipStyle = {
  backgroundColor: 'rgba(2, 6, 23, 0.92)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '0.85rem',
  boxShadow: '0 10px 35px -5px rgba(0, 0, 0, 0.7)',
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
 * Reusable SVG Gradients for rich Area/Line fills
 */
export function ChartGradients() {
  return (
    <defs>
      {/* Cyan to Transparent */}
      <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
      </linearGradient>

      {/* Indigo to Transparent */}
      <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
      </linearGradient>

      {/* Emerald to Transparent */}
      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
      </linearGradient>

      {/* Amber to Transparent */}
      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
      </linearGradient>

      {/* Rose to Transparent */}
      <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.0} />
      </linearGradient>

      {/* Violet to Transparent */}
      <linearGradient id="violetGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
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
        <div className="flex h-full items-center justify-center text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {empty}
          </span>
        </div>
      ) : (
        size.w > 0 && children(size.w, size.h)
      )}
    </div>
  );
}

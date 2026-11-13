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

export const axisTick = { fill: '#94a3b8', fontSize: 10 };
export const tooltipStyle = {
  backgroundColor: '#020617',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.6rem',
  fontSize: '12px',
};

const lineProps = {
  type: 'linear',
  dot: false,
  activeDot: false,
  isAnimationActive: false,
};

export { lineProps };

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
        <div className="flex h-full items-center justify-center text-xs text-slate-500">{empty}</div>
      ) : (
        size.w > 0 && children(size.w, size.h)
      )}
    </div>
  );
}

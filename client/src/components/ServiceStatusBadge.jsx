import React from 'react';

export default function ServiceStatusBadge({ status = 'down', className = '' }) {
  const isUp = String(status || '').toLowerCase() === 'up';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${
        isUp
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
      } ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isUp ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
        }`}
      />
      {isUp ? 'UP' : 'DOWN'}
    </span>
  );
}

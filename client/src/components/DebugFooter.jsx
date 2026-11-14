import React from 'react';

export default function DebugFooter({ eventsPerSec = 0, renderRate = 0, activeServices = 0 }) {
  const isIngesting = eventsPerSec > 0;
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0b0c0e]/95 backdrop-blur-xl border-t border-[#22242a] px-4 py-2 flex items-center justify-between text-xs text-[#94a3b8] z-50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isIngesting ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className={isIngesting ? 'text-[#f8fafc]' : 'text-[#64748b]'}>
            {isIngesting ? 'Stream Ingestion Active' : 'Stream Ingestion Idle (0 ev/s)'}
          </span>
        </span>
        <span className="hidden sm:inline text-[#2e3038]">|</span>
        <span className="hidden sm:inline">
          Monitored Services: <strong className="text-[#f8fafc] font-mono">{activeServices}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px]">
        <div>
          Ingest:{' '}
          <strong className={isIngesting ? 'text-emerald-400 font-bold' : 'text-[#64748b]'}>
            {eventsPerSec} ev/s
          </strong>
        </div>
        <div>
          FPS: <strong className="text-indigo-400">{renderRate}</strong>
        </div>
      </div>
    </footer>
  );
}

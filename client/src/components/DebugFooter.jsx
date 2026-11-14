import React from 'react';

export default function DebugFooter({ eventsPerSec = 0, renderRate = 0, activeServices = 0 }) {
  const isIngesting = eventsPerSec > 0;
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0e11]/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 flex items-center justify-between text-xs text-zinc-400 z-50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isIngesting ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
          <span className={isIngesting ? 'text-zinc-200' : 'text-zinc-500'}>
            {isIngesting ? 'Stream Ingestion Active' : 'Stream Ingestion Idle (0 ev/s)'}
          </span>
        </span>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <span className="hidden sm:inline">
          Monitored Services: <strong className="text-white font-mono">{activeServices}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px]">
        <div>
          Ingest:{' '}
          <strong className={isIngesting ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
            {eventsPerSec} ev/s
          </strong>
        </div>
        <div>
          FPS: <strong className="text-zinc-300">{renderRate}</strong>
        </div>
      </div>
    </footer>
  );
}

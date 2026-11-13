import React from 'react';

export default function DebugFooter({ eventsPerSec = 0, renderRate = 0, activeServices = 0 }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#0d0e11]/95 backdrop-blur-xl border-t border-zinc-800/80 px-4 py-2 flex items-center justify-between text-xs text-zinc-400 z-50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-200">Stream Ingestion Active</span>
        </span>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <span className="hidden sm:inline">
          Monitored Services: <strong className="text-white font-mono">{activeServices}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px]">
        <div>
          Ingest: <strong className="text-white">{eventsPerSec} ev/s</strong>
        </div>
        <div>
          FPS: <strong className="text-zinc-300">{renderRate}</strong>
        </div>
      </div>
    </footer>
  );
}

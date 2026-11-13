import React from 'react';

export default function DebugFooter({ eventsPerSec = 0, renderRate = 0, activeServices = 0 }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 z-50">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Stream Active</span>
        </span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">
          Active Services: <strong className="text-slate-200">{activeServices}</strong>
        </span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px]">
        <div>
          Events/s: <strong className="text-cyan-400">{eventsPerSec}</strong>
        </div>
        <div>
          Render FPS: <strong className="text-purple-400">{renderRate}</strong>
        </div>
      </div>
    </footer>
  );
}

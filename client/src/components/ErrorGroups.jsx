import React, { useState, useMemo } from 'react';
import { Panel } from './ui/visuals';

export default function ErrorGroups({ errors = [], serviceName = '' }) {
  const [expandedHash, setExpandedHash] = useState(null);

  // Group errors by stackHash
  const grouped = useMemo(() => {
    const map = new Map();
    for (const err of errors) {
      const hash = err.stackHash || 'generic';
      if (!map.has(hash)) {
        map.set(hash, {
          stackHash: hash,
          message: err.message,
          route: err.route,
          count: 0,
          stack: err.stack,
          lastSeen: err.ts,
        });
      }
      const entry = map.get(hash);
      entry.count += err.count || 1;
      if (err.ts > entry.lastSeen) {
        entry.lastSeen = err.ts;
        entry.message = err.message;
        if (err.stack) entry.stack = err.stack;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [errors]);

  const toggleExpand = (hash) => {
    setExpandedHash((prev) => (prev === hash ? null : hash));
  };

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-zinc-500/50 bg-[#121215] border-zinc-800/90">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Error Clusters & Exceptions — <span className="font-mono text-zinc-300">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">Stack hash deduplication and trace inspection</p>
        </div>
        <span
          className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
            grouped.length > 0
              ? 'bg-red-950/40 text-red-300 border border-red-500/30'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {grouped.length} {grouped.length === 1 ? 'cluster' : 'clusters'}
        </span>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-xs font-mono">
          ✓ No error traces or exceptions logged
        </div>
      ) : (
        <div className="space-y-2.5">
          {grouped.map((group) => {
            const isExpanded = expandedHash === group.stackHash;
            return (
              <div
                key={group.stackHash}
                className="bg-[#090a0b]/80 border border-zinc-800/90 rounded-xl p-3.5 text-xs transition-all hover:border-red-500/30"
              >
                <div
                  onClick={() => toggleExpand(group.stackHash)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-red-300 truncate mb-1">
                      {group.message || 'Unknown Exception'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span>route: <strong className="text-white">{group.route || 'global'}</strong></span>
                      <span>•</span>
                      <span>hash: <code className="text-zinc-300">{group.stackHash.slice(0, 8)}</code></span>
                      <span>•</span>
                      <span>seen: {group.lastSeen ? new Date(group.lastSeen).toLocaleTimeString() : 'now'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {group.count}x
                    </span>
                    <span className="text-zinc-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && group.stack && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80">
                    <pre className="font-mono text-[11px] text-zinc-300 bg-black/80 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 border border-zinc-800">
                      {group.stack}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

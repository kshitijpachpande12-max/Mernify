import React, { useState, useMemo } from 'react';

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">
          Error Clusters — <span className="font-mono text-cyan-400">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{grouped.length} groups</span>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          No error traces logged
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((group) => {
            const isExpanded = expandedHash === group.stackHash;
            return (
              <div
                key={group.stackHash}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs"
              >
                <div
                  onClick={() => toggleExpand(group.stackHash)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-rose-400 font-mono font-medium truncate">
                      {group.message}
                    </div>
                    <div className="text-slate-500 text-[11px] font-mono mt-0.5 flex gap-3">
                      <span>route: {group.route || 'n/a'}</span>
                      <span>hash: {group.stackHash.slice(0, 8)}</span>
                      <span>last: {new Date(group.lastSeen).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono font-bold">
                      {group.count}
                    </span>
                    <span className="text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <pre className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded overflow-x-auto whitespace-pre-wrap">
                      {group.stack || group.message || 'No stack trace provided'}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

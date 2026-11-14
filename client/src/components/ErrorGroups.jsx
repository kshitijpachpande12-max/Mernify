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
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-rose-500/30 bg-[#121316] border-[#22242a]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight">
              Error Clusters & Exceptions — <span className="font-mono text-indigo-400">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">Stack hash deduplication and trace inspection</p>
        </div>
        <span
          className={`text-xs font-mono px-2.5 py-0.5 rounded-full ${
            grouped.length > 0
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
              : 'bg-[#18191d] text-[#94a3b8] border border-[#22242a]'
          }`}
        >
          {grouped.length} {grouped.length === 1 ? 'cluster' : 'clusters'}
        </span>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-8 text-[#64748b] text-xs font-mono">
          ✓ No error traces or exceptions logged
        </div>
      ) : (
        <div className="space-y-2.5">
          {grouped.map((group) => {
            const isExpanded = expandedHash === group.stackHash;
            return (
              <div
                key={group.stackHash}
                className="bg-[#0b0c0e] border border-[#22242a] rounded-xl p-3.5 text-xs transition-all hover:border-rose-500/30"
              >
                <div
                  onClick={() => toggleExpand(group.stackHash)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-rose-400 truncate mb-1">
                      {group.message || 'Unknown Exception'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#94a3b8]">
                      <span>route: <strong className="text-[#f8fafc]">{group.route || 'global'}</strong></span>
                      <span>•</span>
                      <span>hash: <code className="text-indigo-300">{group.stackHash.slice(0, 8)}</code></span>
                      <span>•</span>
                      <span>seen: {group.lastSeen ? new Date(group.lastSeen).toLocaleTimeString() : 'now'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/10 border border-rose-500/25 text-rose-400 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                      {group.count}x
                    </span>
                    <span className="text-[#64748b] text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && group.stack && (
                  <div className="mt-3 pt-3 border-t border-[#1e2026]">
                    <pre className="font-mono text-[11px] text-[#94a3b8] bg-[#07080a] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 border border-[#22242a]">
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

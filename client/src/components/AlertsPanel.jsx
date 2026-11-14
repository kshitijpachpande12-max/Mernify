import React, { useState, useMemo } from 'react';

// ---------- helpers ----------

// Accepts ISO strings, ms timestamps, or unix seconds.
const toMs = (ts) => {
  if (ts == null || ts === '') return NaN;
  const n =
    typeof ts === 'number'
      ? ts
      : /^\d+(\.\d+)?$/.test(String(ts))
      ? Number(ts)
      : Date.parse(ts);
  if (Number.isNaN(n)) return NaN;
  return n < 1e12 ? n * 1000 : n; // seconds -> ms
};

const isCritical = (a) =>
  ['critical', 'crit', 'error', 'fatal', 'severe'].includes(
    String(a.severity ?? a.level ?? '').toLowerCase()
  );

// Identity of an alert, used for React keys and for "Clear All".
const fingerprint = (a) =>
  [a.id ?? '', a.ts ?? '', a.serviceName ?? '', a.metric ?? '', a.message ?? '', a.value ?? ''].join('|');

/**
 * Alerts Panel for Sentinel.
 * - Severity filter tabs (All / Critical / Warnings)
 * - Newest alerts first
 * - Hidden scrollbar (still scrollable)
 * - "Clear All" works on its own and also calls the parent's onClear
 */
export default function AlertsPanel({ alerts = [], onClear }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'warning'
  const [expandedId, setExpandedId] = useState(null);
  const [dismissed, setDismissed] = useState(() => new Set());

  // 1) Tag each alert with a stable key, drop dismissed ones, sort newest first.
  //    Tie-break assumes the parent APPENDS new alerts (newest = last in array).
  //    If your parent PREPENDS instead, change `b._i - a._i` to `a._i - b._i`.
  const sortedAlerts = useMemo(() => {
    const seen = new Map();
    return alerts
      .map((a, i) => {
        const fp = fingerprint(a);
        const n = (seen.get(fp) ?? 0) + 1;
        seen.set(fp, n);
        return { ...a, _i: i, _t: toMs(a.ts), _key: `${fp}#${n}` };
      })
      .filter((a) => !dismissed.has(a._key))
      .sort((a, b) => {
        const bothTimed = !Number.isNaN(a._t) && !Number.isNaN(b._t);
        if (bothTimed && a._t !== b._t) return b._t - a._t;
        return b._i - a._i;
      });
  }, [alerts, dismissed]);

  // 2) Counts and the filtered list all come from sortedAlerts.
  const criticalCount = useMemo(() => sortedAlerts.filter(isCritical).length, [sortedAlerts]);
  const warningCount = sortedAlerts.length - criticalCount;

  const filteredAlerts = useMemo(() => {
    if (filter === 'critical') return sortedAlerts.filter(isCritical);
    if (filter === 'warning') return sortedAlerts.filter((a) => !isCritical(a));
    return sortedAlerts;
  }, [sortedAlerts, filter]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const handleClear = () => {
    setDismissed((prev) => {
      const next = new Set(prev);
      sortedAlerts.forEach((a) => next.add(a._key));
      return next;
    });
    setExpandedId(null);
    setFilter('all');
    if (onClear) onClear();
  };

  return (
    <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 shadow-xl flex flex-col h-full backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <h3 className="font-bold text-white text-sm tracking-tight">Active Alerts</h3>
          {sortedAlerts.length > 0 && (
            <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] px-2 py-0.5 rounded-full font-mono font-medium">
              {sortedAlerts.length}
            </span>
          )}
        </div>

        {sortedAlerts.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-[#18191d] hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
            title="Dismiss all active alerts"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {sortedAlerts.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 mb-3 rounded-lg bg-[#090a0b] border border-zinc-800/80 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({sortedAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('critical')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
              filter === 'critical'
                ? 'bg-red-950/60 text-red-200 border border-red-800/50 shadow-sm'
                : 'text-zinc-400 hover:text-red-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('warning')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all cursor-pointer ${
              filter === 'warning'
                ? 'bg-amber-950/60 text-amber-200 border border-amber-800/50 shadow-sm'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Warnings ({warningCount})
          </button>
        </div>
      )}

      {/* Alert stream: renders ONLY filteredAlerts. Scrollbar hidden, still scrollable. */}
      <div className="overflow-y-auto space-y-2 flex-1 max-h-80 pr-1 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center mb-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-white text-xs font-semibold tracking-wide uppercase">
              All Systems Nominal
            </p>
            <p className="text-zinc-500 text-[11px] mt-1">
              Zero anomalies or threshold breaches reported
            </p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <p className="text-zinc-500 text-[11px] text-center py-10">No {filter} alerts</p>
        ) : (
          filteredAlerts.map((alert) => {
            const isCrit = isCritical(alert);
            const isExpanded = expandedId === alert._key;

            return (
              <div
                key={alert._key}
                onClick={() => toggleExpand(alert._key)}
                className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isCrit
                    ? 'bg-red-950/15 border-red-500/25 hover:border-red-500/40'
                    : 'bg-amber-950/15 border-amber-500/25 hover:border-amber-500/40'
                }`}
              >
                {/* Compact row */}
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono shrink-0 ${
                        isCrit
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isCrit ? 'CRIT' : 'WARN'}
                    </span>
                    <span className="text-xs font-semibold text-white truncate">
                      {alert.message || `${alert.metric} breached threshold`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {!Number.isNaN(alert._t)
                        ? new Date(alert._t).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'now'}
                    </span>
                    <span
                      className={`text-[10px] text-zinc-500 transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                </div>

                {/* Diagnostic payload */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 bg-[#090a0b]/60 text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Service:</span>
                      <span className="text-zinc-200 font-medium">{alert.serviceName || 'core'}</span>
                    </div>
                    {alert.metric && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Metric:</span>
                        <span className="text-white font-medium">{alert.metric}</span>
                      </div>
                    )}
                    {alert.value !== undefined && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Measured Value:</span>
                        <span className="text-amber-300 font-bold">{alert.value}</span>
                      </div>
                    )}
                    {alert.type && (
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>Detector:</span>
                        <span className="text-zinc-300">{alert.type}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
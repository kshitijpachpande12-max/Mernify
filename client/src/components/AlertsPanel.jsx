import React, { useState, useMemo } from 'react';

/**
 * Decluttered & luxury-styled Alerts Panel for Sentinel.
 * Provides filterable severity tabs, compact expand-on-demand rows,
 * and a serene "All Systems Nominal" state.
 */
export default function AlertsPanel({ alerts = [], onClear }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'critical' | 'warning'
  const [expandedId, setExpandedId] = useState(null);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === 'critical').length,
    [alerts]
  );
  const warningCount = useMemo(
    () => alerts.filter((a) => a.severity !== 'critical').length,
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    if (filter === 'critical') return alerts.filter((a) => a.severity === 'critical');
    if (filter === 'warning') return alerts.filter((a) => a.severity !== 'critical');
    return alerts;
  }, [alerts, filter]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#121215] border border-zinc-800/90 rounded-2xl p-4 shadow-xl flex flex-col h-full backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <h3 className="font-bold text-white text-sm tracking-tight">Active Alerts</h3>
          {alerts.length > 0 && (
            <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] px-2 py-0.5 rounded-full font-mono font-medium">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-[#18191d] hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
            title="Dismiss all active alerts"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Tabs Bar (only shown when alerts exist) */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 mb-3 rounded-lg bg-[#090a0b] border border-zinc-800/80 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filter === 'critical'
                ? 'bg-red-950/60 text-red-200 border border-red-800/50 shadow-sm'
                : 'text-zinc-400 hover:text-red-300'
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`flex-1 py-1 px-2 rounded-md font-medium transition-all ${
              filter === 'warning'
                ? 'bg-amber-950/60 text-amber-200 border border-amber-800/50 shadow-sm'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            Warnings ({warningCount})
          </button>
        </div>
      )}

      {/* Alert Stream Container */}
      <div className="overflow-y-auto space-y-2 flex-1 max-h-80 pr-1 select-none">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center mb-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-white text-xs font-semibold tracking-wide uppercase">All Systems Nominal</p>
            <p className="text-zinc-500 text-[11px] mt-1">Zero anomalies or threshold breaches reported</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isCrit = alert.severity === 'critical';
            const alertKey = alert.id || `${alert.metric || 'alert'}-${idx}`;
            const isExpanded = expandedId === alertKey;

            return (
              <div
                key={alertKey}
                onClick={() => toggleExpand(alertKey)}
                className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isCrit
                    ? 'bg-red-950/15 border-red-500/25 hover:border-red-500/40'
                    : 'bg-amber-950/15 border-amber-500/25 hover:border-amber-500/40'
                }`}
              >
                {/* Compact Row */}
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
                      {alert.ts ? new Date(alert.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'now'}
                    </span>
                    <span className={`text-[10px] text-zinc-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Collapsible Diagnostic Payload */}
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

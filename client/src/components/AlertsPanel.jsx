import React from 'react';

export default function AlertsPanel({ alerts = [], onClear }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <span>Active Alerts</span>
          {alerts.length > 0 && (
            <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-mono">
              {alerts.length}
            </span>
          )}
        </h3>

        {alerts.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-[11px] font-mono text-slate-400 hover:text-rose-400 transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-rose-500/10 border border-slate-700/60"
            title="Clear all alerts"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="overflow-y-auto space-y-2 flex-1 max-h-80 pr-1">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active anomalies or threshold breaches.
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isCrit = alert.severity === 'critical';
            return (
              <div
                key={alert.id || idx}
                className={`p-3 rounded-lg border text-xs ${
                  isCrit
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isCrit
                        ? 'bg-rose-500/30 text-rose-300'
                        : 'bg-amber-500/30 text-amber-300'
                    }`}
                  >
                    {alert.severity || 'warning'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {alert.ts ? new Date(alert.ts).toLocaleTimeString() : 'now'}
                  </span>
                </div>

                <div className="font-medium text-slate-200 mb-0.5">
                  [{alert.serviceName || 'global'}] {alert.message}
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono mt-1">
                  {alert.metric && <span>metric: {alert.metric}</span>}
                  {alert.type && <span>type: {alert.type}</span>}
                  {alert.value !== undefined && <span>val: {alert.value}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React from 'react';

export default function RouteTable({ routes = {}, serviceName = '' }) {
  const routeEntries = Object.entries(routes || {});

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">
          Endpoint Breakdown — <span className="font-mono text-cyan-400">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{routeEntries.length} routes</span>
      </div>

      {routeEntries.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          No endpoint latency samples received
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Route</th>
                <th className="pb-2 font-medium text-right">Count</th>
                <th className="pb-2 font-medium text-right">Errors</th>
                <th className="pb-2 font-medium text-right">P95 (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {routeEntries.map(([route, info]) => (
                <tr key={route} className="hover:bg-slate-800/30">
                  <td className="py-2 pr-4 text-cyan-300 truncate max-w-xs">{route}</td>
                  <td className="py-2 text-right">{info?.count ?? 0}</td>
                  <td className="py-2 text-right">
                    <span className={info?.errors > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {info?.errors ?? 0}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">
                    {info?.p95 !== undefined ? `${info.p95.toFixed?.(1) ?? info.p95}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Panel } from './ui/visuals';

export default function RouteTable({ routes = {}, serviceName = '' }) {
  const routeEntries = Object.entries(routes || {});

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-cyan-500/30">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Endpoint Breakdown — <span className="font-mono text-cyan-300">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Latency and error distribution per route</p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
          {routeEntries.length} routes
        </span>
      </div>

      {routeEntries.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs font-mono">
          No endpoint latency samples received
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-semibold text-slate-300">Route</th>
                <th className="pb-2.5 font-semibold text-right text-slate-300">Volume</th>
                <th className="pb-2.5 font-semibold text-right text-slate-300">Errors</th>
                <th className="pb-2.5 font-semibold text-right text-slate-300">P95 Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {routeEntries.map(([route, info]) => {
                const hasErrors = (info?.errors ?? 0) > 0;
                return (
                  <tr key={route} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 pr-4 text-cyan-300 font-medium truncate max-w-xs">{route}</td>
                    <td className="py-2.5 text-right font-mono text-slate-200">{info?.count ?? 0}</td>
                    <td className="py-2.5 text-right font-mono">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          hasErrors
                            ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {info?.errors ?? 0}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-medium text-emerald-400">
                      {info?.p95 !== undefined ? `${info.p95.toFixed?.(1) ?? info.p95} ms` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

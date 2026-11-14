import React from 'react';
import { Panel } from './ui/visuals';

export default function RouteTable({ routes = {}, serviceName = '' }) {
  const routeEntries = Object.entries(routes || {});

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-indigo-500/30 bg-[#121316] border-[#22242a]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight">
              Endpoint Breakdown — <span className="font-mono text-indigo-400">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">Latency and error distribution per route</p>
        </div>
        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
          {routeEntries.length} routes
        </span>
      </div>

      {routeEntries.length === 0 ? (
        <div className="text-center py-8 text-[#64748b] text-xs font-mono">
          No endpoint latency samples received
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#22242a] text-[#94a3b8]">
                <th className="pb-2.5 font-semibold text-[#f8fafc]">Route</th>
                <th className="pb-2.5 font-semibold text-right text-[#f8fafc]">Volume</th>
                <th className="pb-2.5 font-semibold text-right text-[#f8fafc]">Errors</th>
                <th className="pb-2.5 font-semibold text-right text-[#f8fafc]">P95 Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2026] text-[#94a3b8]">
              {routeEntries.map(([route, info]) => {
                const hasErrors = (info?.errors ?? 0) > 0;
                return (
                  <tr key={route} className="hover:bg-[#18191d] transition-colors">
                    <td className="py-2.5 pr-4 text-indigo-300 font-medium truncate max-w-xs">{route}</td>
                    <td className="py-2.5 text-right font-mono text-[#f8fafc]">{info?.count ?? 0}</td>
                    <td className="py-2.5 text-right font-mono">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          hasErrors
                            ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/25'
                            : 'text-[#64748b]'
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

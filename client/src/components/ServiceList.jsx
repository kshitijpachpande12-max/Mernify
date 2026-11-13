import React from 'react';
import ServiceStatusBadge from './ServiceStatusBadge';

export default function ServiceList({ services = [], selected = [], onToggle, statuses = {} }) {
  if (services.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-sm">
        No services detected
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {services.map((svc) => {
        const name = typeof svc === 'string' ? svc : svc.serviceName;
        const isChecked = selected.includes(name);
        const status = statuses[name] || (svc.instances?.some((i) => i.status === 'up') ? 'up' : 'down');

        return (
          <label
            key={name}
            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
              isChecked
                ? 'bg-slate-800/80 border-cyan-500/40 text-white'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(name)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <span className="font-mono text-sm truncate">{name}</span>
            </div>
            <ServiceStatusBadge status={status} />
          </label>
        );
      })}
    </div>
  );
}

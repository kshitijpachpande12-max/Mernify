import React from 'react';
import ServiceStatusBadge from './ServiceStatusBadge';

export default function ServiceList({ services = [], selected = [], onToggle, statuses = {} }) {
  if (services.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
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
            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
              isChecked
                ? 'bg-[#18191d] border-zinc-500/80 text-white shadow-sm'
                : 'bg-[#090a0b]/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(name)}
                className="w-4 h-4 rounded bg-[#090a0b] border-zinc-700 text-white focus:ring-0 focus:ring-offset-0"
              />
              <span className="font-mono text-xs font-medium truncate">{name}</span>
            </div>
            <ServiceStatusBadge status={status} />
          </label>
        );
      })}
    </div>
  );
}

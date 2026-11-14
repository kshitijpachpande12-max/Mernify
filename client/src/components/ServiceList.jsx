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

        let status = 'down';
        if (statuses && statuses[name] !== undefined) {
          status = statuses[name];
        } else if (svc && typeof svc === 'object' && Array.isArray(svc.instances) && svc.instances.length > 0) {
          status = svc.instances.some((i) => i.status === 'up') ? 'up' : 'down';
        }

        const isDown = status === 'down';

        return (
          <label
            key={name}
            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
              isChecked
                ? isDown
                  ? 'bg-rose-950/20 border-rose-500/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                  : 'bg-[#18191d] border-indigo-500/60 text-[#f8fafc] shadow-[0_0_15px_rgba(99,102,241,0.12)]'
                : isDown
                ? 'bg-[#0b0c0e] border-rose-950/40 text-[#94a3b8] hover:border-rose-900/60'
                : 'bg-[#0b0c0e] border-[#22242a] text-[#94a3b8] hover:border-[#2e3038]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(name)}
                className="w-4 h-4 rounded bg-[#0b0c0e] border-[#22242a] accent-indigo-500 focus:ring-0"
              />
              <span className={`font-mono text-xs font-medium truncate ${isDown ? 'text-[#94a3b8]' : 'text-[#f8fafc]'}`}>
                {name}
              </span>
            </div>
            <ServiceStatusBadge status={status} />
          </label>
        );
      })}
    </div>
  );
}

import React, { useMemo, memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toTimeString().split(' ')[0];
}

const RequestChart = memo(function RequestChart({ serviceName, data = [] }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: formatTime(d.ts),
      ts: d.ts,
      requests: d.requests ?? 0,
      errors: (d.errors4xx ?? 0) + (d.errors5xx ?? 0),
      errors4xx: d.errors4xx ?? 0,
      errors5xx: d.errors5xx ?? 0,
    }));
  }, [data]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">
          Traffic & Errors — <span className="font-mono text-cyan-400">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{chartData.length} pts</span>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Awaiting traffic metrics…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line
                type="monotone"
                dataKey="requests"
                name="Requests / s"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="errors"
                name="Total Errors"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="errors4xx"
                name="4xx"
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="2 2"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="errors5xx"
                name="5xx"
                stroke="#dc2626"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export default RequestChart;

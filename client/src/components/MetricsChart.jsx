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

const MetricsChart = memo(function MetricsChart({ serviceName, data = [] }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      time: formatTime(d.ts),
      ts: d.ts,
      cpuPercent: Number(d.cpuPercent?.toFixed?.(1) ?? d.cpuPercent),
      memRssMB: Math.round(d.memRssMB ?? 0),
      heapUsedMB: Math.round(d.heapUsedMB ?? 0),
      eventLoopLagMs: Number(d.eventLoopLagMs?.toFixed?.(1) ?? d.eventLoopLagMs),
    }));
  }, [data]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">
          System Metrics — <span className="font-mono text-cyan-400">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{chartData.length} pts</span>
      </div>

      <div className="h-64 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Awaiting metric samples…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
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
                yAxisId="left"
                type="monotone"
                dataKey="cpuPercent"
                name="CPU (%)"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="memRssMB"
                name="RSS (MB)"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heapUsedMB"
                name="Heap (MB)"
                stroke="#ec4899"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="eventLoopLagMs"
                name="Lag (ms)"
                stroke="#eab308"
                strokeWidth={1}
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

export default MetricsChart;

import React, { useMemo, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Panel } from './ui/visuals';
import {
  ChartFrame,
  ChartGradients,
  axisTick,
  downsample,
  formatTime,
  lineProps,
  tooltipStyle,
} from './charts/chartUtils';

const RequestChart = memo(function RequestChart({ serviceName, data = [] }) {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        time: formatTime(d.ts),
        requests: d.requests ?? 0,
        errors: (d.errors4xx ?? 0) + (d.errors5xx ?? 0),
        errors4xx: d.errors4xx ?? 0,
        errors5xx: d.errors5xx ?? 0,
      })),
    [data]
  );

  const latest = chartData[chartData.length - 1];

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-indigo-500/30 bg-[#121316] border-[#22242a]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight">
              Throughput & Error Rates — <span className="font-mono text-indigo-400">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">HTTP request volume against 4xx client and 5xx server faults</p>
        </div>

        {latest && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              RPS: <strong>{latest.requests}/s</strong>
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg border ${
                latest.errors > 0
                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              Errors: <strong>{latest.errors}</strong>
            </span>
          </div>
        )}
      </div>

      <ChartFrame empty={chartData.length === 0 ? 'Awaiting HTTP traffic samples…' : null}>
        {(width, height) => (
          <AreaChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <ChartGradients />
            <CartesianGrid stroke="#1e2026" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" tick={axisTick} minTickGap={28} />
            <YAxis stroke="#64748b" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#94a3b8' }} />
            <Area
              dataKey="requests"
              name="Throughput (Req/s)"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#irisGrad)"
              {...lineProps}
            />
            <Area
              dataKey="errors4xx"
              name="4xx Client"
              stroke="#fbbf24"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              fill="none"
              {...lineProps}
            />
            <Area
              dataKey="errors5xx"
              name="5xx Server"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#roseGrad)"
              {...lineProps}
            />
          </AreaChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default RequestChart;

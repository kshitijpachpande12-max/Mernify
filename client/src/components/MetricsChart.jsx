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

const MetricsChart = memo(function MetricsChart({ serviceName, data = [] }) {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        time: formatTime(d.ts),
        cpuPercent: Number(d.cpuPercent?.toFixed?.(1) ?? d.cpuPercent ?? 0),
        memRssMB: Math.round(d.memRssMB ?? 0),
        heapUsedMB: Math.round(d.heapUsedMB ?? 0),
        eventLoopLagMs: Number(d.eventLoopLagMs?.toFixed?.(1) ?? d.eventLoopLagMs ?? 0),
      })),
    [data]
  );

  const latest = chartData[chartData.length - 1];

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-indigo-500/40 bg-[#121316] border-[#22242a]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-[#f8fafc] tracking-tight">
              Process Health & Memory — <span className="font-mono text-indigo-400">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-0.5">CPU utilization, RSS footprint, heap, and event-loop lag</p>
        </div>

        {latest && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-medium">
              CPU: <strong>{latest.cpuPercent}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#18191d] border border-[#22242a] text-[#94a3b8]">
              RSS: <strong>{latest.memRssMB}MB</strong>
            </span>
          </div>
        )}
      </div>

      <ChartFrame empty={chartData.length === 0 ? 'Awaiting runtime metric samples…' : null}>
        {(width, height) => (
          <AreaChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <ChartGradients />
            <CartesianGrid stroke="#1e2026" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" tick={axisTick} minTickGap={28} />
            <YAxis yAxisId="left" stroke="#64748b" tick={axisTick} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#94a3b8' }} />
            <Area
              yAxisId="left"
              dataKey="cpuPercent"
              name="CPU (%)"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#irisArea)"
              {...lineProps}
            />
            <Area
              yAxisId="right"
              dataKey="memRssMB"
              name="RSS (MB)"
              stroke="#94a3b8"
              strokeWidth={1.8}
              fill="url(#silverGrad)"
              {...lineProps}
            />
            <Area
              yAxisId="right"
              dataKey="heapUsedMB"
              name="Heap (MB)"
              stroke="#a5b4fc"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              fill="none"
              {...lineProps}
            />
            <Area
              yAxisId="left"
              dataKey="eventLoopLagMs"
              name="Lag (ms)"
              stroke="#fbbf24"
              strokeWidth={1.2}
              fill="none"
              {...lineProps}
            />
          </AreaChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default MetricsChart;

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

const LatencyChart = memo(function LatencyChart({ serviceName, data = [] }) {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        time: formatTime(d.ts),
        p50: Number(d.latencyP50?.toFixed?.(1) ?? d.latencyP50 ?? 0),
        p95: Number(d.latencyP95?.toFixed?.(1) ?? d.latencyP95 ?? 0),
        p99: Number(d.latencyP99?.toFixed?.(1) ?? d.latencyP99 ?? 0),
      })),
    [data]
  );

  const latest = chartData[chartData.length - 1];

  return (
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-emerald-500/30">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Latency Distribution (ms) — <span className="font-mono text-cyan-300">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">High-resolution P50, P95, and P99 latency percentiles</p>
        </div>

        {latest && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              P50: <strong>{latest.p50}ms</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
              P99: <strong>{latest.p99}ms</strong>
            </span>
          </div>
        )}
      </div>

      <ChartFrame empty={chartData.length === 0 ? 'Awaiting latency telemetry…' : null}>
        {(width, height) => (
          <AreaChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <ChartGradients />
            <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" tick={axisTick} minTickGap={28} />
            <YAxis stroke="#475569" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Area
              dataKey="p50"
              name="P50 (Median)"
              stroke="#10b981"
              strokeWidth={1.8}
              fill="url(#emeraldGrad)"
              {...lineProps}
            />
            <Area
              dataKey="p95"
              name="P95 (Tail)"
              stroke="#f59e0b"
              strokeWidth={1.8}
              fill="url(#amberGrad)"
              {...lineProps}
            />
            <Area
              dataKey="p99"
              name="P99 (Critical)"
              stroke="#f43f5e"
              strokeWidth={2.2}
              fill="url(#roseGrad)"
              {...lineProps}
            />
          </AreaChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default LatencyChart;

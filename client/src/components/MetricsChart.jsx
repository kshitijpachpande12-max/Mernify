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
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-cyan-500/30">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Process Health & Memory — <span className="font-mono text-cyan-300">{serviceName}</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">CPU utilization, RSS footprint, heap, and event-loop lag</p>
        </div>

        {latest && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              CPU: <strong>{latest.cpuPercent}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              RSS: <strong>{latest.memRssMB}MB</strong>
            </span>
          </div>
        )}
      </div>

      <ChartFrame empty={chartData.length === 0 ? 'Awaiting runtime metric samples…' : null}>
        {(width, height) => (
          <AreaChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <ChartGradients />
            <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" tick={axisTick} minTickGap={28} />
            <YAxis yAxisId="left" stroke="#475569" tick={axisTick} />
            <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Area
              yAxisId="left"
              dataKey="cpuPercent"
              name="CPU (%)"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#cyanGrad)"
              {...lineProps}
            />
            <Area
              yAxisId="right"
              dataKey="memRssMB"
              name="RSS (MB)"
              stroke="#818cf8"
              strokeWidth={1.8}
              fill="url(#indigoGrad)"
              {...lineProps}
            />
            <Area
              yAxisId="right"
              dataKey="heapUsedMB"
              name="Heap (MB)"
              stroke="#f472b6"
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

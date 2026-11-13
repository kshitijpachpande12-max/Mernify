import React, { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Panel } from './ui/visuals';
import { ChartFrame, axisTick, downsample, formatTime, lineProps, tooltipStyle } from './charts/chartUtils';

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

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Latency Distribution (ms) — <span className="font-mono text-cyan-300">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{data.length} pts</span>
      </div>
      <ChartFrame empty={chartData.length === 0 ? 'Awaiting latency metrics…' : null}>
        {(width, height) => (
          <LineChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#475569" tick={axisTick} minTickGap={28} />
            <YAxis stroke="#475569" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line dataKey="p50" name="P50" stroke="#34d399" strokeWidth={1.5} {...lineProps} />
            <Line dataKey="p95" name="P95" stroke="#fbbf24" strokeWidth={1.5} {...lineProps} />
            <Line dataKey="p99" name="P99" stroke="#f87171" strokeWidth={2} {...lineProps} />
          </LineChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default LatencyChart;

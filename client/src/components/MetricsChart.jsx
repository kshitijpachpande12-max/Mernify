import React, { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Panel } from './ui/visuals';
import { ChartFrame, axisTick, downsample, formatTime, lineProps, tooltipStyle } from './charts/chartUtils';

const MetricsChart = memo(function MetricsChart({ serviceName, data = [] }) {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        time: formatTime(d.ts),
        cpuPercent: Number(d.cpuPercent?.toFixed?.(1) ?? d.cpuPercent),
        memRssMB: Math.round(d.memRssMB ?? 0),
        heapUsedMB: Math.round(d.heapUsedMB ?? 0),
        eventLoopLagMs: Number(d.eventLoopLagMs?.toFixed?.(1) ?? d.eventLoopLagMs),
      })),
    [data]
  );

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          System Metrics — <span className="font-mono text-cyan-300">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{data.length} pts</span>
      </div>
      <ChartFrame empty={chartData.length === 0 ? 'Awaiting metric samples…' : null}>
        {(width, height) => (
          <LineChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#475569" tick={axisTick} minTickGap={28} />
            <YAxis yAxisId="left" stroke="#475569" tick={axisTick} />
            <YAxis yAxisId="right" orientation="right" stroke="#475569" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line yAxisId="left" dataKey="cpuPercent" name="CPU (%)" stroke="#22d3ee" strokeWidth={1.5} {...lineProps} />
            <Line yAxisId="right" dataKey="memRssMB" name="RSS (MB)" stroke="#a78bfa" strokeWidth={1.5} {...lineProps} />
            <Line yAxisId="right" dataKey="heapUsedMB" name="Heap (MB)" stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" {...lineProps} />
            <Line yAxisId="left" dataKey="eventLoopLagMs" name="Lag (ms)" stroke="#facc15" strokeWidth={1} {...lineProps} />
          </LineChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default MetricsChart;

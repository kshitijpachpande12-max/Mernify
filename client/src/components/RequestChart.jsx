import React, { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Panel } from './ui/visuals';
import { ChartFrame, axisTick, downsample, formatTime, lineProps, tooltipStyle } from './charts/chartUtils';

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

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Traffic & Errors — <span className="font-mono text-cyan-300">{serviceName}</span>
        </h3>
        <span className="text-xs text-slate-500">{data.length} pts</span>
      </div>
      <ChartFrame empty={chartData.length === 0 ? 'Awaiting traffic metrics…' : null}>
        {(width, height) => (
          <LineChart width={width} height={height} data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#475569" tick={axisTick} minTickGap={28} />
            <YAxis stroke="#475569" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line dataKey="requests" name="Requests / s" stroke="#38bdf8" strokeWidth={1.5} {...lineProps} />
            <Line dataKey="errors" name="Total Errors" stroke="#f87171" strokeWidth={1.5} {...lineProps} />
            <Line dataKey="errors4xx" name="4xx" stroke="#fb923c" strokeWidth={1} strokeDasharray="2 2" {...lineProps} />
            <Line dataKey="errors5xx" name="5xx" stroke="#ef4444" strokeWidth={1.5} {...lineProps} />
          </LineChart>
        )}
      </ChartFrame>
    </Panel>
  );
});

export default RequestChart;

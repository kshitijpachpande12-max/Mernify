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

const RequestChart = memo(function RequestChart({ serviceName, data = [], isDown = false }) {
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
    <Panel className="p-5 shadow-2xl transition-all duration-300 hover:border-zinc-500/50 bg-[#121215] border-zinc-800/90">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDown ? 'bg-rose-500' : 'bg-white animate-pulse'
              }`}
            />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Throughput & Error Rates — <span className="font-mono text-zinc-300">{serviceName}</span>
            </h3>
            {isDown && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                OFFLINE
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">HTTP request volume against 4xx client and 5xx server faults</p>
        </div>

        {latest && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-white">
              RPS: <strong>{latest.requests}/s</strong>
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg border ${
                latest.errors > 0
                  ? 'bg-red-950/40 border-red-500/30 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
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
            <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke="#52525b" tick={axisTick} minTickGap={28} />
            <YAxis stroke="#52525b" tick={axisTick} />
            <Tooltip contentStyle={tooltipStyle} isAnimationActive={false} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: '#a1a1aa' }} />
            <Area
              dataKey="requests"
              name="Throughput (Req/s)"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#whiteGrad)"
              {...lineProps}
            />
            <Area
              dataKey="errors4xx"
              name="4xx Client"
              stroke="#fb923c"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              fill="none"
              {...lineProps}
            />
            <Area
              dataKey="errors5xx"
              name="5xx Server"
              stroke="#f87171"
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

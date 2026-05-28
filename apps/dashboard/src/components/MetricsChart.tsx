"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "../lib/cn";
import type { HealingEvent } from "../lib/supabase";

type MetricsChartProps = {
  events: HealingEvent[];
  loading?: boolean;
  className?: string;
};

type SeriesPoint = {
  day: string;
  label: string;
  count: number;
};

function getDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDayLabel(value: Date) {
  return value.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function buildSeries(events: HealingEvent[]): SeriesPoint[] {
  const today = new Date();
  const dayBuckets = new Map<string, number>();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    day.setHours(0, 0, 0, 0);
    dayBuckets.set(getDayKey(day), 0);
  }

  for (const event of events) {
    if (!event.created_at) continue;

    const timestamp = new Date(event.created_at);
    if (Number.isNaN(timestamp.getTime())) continue;

    const key = getDayKey(timestamp);
    if (!dayBuckets.has(key)) continue;

    dayBuckets.set(key, (dayBuckets.get(key) || 0) + 1);
  }

  return Array.from(dayBuckets.entries()).map(([day, count]) => {
    const date = new Date(`${day}T00:00:00`);
    return {
      day,
      label: formatDayLabel(date),
      count,
    };
  });
}

type ChartTooltipPayload = {
  value?: number | string;
  label?: string;
  payload?: {
    label?: string;
  };
};

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayload[] }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const count = typeof item.value === "number" ? item.value : 0;
  const label = String(item.payload?.label || item.label || "");

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Healing events</p>
      <p className="mt-1 text-sm font-medium text-white">{label}</p>
      <p className="mt-2 text-sm text-emerald-300">{count} event{count === 1 ? "" : "s"}</p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[22rem] flex-col rounded-[2rem] border border-zinc-800/80 bg-zinc-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-36 rounded-full bg-zinc-800/70" />
          <div className="h-6 w-64 rounded-full bg-zinc-800/60" />
        </div>
        <div className="h-8 w-24 rounded-full bg-zinc-800/60" />
      </div>
      <div className="mt-6 grid flex-1 grid-rows-[auto_1fr] gap-4">
        <div className="h-3 rounded-full bg-zinc-800/50" />
        <div className="relative overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-900/40">
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(90deg,transparent,rgba(16,185,129,0.08),transparent)]" />
        </div>
      </div>
    </div>
  );
}

export default function MetricsChart({ events, loading = false, className }: MetricsChartProps) {
  const series = useMemo(() => buildSeries(events), [events]);

  const total = useMemo(() => series.reduce((sum, point) => sum + point.count, 0), [series]);
  const peak = useMemo(() => series.reduce((max, point) => Math.max(max, point.count), 0), [series]);

  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <section className={cn("rounded-[2rem] border border-zinc-800/80 bg-zinc-950/70 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.3)]", className)}>
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Metrics</p>
          <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-white">Healing events over time</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            A 7-day view of the real healing stream, aggregated into a compact observability chart.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <StatPill label="7d total" value={String(total)} />
          <StatPill label="Peak day" value={String(peak)} />
        </div>
      </div>

      <div className="mt-5 h-[18rem] rounded-[1.5rem] border border-zinc-800 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,rgba(9,9,11,0.95),rgba(9,9,11,0.75))] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="healingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.42} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="healingStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(63,63,70,0.45)" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={14}
              interval={0}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
              tickMargin={8}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(16,185,129,0.2)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="url(#healingStroke)"
              strokeWidth={3}
              fill="url(#healingFill)"
              dot={{ r: 3, strokeWidth: 2, fill: "#050505", stroke: "#34d399" }}
              activeDot={{ r: 5, strokeWidth: 0, fill: "#6ee7b7" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-2">
      <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-1 font-sans text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
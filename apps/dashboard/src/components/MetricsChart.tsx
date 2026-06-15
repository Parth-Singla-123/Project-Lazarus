"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { HealingEvent } from "../lib/supabase";

export default function MetricsChart({ events }: { events: HealingEvent[] }) {
  const data = useMemo(() => {
    // Mock simple trailing 7 days logic based on data
    const counts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      counts[d.toLocaleDateString("en-US", { weekday: 'short' })] = 0;
    }
    events.forEach(e => {
      if (e.created_at) {
        const day = new Date(e.created_at).toLocaleDateString("en-US", { weekday: 'short' });
        if (counts[day] !== undefined) counts[day]++;
      }
    });
    return Object.entries(counts).map(([name, total]) => ({ name, total }));
  }, [events]);

  return (
    <div className="h-64 w-full rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Healing Velocity</h3>
        <p className="text-xs text-zinc-500">Autonomous AST rewrites over the last 7 days</p>
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
              activeDot={{ r: 6, fill: "#10b981", stroke: "#000", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
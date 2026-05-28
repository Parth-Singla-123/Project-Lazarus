import { Activity, CheckCircle2, Clock3, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import Badge from "./Badge";
import StatCard from "./StatCard";

type SidebarProps = {
  connectionState: string;
  total: number;
  healed: number;
  failed: number;
  pending: number;
};

export default function Sidebar({ connectionState, total, healed, failed, pending }: SidebarProps) {
  const online = connectionState === "live";

  return (
    <aside className="border-b border-white/5 bg-zinc-950/80 p-6 backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Project Lazarus</p>
          <h1 className="font-sans text-xl font-semibold tracking-tight text-white">Healing Command Center</h1>
        </div>
      </div>

      <div className="space-y-3">
        <StatCard
          label="Realtime"
          value={online ? "Connected" : connectionState}
          tone={online ? "success" : "neutral"}
          hint={online ? "Supabase live feed" : "Connecting to stream"}
        />
        <StatCard label="Total" value={String(total)} tone="info" hint="Loaded in the current session" />
        <StatCard label="Healed" value={String(healed)} tone="success" />
        <StatCard label="Failed" value={String(failed)} tone="danger" />
        <StatCard label="Pending" value={String(pending)} tone="neutral" />
      </div>

      <div className="mt-8 space-y-4 rounded-[1.75rem] border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%),linear-gradient(180deg,rgba(9,9,11,0.88),rgba(9,9,11,0.72))] p-4 text-sm text-zinc-300">
        <div className="flex items-center gap-2 text-zinc-100">
          <Clock3 size={16} className="text-emerald-400" />
          <span className="font-medium">Live stream</span>
        </div>
        <p className="leading-6 text-zinc-400">
          Healing events are loaded from Supabase and streamed into the dashboard as new rows are inserted.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Badge tone="info" icon={<Activity size={12} />}>Ops view</Badge>
          <Badge tone="neutral" icon={<Loader2 size={12} />}>Realtime aware</Badge>
          <Badge tone="success" icon={<CheckCircle2 size={12} />}>Self-healing</Badge>
          <Badge tone="danger" icon={<AlertTriangle size={12} />}>Failure tracing</Badge>
        </div>
      </div>
    </aside>
  );
}
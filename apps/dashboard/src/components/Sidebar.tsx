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
    <aside className="border-b border-white/5 bg-zinc-950/82 p-6 backdrop-blur-xl lg:w-[22rem] lg:border-b-0 lg:border-r lg:border-white/5">
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Project Lazarus</p>
            <h1 className="font-sans text-xl font-semibold tracking-tight text-white">Observability Plane</h1>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-white shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-medium">Realtime: {online ? "Connected" : connectionState}</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-emerald-200/80">
            Listening to CI/CD Pipeline
          </p>
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
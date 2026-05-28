import { cn } from "../lib/cn";

type StatTone = "neutral" | "success" | "danger" | "info";

const toneClasses: Record<StatTone, string> = {
  neutral: "border-zinc-800 bg-zinc-950/80 text-zinc-100",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-200",
};

export type StatCardProps = {
  label: string;
  value: string;
  tone?: StatTone;
  className?: string;
  hint?: string;
};

export default function StatCard({ label, value, tone = "neutral", className, hint }: StatCardProps) {
  return (
    <div className={cn("min-w-24 rounded-2xl border px-4 py-3 backdrop-blur", toneClasses[tone], className)}>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}
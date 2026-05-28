import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type BadgeTone = "neutral" | "success" | "danger" | "warning" | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-zinc-800 bg-zinc-900 text-zinc-200",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  danger: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-200",
};

export type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
};

export default function Badge({ children, tone = "neutral", className, icon }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type CodeDiffRow = {
  type: "removed" | "added";
  lineNumber: number;
  code: string;
  note?: string;
};

export type CodeDiffProps = {
  title?: string;
  description?: string;
  filePath?: string;
  rows: CodeDiffRow[];
  footer?: ReactNode;
  className?: string;
};

const rowTone = {
  removed: {
    row: "bg-rose-950/40 text-rose-100",
    prefix: "text-rose-400",
    code: "text-rose-200",
  },
  added: {
    row: "bg-emerald-950/40 text-emerald-100",
    prefix: "text-emerald-400",
    code: "text-emerald-200",
  },
} as const;

export default function CodeDiff({
  title = "Code diff",
  description = "GitHub-style change preview committed by Lazarus.",
  filePath,
  rows,
  footer,
  className,
}: CodeDiffProps) {
  return (
    <section className={cn("overflow-hidden rounded-[1.5rem] border border-white/5 bg-zinc-950/80 shadow-[0_18px_60px_rgba(0,0,0,0.32)]", className)}>
      <div className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>

        {filePath ? (
          <div className="rounded-full border border-white/5 bg-zinc-900/70 px-3 py-1 text-[11px] font-mono tracking-[0.18em] text-zinc-400">
            {filePath}
          </div>
        ) : (
          <div className="rounded-full border border-white/5 bg-zinc-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
            Diff viewer
          </div>
        )}
      </div>

      <div>
        <div className="grid grid-cols-[80px_44px_1fr] border-b border-white/5 bg-zinc-900/60 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-zinc-500 sm:px-5">
          <div>Line</div>
          <div>Tag</div>
          <div>Code</div>
        </div>

        <div className="divide-y divide-white/5">
          {rows.map((row, index) => {
            const tone = rowTone[row.type];

            return (
              <div key={`${row.type}-${row.lineNumber}-${index}`} className={cn("grid grid-cols-[80px_44px_1fr] px-4 py-3 sm:px-5", tone.row)}>
                <div className="font-mono text-xs tabular-nums text-zinc-400">{row.lineNumber}</div>
                <div className={cn("font-mono text-xs font-semibold", tone.prefix)}>{row.type === "removed" ? "-" : "+"}</div>
                <div className="min-w-0 font-mono text-sm leading-6">
                  <span className={cn("whitespace-pre-wrap break-words", tone.code, row.type === "removed" && "line-through decoration-rose-400/60")}>{row.code}</span>
                  {row.note ? <span className="ml-2 text-xs text-zinc-500">{row.note}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {footer ? <div className="border-t border-white/5 bg-black/40 p-4 sm:p-5">{footer}</div> : null}
    </section>
  );
}
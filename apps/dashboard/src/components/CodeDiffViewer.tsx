import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type CodeDiffLine = {
  type: "removed" | "added";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  emphasis?: string;
};

export type CodeDiffViewerProps = {
  title?: string;
  description?: string;
  lines: CodeDiffLine[];
  footer?: ReactNode;
  className?: string;
};

const toneStyles = {
  removed: {
    row: "bg-rose-950/40 text-rose-100",
    prefix: "text-rose-400",
    line: "text-rose-300/90",
  },
  added: {
    row: "bg-emerald-950/40 text-emerald-100",
    prefix: "text-emerald-400",
    line: "text-emerald-200",
  },
} as const;

export default function CodeDiffViewer({
  title = "Code diff",
  description = "Git-style change set committed by Lazarus.",
  lines,
  footer,
  className,
}: CodeDiffViewerProps) {
  return (
    <section className={cn("overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80", className)}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{title}</p>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          Diff viewer
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-[88px_44px_1fr] border-b border-zinc-800 bg-zinc-900/60 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-zinc-500 sm:px-5">
          <div>Line</div>
          <div>Tag</div>
          <div>Content</div>
        </div>

        <div className="divide-y divide-zinc-900/80">
          {lines.map((line, index) => {
            const styles = toneStyles[line.type];
            const lineNumber = line.type === "removed" ? line.oldLineNumber : line.newLineNumber;

            return (
              <div key={`${line.type}-${lineNumber ?? index}-${index}`} className={cn("grid grid-cols-[88px_44px_1fr] px-4 py-3 sm:px-5", styles.row)}>
                <div className="font-mono text-xs text-zinc-400 tabular-nums">
                  {lineNumber ?? ""}
                </div>
                <div className={cn("font-mono text-xs font-semibold", styles.prefix)}>
                  {line.type === "removed" ? "-" : "+"}
                </div>
                <div className="min-w-0 font-mono text-sm leading-6">
                  <span className={cn("whitespace-pre-wrap break-words", styles.line, line.type === "removed" && "line-through decoration-rose-400/60")}>{line.content}</span>
                  {line.emphasis ? <span className="ml-2 text-xs text-zinc-500">{line.emphasis}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {footer ? <div className="border-t border-zinc-800 bg-black/40 p-4 sm:p-5">{footer}</div> : null}
    </section>
  );
}
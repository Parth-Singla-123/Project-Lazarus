"use client";

import { Check, X } from "lucide-react";

export type CodeDiffRow = {
  type: "removed" | "added" | "context";
  lineNumber: number;
  code: string;
};

export default function CodeDiff({
  oldSelector,
  newSelector,
}: {
  oldSelector: string;
  newSelector: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050505] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
          <div className="h-3 w-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">AST Rewriter</p>
      </div>

      <div className="font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed">
        {/* Context Line */}
        <div className="flex border-l-[3px] border-transparent px-4 py-1 text-zinc-500">
          <span className="w-8 select-none text-right opacity-40 pr-4">41</span>
          <span className="w-6 opacity-0"> </span>
          <span>{`// Playwright automation step`}</span>
        </div>

        {/* Removed Line */}
        <div className="flex border-l-[3px] border-rose-500 bg-rose-500/[0.08] px-4 py-1.5 text-rose-200">
          <span className="w-8 select-none text-right opacity-40 pr-4">42</span>
          <span className="w-6 text-rose-500 flex items-center"><X size={12}/></span>
          <span className="line-through decoration-rose-500/50 opacity-80">{`await lazarus.click("${oldSelector}");`}</span>
        </div>

        {/* Added Line */}
        <div className="flex border-l-[3px] border-emerald-500 bg-emerald-500/[0.08] px-4 py-1.5 text-emerald-200 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
          <span className="w-8 select-none text-right opacity-40 pr-4">42</span>
          <span className="w-6 text-emerald-500 flex items-center"><Check size={12}/></span>
          <span>{`await lazarus.click("${newSelector}");`}</span>
        </div>

        {/* Context Line */}
        <div className="flex border-l-[3px] border-transparent px-4 py-1 text-zinc-500">
          <span className="w-8 select-none text-right opacity-40 pr-4">43</span>
          <span className="w-6 opacity-0"> </span>
          <span>{`await page.waitForLoadState("networkidle");`}</span>
        </div>
      </div>
    </div>
  );
}
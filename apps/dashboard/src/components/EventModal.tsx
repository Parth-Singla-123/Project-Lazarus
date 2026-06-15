"use client";

import { ArrowRight, CheckCircle2, Clock, GitCommit, Search, X, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner"; // <-- NEW IMPORT
import CodeDiff from "./CodeDiff";
import type { HealingEvent } from "../lib/supabase";

export default function EventModal({
  event,
  onClose,
}: {
  event: HealingEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  const healed = (event.status || "FAILED").toUpperCase() === "HEALED";

  // Mock Handlers for the Demo
  const handleRollback = () => {
    toast.error("AST Rollback Initiated", {
      description: "Reverting the selector change in the remote Git repository.",
    });
    setTimeout(onClose, 1500); // Close modal after click
  };

  const handleApprove = () => {
    toast.success("Healed Code Approved", {
      description: "The AI fix has been verified and committed to the main branch.",
    });
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative flex h-[90vh] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
        
        <header className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${healed ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/20 bg-rose-500/10 text-rose-400'}`}>
              {healed ? <CheckCircle2 size={20} /> : <X size={20} />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">{event.target_description}</h2>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono mt-1">
                <span className="flex items-center gap-1"><GitCommit size={12}/> {event.script_id || "Unknown"}</span>
                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(event.created_at!).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* UPDATED BUTTONS */}
            <button onClick={handleRollback} className="flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20">
              <RotateCcw size={14} />
              Rollback AST
            </button>
            <button onClick={handleApprove} className="flex items-center gap-2 rounded-lg border border-transparent bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Check size={14} />
              Approve Fix
            </button>
            <button onClick={onClose} className="ml-4 p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: AI Vision Image */}
          <div className="relative flex-[1.2] border-r border-white/5 bg-[#050505] p-6 overflow-hidden flex items-center justify-center">
            {/* Grid background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {event.screenshot_base64 ? (
              <div className="relative z-10 w-full max-h-full rounded-xl border border-white/10 bg-black/50 shadow-2xl overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none" />
                <div className="absolute top-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                  <Search size={14} className="text-emerald-400" /> AI Visual Context
                </div>
                <img
                  src={`data:image/jpeg;base64,${event.screenshot_base64}`}
                  alt="AI Vision"
                  className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center text-zinc-500">
                <div className="h-16 w-16 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-4 bg-zinc-900/50">
                  <Search size={24} />
                </div>
                <p>No vision context captured</p>
              </div>
            )}
          </div>

          {/* Right: Code & Data */}
          <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-6 space-y-6">
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <GitCommit size={16} className="text-zinc-500" />
                AST Modification Diff
              </h3>
              <CodeDiff oldSelector={event.old_selector || ""} newSelector={event.new_selector || ""} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Healing Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Target Locator</p>
                  <p className="font-mono text-sm text-zinc-300 break-all">{event.old_selector}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4">
                  <p className="text-xs uppercase tracking-widest text-emerald-500/70 mb-1">AI Generated Locator</p>
                  <p className="font-mono text-sm text-emerald-300 break-all">{event.new_selector}</p>
                </div>
              </div>
            </div>

            {event.error_stack && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">V8 Engine Stack Trace</h3>
                <div className="rounded-xl border border-rose-500/10 bg-[#050505] p-4">
                  <pre className="text-[11px] font-mono leading-relaxed text-rose-200/70 overflow-x-auto whitespace-pre-wrap">
                    {event.error_stack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";
import React from "react";
import { ArrowRight, CheckCircle2, Clock3, ExternalLink, ZoomIn, X } from "lucide-react";
import Badge from "./Badge";
import CodeDiffViewer from "./CodeDiffViewer";
import type { HealingEvent } from "../lib/supabase";

export default function HealingDetailModal({
  event,
  onClose,
}: {
  event: HealingEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;

  const status = (event.status || "failed").toLowerCase();
  const healed = status === "healed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-zinc-800/90 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.55)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-zinc-800 bg-zinc-900/90 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="border-b border-zinc-800/80 px-6 py-5 pr-16">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Healing detail</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">{event.target_description || "Event"}</h3>
              <p className="mt-1 text-sm text-zinc-400">{event.script_id || "unknown script"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={healed ? "success" : "danger"}>
                <CheckCircle2 size={14} />
                {healed ? "HEALED" : "FAILED"}
              </Badge>
              <Badge tone="neutral">
                <Clock3 size={14} />
                {event.created_at ? new Date(event.created_at).toLocaleString() : "-"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: Vision */}
          <div className="border-b border-zinc-800/80 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_45%),#09090b] p-4 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-4">
              {event.screenshot_base64 ? (
                <div className="group relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black/50 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                  <div className="pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-zinc-200 backdrop-blur">
                    <ZoomIn size={12} />
                    Hover to inspect
                  </div>
                  <div className="pointer-events-none absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-emerald-200 backdrop-blur">
                    <ExternalLink size={12} />
                    AI overlay
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${event.screenshot_base64}`}
                    alt={event.target_description || "Annotated UI"}
                    className="max-h-[70vh] w-full origin-center object-contain transition duration-500 ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                  />
                </div>
              ) : (
                <div className="text-center text-zinc-500">
                  <Clock3 className="mx-auto mb-3 text-zinc-600" size={20} />
                  <p>No screenshot available</p>
                  <p className="mt-2 text-xs text-zinc-600">Telemetry can still record the selector diff and stack trace.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Code Diff + Terminal */}
          <div className="flex min-h-0 flex-col gap-4 bg-zinc-950 p-4 lg:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard label="Old selector" value={event.old_selector || "(none)"} />
              <InfoCard label="New selector" value={event.new_selector || "(none)"} accent />
            </div>

            <CodeDiffViewer
              title="Code diff"
              description="Git-style rewrite preview committed by Lazarus."
              lines={[
                {
                  type: "removed",
                  oldLineNumber: 1,
                  content: `await lazarus.click("${event.old_selector || ""}")`,
                },
                {
                  type: "added",
                  newLineNumber: 2,
                  content: `await lazarus.click("${event.new_selector || ""}")`,
                },
              ]}
              footer={
                <>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Error stack trace</p>
                      <p className="mt-1 text-sm text-zinc-400">Captured from the failed click and preserved for diagnostics.</p>
                    </div>
                    <ArrowRight size={16} className="text-zinc-500" />
                  </div>
                  <pre className="max-h-52 overflow-auto rounded-2xl border border-zinc-800 bg-black/70 p-4 text-xs leading-6 whitespace-pre-wrap text-zinc-400">
                    {event.error_stack || "No stack trace available."}
                  </pre>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-emerald-500/20 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/60"}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-white">{value}</p>
    </div>
  );
}

"use client";

import { ArrowRight, CheckCircle2, Clock3, ExternalLink, ZoomIn, X } from "lucide-react";
import Badge from "./Badge";
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
  const statusLabel = healed ? "HEALED" : "FAILED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950 shadow-[0_30px_120px_rgba(0,0,0,0.58)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/5 bg-zinc-900/90 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <header className="border-b border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)] px-6 py-5 pr-16 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Healing detail</p>
              <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {event.target_description || "Event"}
              </h3>
              <p className="font-mono text-sm text-zinc-400">{event.script_id || "unknown script"}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={healed ? "success" : "danger"} icon={<CheckCircle2 size={14} />}>
                {statusLabel}
              </Badge>
              <Badge tone="neutral" icon={<Clock3 size={14} />}>
                {event.created_at ? new Date(event.created_at).toLocaleString() : "-"}
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-0 lg:grid-cols-[1.18fr_0.82fr]">
          <section className="border-b border-white/5 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.1),_transparent_45%),#09090b] p-4 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-white/5 bg-zinc-950/80 p-4">
              {event.screenshot_base64 ? (
                <div className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-black/50 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
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
                    className="max-h-[72vh] w-full origin-center object-contain transition duration-500 ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-950/70 px-6 py-10 text-center text-zinc-500">
                  <Clock3 className="mx-auto mb-3 text-zinc-600" size={20} />
                  <p className="text-white">No screenshot available</p>
                  <p className="mt-2 text-xs text-zinc-600">The telemetry row still preserves selectors and stack trace.</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-4 bg-zinc-950 p-4 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard label="Old selector" value={event.old_selector || "(none)"} />
              <InfoCard label="New selector" value={event.new_selector || "(none)"} accent />
            </div>

            <CodeDiff
              title="Code diff"
              description="GitHub-style rewrite preview committed by Lazarus."
              filePath="selector-update.tsx"
              rows={[
                {
                  type: "removed",
                  lineNumber: 42,
                  code: `await lazarus.click("${event.old_selector || ""}")`,
                },
                {
                  type: "added",
                  lineNumber: 43,
                  code: `await lazarus.click("${event.new_selector || ""}")`,
                },
              ]}
              footer={
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Error stack trace</p>
                      <p className="mt-1 text-sm text-zinc-400">Captured from the failed click and preserved for diagnostics.</p>
                    </div>
                    <ArrowRight size={16} className="text-zinc-500" />
                  </div>

                  <pre className="max-h-56 overflow-auto rounded-2xl border border-white/5 bg-black/70 p-4 font-mono text-xs leading-6 whitespace-pre-wrap text-zinc-400">
                    {event.error_stack || "No stack trace available."}
                  </pre>
                </div>
              }
            />
          </section>
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
    <div className={`rounded-2xl border p-4 ${accent ? "border-emerald-500/20 bg-emerald-500/10" : "border-white/5 bg-zinc-900/60"}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-white">{value}</p>
    </div>
  );
}
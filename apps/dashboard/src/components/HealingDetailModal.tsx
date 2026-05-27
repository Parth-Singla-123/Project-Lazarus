"use client";
import React from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Clock3, X } from "lucide-react";
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${event.screenshot_base64}`}
                alt={event.target_description || "Annotated UI"}
                className="max-h-[70vh] w-full rounded-2xl border border-zinc-800 object-contain"
              />
            ) : (
              <div className="text-center text-zinc-500">
                <ChevronDown className="mx-auto mb-3 text-zinc-600" size={20} />
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

            <div className="flex-1 overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-900/70">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Code diff</p>
                  <p className="mt-1 text-sm text-zinc-400">The rewrite Lazarus committed to the file.</p>
                </div>
                <ArrowRight size={16} className="text-zinc-500" />
              </div>

              <div className="space-y-4 p-4">
                <CodeLine tone="removed">{`await lazarus.click("${event.old_selector || ""}")`}</CodeLine>
                <CodeLine tone="added">{`await lazarus.click("${event.new_selector || ""}")`}</CodeLine>
              </div>

              <div className="border-t border-zinc-800 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Error stack trace</p>
                <pre className="mt-3 max-h-52 overflow-auto rounded-2xl border border-zinc-800 bg-black/70 p-4 text-xs leading-6 text-zinc-400 whitespace-pre-wrap">
                  {event.error_stack || "No stack trace available."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-zinc-800 bg-zinc-900 text-zinc-200",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</div>;
}

function CodeLine({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "removed" | "added";
}) {
  const tones = {
    removed: "border-rose-500/20 bg-rose-500/10 text-rose-200 line-through",
    added: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  };

  return <div className={`rounded-2xl border px-4 py-3 font-mono text-sm ${tones[tone]}`}>{children}</div>;
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

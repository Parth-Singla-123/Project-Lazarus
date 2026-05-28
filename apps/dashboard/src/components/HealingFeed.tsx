"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Filter, Loader2, Search, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Badge from "./Badge";
import { cn } from "../lib/cn";
import type { HealingEvent } from "../lib/supabase";

type HealingFeedProps = {
  events: HealingEvent[];
  allEventsCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (event: HealingEvent) => void;
  loading?: boolean;
};

function formatRelativeTime(value?: string | null): string {
  if (!value) return "just now";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function statusTone(status?: string | null) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "HEALED") {
    return {
      label: "HEALED",
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      icon: CheckCircle2,
    };
  }

  if (normalized === "FAILED") {
    return {
      label: "FAILED",
      className: "border-rose-500/30 bg-rose-500/10 text-rose-300",
      icon: ShieldAlert,
    };
  }

  return {
    label: normalized || "PENDING",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    icon: Loader2,
  };
}

function FeedSkeleton() {
  return (
    <div className="space-y-4 p-5 sm:p-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="rounded-[1.4rem] border border-white/5 bg-zinc-950/60 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-full bg-zinc-800/80" />
              <div className="h-5 w-72 rounded-full bg-zinc-800/70" />
              <div className="h-3 w-52 rounded-full bg-zinc-800/60" />
            </div>
            <div className="h-8 w-8 rounded-full bg-zinc-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query, hasEvents }: { query: string; hasEvents: boolean }) {
  const title = query.trim() ? "No matching events" : hasEvents ? "Nothing to show" : "No healing events yet";
  const description = query.trim()
    ? "Try a broader search or clear the filter to reveal the feed."
    : hasEvents
      ? "The feed exists, but the current view has no rows to render."
      : "Run the E2E demo to generate the first healing event and watch the stream light up.";

  const icons: Array<{ icon: LucideIcon; className: string }> = [
    { icon: ShieldAlert, className: "text-rose-300" },
    { icon: CheckCircle2, className: "text-emerald-300" },
    { icon: ArrowUpRight, className: "text-sky-300" },
  ];

  return (
    <div className="px-5 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-dashed border-zinc-800/90 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_45%),linear-gradient(180deg,rgba(9,9,11,0.88),rgba(9,9,11,0.7))] p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2">
          {icons.map(({ icon: Icon, className }, index) => (
            <div key={index} className={cn("flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5", className)}>
              <Icon size={14} />
            </div>
          ))}
        </div>

        <h4 className="mt-6 text-2xl font-semibold tracking-tight text-white">{title}</h4>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">{description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Badge tone="success">Realtime feed</Badge>
          <Badge tone="neutral">Searchable</Badge>
          <Badge tone="info">Supabase inserts</Badge>
        </div>
      </div>
    </div>
  );
}

export default function HealingFeed({ events, allEventsCount, query, onQueryChange, onSelect, loading = false }: HealingFeedProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/60 shadow-[0_32px_120px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/5 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Realtime healing feed
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">Healing events</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Monitor the newest heals first, inspect the screenshot, and review the source rewrite from the same surface.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">{events.length} visible</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1">{allEventsCount} total</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 focus-within:border-emerald-500/40">
            <Search size={16} className="shrink-0 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Filter by target, script, selector, or status"
              className="w-full bg-transparent outline-none placeholder:text-zinc-600"
            />
          </label>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-400">
            <Filter size={14} />
            <span>Playwright → AI → AST → Supabase</span>
          </div>
        </div>
      </div>

      {loading ? (
        <FeedSkeleton />
      ) : events.length === 0 ? (
        <EmptyState query={query} hasEvents={allEventsCount > 0} />
      ) : (
        <div className="divide-y divide-zinc-800/80">
          <AnimatePresence initial={false}>
            {events.map((event) => {
              const tone = statusTone(event.status);
              const StatusIcon = tone.icon;

              return (
                <motion.button
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: -12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelect(event)}
                  className="group w-full overflow-hidden border-0 px-5 py-5 text-left transition-colors hover:bg-zinc-900/50 sm:px-6"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={event.status === "HEALED" ? "success" : event.status === "FAILED" ? "danger" : "warning"} icon={<StatusIcon size={12} />}>
                          {tone.label}
                        </Badge>
                        <span className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
                          {event.script_id || "unknown script"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-medium text-white transition-colors group-hover:text-emerald-300">
                          {event.target_description || "(no description)"}
                        </h4>
                        <p className="mt-1 max-w-3xl font-mono text-sm text-zinc-400">
                          {event.old_selector || "unknown selector"} <span className="text-zinc-600">→</span> {event.new_selector || "pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-zinc-500 md:text-right">
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <span className="text-zinc-300">{formatRelativeTime(event.created_at)}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-600">updated</span>
                      </div>
                      <ArrowUpRight size={16} className="text-zinc-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-300" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
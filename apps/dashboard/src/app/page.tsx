"use client";
import React, { useEffect, useMemo, useState } from "react";
import { supabase, HealingEvent } from "../lib/supabase";
import HealingDetailModal from "../components/HealingDetailModal";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

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
      icon: AlertTriangle,
    };
  }

  return {
    label: normalized || "PENDING",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    icon: Loader2,
  };
}

export default function Page() {
  const [events, setEvents] = useState<HealingEvent[]>([]);
  const [selected, setSelected] = useState<HealingEvent | null>(null);
  const [query, setQuery] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("healing_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("[dashboard] could not load healing events:", error);
          return;
        }

        if (isMounted && data) setEvents(data as HealingEvent[]);
      } catch (err) {
        console.error(err);
      }
    }

    void load();

    const channel = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "healing_events" },
        (payload) => {
          const newEvent = payload.new as HealingEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 50));
        }
      )
      .subscribe((status) => {
        setConnectionState(status === "SUBSCRIBED" ? "live" : status.toLowerCase());
      });

    return () => {
      isMounted = false;
      try {
        // Unsubscribe cleanly
        channel.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return events;

    return events.filter((event) => {
      const haystack = [
        event.target_description,
        event.script_id,
        event.old_selector,
        event.new_selector,
        event.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [events, query]);

  const stats = useMemo(() => {
    const healed = events.filter((event) => event.status === "HEALED").length;
    const failed = events.filter((event) => event.status === "FAILED").length;
    const pending = events.filter((event) => event.status === "PENDING").length;

    return {
      total: events.length,
      healed,
      failed,
      pending,
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,#09090b_0%,#050505_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-zinc-800/70 bg-zinc-950/70 p-6 backdrop-blur lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.06)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Project Lazarus</p>
              <h1 className="font-sans text-xl font-semibold tracking-tight text-white">Healing Command Center</h1>
            </div>
          </div>

          <div className="space-y-3">
            <SidebarStat label="Realtime" value={connectionState === "live" ? "Connected" : connectionState} icon={Activity} highlight />
            <SidebarStat label="Healed" value={String(stats.healed)} icon={CheckCircle2} />
            <SidebarStat label="Failed" value={String(stats.failed)} icon={AlertTriangle} />
            <SidebarStat label="Pending" value={String(stats.pending)} icon={Loader2} />
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            <div className="flex items-center gap-2 text-zinc-100">
              <Clock3 size={16} className="text-emerald-400" />
              <span className="font-medium">Live stream</span>
            </div>
            <p className="mt-2 leading-6 text-zinc-400">
              Events are loaded from Supabase and appended in real time when new healing rows arrive.
            </p>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Realtime healing feed
              </div>
              <div>
                <h2 className="font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Monitor every self-heal, rewrite, and event in one place.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  A compact, high-contrast operations view for Lazarus. Search the feed, inspect a healing event, and review the code diff behind each fix.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatCard label="Total" value={String(stats.total)} tone="neutral" />
              <StatCard label="Healed" value={String(stats.healed)} tone="success" />
              <StatCard label="Failed" value={String(stats.failed)} tone="danger" />
            </div>
          </header>

          <section className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Feed status</p>
                <RefreshCw size={14} className="text-zinc-500" />
              </div>
              <p className="mt-3 text-lg font-semibold text-white">{filteredEvents.length} visible events</p>
              <p className="mt-1 text-sm text-zinc-400">The list updates automatically when Supabase emits inserts.</p>
            </div>

            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Search</p>
              <label className="mt-3 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300 focus-within:border-emerald-500/40">
                <Search size={16} className="shrink-0 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter by target, script, selector, or status"
                  className="w-full bg-transparent outline-none placeholder:text-zinc-600"
                />
              </label>
            </div>

            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Filter size={14} />
                <p className="text-xs uppercase tracking-[0.3em]">Pipeline</p>
              </div>
              <p className="mt-3 text-lg font-semibold text-white">Playwright → AI → AST → Supabase</p>
              <p className="mt-1 text-sm text-zinc-400">Each healing event records the change and feeds the dashboard live.</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800/80 bg-zinc-950/60 shadow-[0_32px_120px_rgba(0,0,0,0.35)]">
            <div className="border-b border-zinc-800/80 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Healing events</h3>
                  <p className="text-sm text-zinc-400">Newest events appear at the top. Click any row to inspect the screenshot and diff.</p>
                </div>
                <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400">
                  {connectionState === "live" ? "Realtime live" : `Realtime ${connectionState}`}
                </div>
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {filteredEvents.length === 0 ? (
                <div className="px-5 py-16 text-center sm:px-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-500">
                    <ArrowUpRight size={20} />
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-white">No matching events</h4>
                  <p className="mt-2 text-sm text-zinc-400">
                    Try a broader search or run the E2E demo to generate a healing event.
                  </p>
                </div>
              ) : (
                filteredEvents.map((event) => {
                  const tone = statusTone(event.status);
                  const StatusIcon = tone.icon;

                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelected(event)}
                      className="group w-full border-0 px-5 py-5 text-left transition-colors hover:bg-zinc-900/50 sm:px-6"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tone.className}`}>
                              <StatusIcon size={12} className={tone.label === "FAILED" ? "" : ""} />
                              {tone.label}
                            </span>
                            <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                              {event.script_id || "unknown script"}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-base font-medium text-white transition-colors group-hover:text-emerald-300">
                              {event.target_description || "(no description)"}
                            </h4>
                            <p className="mt-1 max-w-3xl text-sm text-zinc-400">
                              {event.old_selector || "unknown selector"} → {event.new_selector || "pending"}
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
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>

      {selected && <HealingDetailModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function SidebarStat({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
        highlight
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-zinc-800/80 bg-zinc-900/60"
      }`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
        <p className="mt-1 text-base font-semibold text-white">{value}</p>
      </div>
      <Icon size={16} className={highlight ? "text-emerald-300" : "text-zinc-500"} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-zinc-800 bg-zinc-950/80 text-zinc-100",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  return (
    <div className={`min-w-24 rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}


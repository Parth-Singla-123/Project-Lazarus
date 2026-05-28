"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Filter } from "lucide-react";
import { supabase, type HealingEvent } from "../lib/supabase";
import HealingDetailModal from "../components/HealingDetailModal";
import HealingFeed from "../components/HealingFeed";
import MetricsChart from "../components/MetricsChart";
import Sidebar from "../components/Sidebar";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";

export default function Page() {
  const [events, setEvents] = useState<HealingEvent[]>([]);
  const [selected, setSelected] = useState<HealingEvent | null>(null);
  const [query, setQuery] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function load() {
      setLoading(true);

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

        if (isActive && data) {
          setEvents(data as HealingEvent[]);
        }
      } catch (error) {
        console.error("[dashboard] unexpected load error:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
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
      isActive = false;

      try {
        void channel.unsubscribe();
      } catch {
        // ignore cleanup errors in the client
      }
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return events;

    return events.filter((event) => {
      const haystack = [event.target_description, event.script_id, event.old_selector, event.new_selector, event.status]
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.1),_transparent_20%),linear-gradient(180deg,#09090b_0%,#050505_100%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <Sidebar
          connectionState={connectionState}
          total={stats.total}
          healed={stats.healed}
          failed={stats.failed}
          pending={stats.pending}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge tone="info">Realtime observability</Badge>
              <div>
                <h2 className="font-sans text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Monitor every self-heal, rewrite, and event in one place.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                  A compact operations console for Lazarus. Review the chart, search the feed, and inspect the exact code diff behind each fix.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <StatCard label="Total" value={String(stats.total)} tone="info" />
              <StatCard label="Healed" value={String(stats.healed)} tone="success" />
              <StatCard label="Failed" value={String(stats.failed)} tone="danger" />
            </div>
          </header>

          <section className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-white/5 bg-zinc-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Feed status</p>
                  <p className="mt-2 text-lg font-semibold text-white">{filteredEvents.length} visible events</p>
                </div>
                <ArrowUpRight size={16} className="text-zinc-500" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <InfoTile label="Loaded" value={String(events.length)} />
                <InfoTile label="Filtered" value={String(filteredEvents.length)} />
                <InfoTile label="Connection" value={connectionState === "live" ? "live" : connectionState} />
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <Filter size={14} className="text-emerald-400" />
                <span>The list updates automatically when Supabase emits inserts.</span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-zinc-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Pipeline</p>
                  <p className="mt-2 text-lg font-semibold text-white">Playwright → AI → AST → Supabase</p>
                </div>
                <Badge tone="success">Prod-ready</Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Search" value="Target, script, selector" />
                <InfoTile label="Mode" value="Realtime + analytics" />
                <InfoTile label="UI" value="Dark ops console" />
                <InfoTile label="Font" value="Space Grotesk + IBM Plex Mono" />
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Each healing event records the change, refreshes the feed live, and contributes to the 7-day activity chart.
              </p>
            </div>
          </section>

          <div className="mb-6">
            <MetricsChart events={events} loading={loading} />
          </div>

          <HealingFeed
            events={filteredEvents}
            allEventsCount={events.length}
            query={query}
            onQueryChange={setQuery}
            onSelect={setSelected}
            loading={loading}
          />
        </main>
      </div>

      {selected ? <HealingDetailModal event={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-950/70 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}
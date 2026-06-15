"use client";

import { useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner"
import { supabase, type HealingEvent } from "../lib/supabase";
import EventModal from "../components/EventModal";
import LiveFeed from "../components/LiveFeed";
import MetricsChart from "../components/MetricsChart";
import Sidebar from "../components/Sidebar";

export default function Page() {
  const [events, setEvents] = useState<HealingEvent[]>([]);
  const [selected, setSelected] = useState<HealingEvent | null>(null);
  const [query, setQuery] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("healing_events").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setEvents(data as HealingEvent[]);
    }
    load();

    const channel = supabase.channel("custom-all-channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "healing_events" }, (payload) => {
        setEvents((prev) => [payload.new as HealingEvent, ...prev].slice(0, 50));
      }).subscribe((status) => setConnectionState(status === "SUBSCRIBED" ? "live" : status.toLowerCase()));

    return () => { channel.unsubscribe(); };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = query.toLowerCase();
    return events.filter(e => [e.target_description, e.script_id, e.old_selector, e.new_selector].join(" ").toLowerCase().includes(q));
  }, [events, query]);

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      <Toaster theme="dark" position="bottom-right" />
      <Sidebar connectionState={connectionState} total={events.length} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            
            <header>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Observability Overview</h1>
              <p className="text-sm text-zinc-500">Monitor autonomous AST rewrites and visual pipeline metrics.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 h-[70vh]">
              {/* Left Column: Feed */}
              <LiveFeed 
                events={filteredEvents} 
                query={query} 
                onQueryChange={setQuery} 
                onSelect={setSelected} 
              />

              {/* Right Column: Chart & Stats */}
              <div className="space-y-8 flex flex-col">
                <MetricsChart events={events} />
                
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 flex-1">
                  <h3 className="text-sm font-semibold text-white mb-4">Infrastructure Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-zinc-500 text-sm">Ollama LLaVA</span>
                      <span className="text-emerald-400 text-sm font-mono bg-emerald-400/10 px-2 py-1 rounded">Online</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <span className="text-zinc-500 text-sm">Playwright Wrapper</span>
                      <span className="text-emerald-400 text-sm font-mono bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 text-sm">AST Rewriter</span>
                      <span className="text-emerald-400 text-sm font-mono bg-emerald-400/10 px-2 py-1 rounded">v1.0.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-white/5 bg-[#050505] py-6 text-center">
          <p className="text-xs text-zinc-600 font-mono">
            PROJECT LAZARUS • ENTERPRISE E2E RESILIENCE ENGINE • DEPLOYED VIA NEXT.JS
          </p>
        </footer>
      </div>

      <EventModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, Terminal, AlertCircle, CheckCircle2 } from "lucide-react";
import type { HealingEvent } from "../lib/supabase";

export default function LiveFeed({
  events,
  query,
  onQueryChange,
  onSelect,
}: {
  events: HealingEvent[];
  query: string;
  onQueryChange: (val: string) => void;
  onSelect: (ev: HealingEvent) => void;
}) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/10 bg-black shadow-xl overflow-hidden">
      
      {/* Header & Search */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0A0A0A] p-4">
        <div className="flex items-center gap-3 text-white">
          <Terminal size={18} className="text-zinc-400" />
          <h3 className="font-semibold tracking-tight">Execution Feed</h3>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
            {events.length} logs
          </span>
        </div>
        
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search selectors or scripts..."
            className="w-full rounded-lg border border-white/10 bg-black py-1.5 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 bg-[#050505]">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="p-10 text-center text-zinc-600 flex flex-col items-center">
               <Terminal size={32} className="mb-3 opacity-20" />
               <p>No events match your criteria.</p>
            </div>
          ) : (
            events.map((event) => {
              const healed = event.status === "HEALED";
              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(event)}
                  className="group cursor-pointer mb-2 rounded-xl border border-white/5 bg-[#0A0A0A] p-4 hover:bg-white/[0.03] hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border ${healed ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-rose-500/20 bg-rose-500/10'}`}>
                        {healed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                          {event.target_description}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-xs font-mono text-zinc-500">
                          <span className="text-rose-400/70 line-through truncate max-w-[200px] block">{event.old_selector}</span>
                          <span>→</span>
                          <span className="text-emerald-400/70 truncate max-w-[200px] block">{event.new_selector}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2 py-1 rounded-md">
                        {event.script_id?.split('/').pop() || 'script'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
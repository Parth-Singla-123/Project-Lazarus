import { ShieldCheck, LayoutDashboard, GitPullRequest, Settings, TerminalSquare } from "lucide-react";

export default function Sidebar({ connectionState, total }: { connectionState: string; total: number }) {
  const online = connectionState === "live";

  return (
    <aside className="w-64 border-r border-white/5 bg-[#050505] p-6 flex flex-col h-screen sticky top-0">
      
      {/* Brand */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
          <ShieldCheck size={18} strokeWidth={2.5} />
        </div>
        <span className="font-sans text-lg font-bold tracking-tight text-white">Lazarus</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        <NavItem icon={<LayoutDashboard size={16} />} label="Overview" active />
        <NavItem icon={<TerminalSquare size={16} />} label="Pipelines" />
        <NavItem icon={<GitPullRequest size={16} />} label="Approvals" badge={total} />
        <NavItem icon={<Settings size={16} />} label="AI Settings" />
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Connection Status */}
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <div>
            <p className="text-xs font-semibold text-white">Supabase Link</p>
            <p className="text-[10px] text-zinc-500">{online ? 'Connected to stream' : 'Connecting...'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, badge }: any) {
  return (
    <div className={`flex items-center justify-between cursor-pointer rounded-lg px-3 py-2 transition-colors ${active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge > 0 && <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">{badge}</span>}
    </div>
  );
}
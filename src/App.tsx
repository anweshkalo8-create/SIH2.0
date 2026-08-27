import { useState } from 'react';
import { Compass, Waves, Ship, Info, LayoutDashboard } from 'lucide-react';
import { PROJECT, type ViewId } from '@/data/appContent';
import { Dashboard } from '@/pages/Dashboard';
import { OceanExplorer } from '@/pages/OceanExplorer';
import { DisasterManagement } from '@/pages/DisasterManagement';
import { About } from '@/pages/About';

export default function App() {
  const [view, setView] = useState<ViewId>('explorer');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Universal Navbar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30">
            <Compass size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-wide text-white">{PROJECT.title}</span>
            <span className="text-[10px] uppercase tracking-wider text-cyan-400/80">MoES · INCOIS</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setView('explorer')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'explorer'
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Waves size={14} />
            3D Ocean Explorer
          </button>

          <button
            onClick={() => setView('disaster')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'disaster'
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Ship size={14} />
            Disaster (SAR)
          </button>

          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={14} />
            Overview
          </button>

          <button
            onClick={() => setView('about')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === 'about'
                ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Info size={14} />
            About
          </button>
        </nav>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          ROMS Model Active
        </div>
      </header>

      {/* Main Screen Viewport */}
      <main className="relative flex-1 overflow-hidden">
        {view === 'explorer' && <OceanExplorer />}
        {view === 'disaster' && <DisasterManagement />}
        {view === 'dashboard' && <Dashboard onLaunch={() => setView('explorer')} onNavigate={setView} />}
        {view === 'about' && <About />}
      </main>
    </div>
  );
}

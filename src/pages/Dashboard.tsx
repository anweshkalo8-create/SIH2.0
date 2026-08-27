import { Waves, Layers, Ship, ArrowRight, FlaskConical, Building2, Tag, LifeBuoy } from 'lucide-react';
import { PROJECT, CAPABILITIES, type ViewId } from '@/data/appContent';

interface DashboardProps {
  onLaunch: () => void;
  onNavigate: (view: ViewId) => void;
}

const META = [
  { icon: Building2, label: 'Organization', value: PROJECT.organization },
  { icon: FlaskConical, label: 'Department', value: PROJECT.department },
  { icon: Tag, label: 'Category', value: PROJECT.category },
  { icon: LifeBuoy, label: 'Theme', value: PROJECT.theme },
];

export function Dashboard({ onLaunch, onNavigate }: DashboardProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-cyan-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Prototype / Demonstration Dataset
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{PROJECT.title}</h1>
          <p className="mt-1 text-lg text-cyan-200/80">{PROJECT.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300/90">{PROJECT.description}</p>

          <button
            onClick={onLaunch}
            className="group mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-400/30"
          >
            <Waves size={18} />
            Launch 3D Explorer
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {META.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-cyan-300/70">
                  <Icon size={14} />
                  {m.label}
                </div>
                <div className="text-sm font-medium text-slate-100">{m.value}</div>
              </div>
            );
          })}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Platform Capabilities</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CAPABILITIES.map((cap) => {
              const Icon = cap.icon;
              return (
                <button
                  key={cap.title}
                  onClick={() => onNavigate('explorer')}
                  className="group flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition-colors hover:border-cyan-500/40 hover:bg-slate-900/70"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{cap.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-slate-400">{cap.description}</div>
                  </div>
                  <ArrowRight size={16} className="ml-auto self-center text-slate-600 transition-colors group-hover:text-cyan-300" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-8 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
          <Layers size={16} className="text-cyan-300/70" />
          <span>
            Built with React, Three.js / React Three Fiber, Drei, Recharts and Tailwind CSS. The data layer is modular and
            ready for future integration with a FastAPI + xarray backend serving INCOIS NetCDF datasets.
          </span>
        </section>
      </div>
    </div>
  );
}

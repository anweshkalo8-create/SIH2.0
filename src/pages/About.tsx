import { Building2, FlaskConical, Tag, LifeBuoy, AlertTriangle, Lightbulb, Cpu, Server } from 'lucide-react';
import { PROJECT } from '@/data/appContent';

const META = [
  { icon: Building2, label: 'Organization', value: PROJECT.organization },
  { icon: FlaskConical, label: 'Department', value: PROJECT.department },
  { icon: Tag, label: 'Category', value: PROJECT.category },
  { icon: LifeBuoy, label: 'Theme', value: PROJECT.theme },
];

const SECTIONS = [
  {
    icon: AlertTriangle,
    title: 'Problem',
    body: 'Ocean model outputs and in-situ observations are typically scattered across disparate formats (NetCDF, ASCII, GRIB) and require specialized desktop tools. This makes it difficult for oceanographers, forecasters and disaster-management personnel to jointly explore model fields and observations in a single interactive environment.',
  },
  {
    icon: Lightbulb,
    title: 'Proposed Solution',
    body: 'A browser-based 3D platform that visualizes numerical ocean model fields (temperature, salinity, currents, chlorophyll) alongside in-situ observations from Argo floats and underwater gliders. Users can rotate, zoom and slice the ocean in 3D, compare model vs observation profiles, and inspect current patterns relevant to marine emergencies.',
  },
  {
    icon: Cpu,
    title: 'Key Capabilities',
    body: 'Interactive 3D ocean rendering with depth and time controls; clickable Argo and glider markers with vertical profiles; model–observation comparison with RMSE and mean error; current vector visualization with adjustable density; a dedicated disaster-management mode for search-and-rescue drift context.',
  },
  {
    icon: Server,
    title: 'Future Integration',
    body: 'The mock data service is intentionally shaped to mirror a future FastAPI + xarray backend. The React layer calls async service functions that can be replaced with REST calls to FastAPI, which reads NetCDF / ASCII files from INCOIS datasets — no UI changes required.',
  },
];

export function About() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">About OceanVerse</h1>
          <p className="mt-2 text-sm text-slate-400">
            Web-Based Interactive 3D Ocean Data Visualization Platform
          </p>
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

        <div className="space-y-4">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <Icon size={16} />
                  {s.title}
                </div>
                <p className="text-sm leading-relaxed text-slate-300/90">{s.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200/80">
          This prototype uses synthetic demonstration data generated at runtime. It is not connected to live INCOIS
          datasets and must not be used for operational forecasting or real disaster response.
        </div>
      </div>
    </div>
  );
}

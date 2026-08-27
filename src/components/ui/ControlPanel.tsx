import {
  Waves,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Layers,
  Wind,
  Compass,
  Sliders,
} from 'lucide-react';
import type { OceanVariable, OverlaysState } from '@/types/ocean';

interface ControlPanelProps {
  variable: OceanVariable;
  onVariableChange: (v: OceanVariable) => void;
  depth: number;
  onDepthChange: (d: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  timeIndex: number;
  onTimeChange: (i: number) => void;
  overlays: OverlaysState;
  onToggleOverlay: (key: keyof OverlaysState) => void;
  depthRange: number;
  onDepthRangeChange: (r: number) => void;
}

const VARIABLES: { id: OceanVariable; label: string }[] = [
  { id: 'temperature', label: 'Sea Surface Temperature' },
  { id: 'salinity', label: 'Salinity (SSS)' },
  { id: 'current', label: 'Current Velocity' },
  { id: 'chlorophyll', label: 'Chlorophyll-a' },
];

const DEPTH_LEVELS = [
  { value: 0, label: 'Surface' },
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1000m' },
  { value: 2000, label: '2000m' },
  { value: 5000, label: '5000m (Abyssal)' },
];

export function ControlPanel({
  variable,
  onVariableChange,
  depth,
  onDepthChange,
  playing,
  onTogglePlay,
  timeIndex,
  onTimeChange,
  overlays,
  onToggleOverlay,
  depthRange,
  onDepthRangeChange,
}: ControlPanelProps) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/90 p-4 text-slate-100 backdrop-blur overflow-y-auto select-none">
      
      {/* 1. Header: Ocean Model Visualization */}
      <div className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-400/30">
          <Waves size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white leading-tight">
            OceanVerse<br />Visualization
          </h2>
        </div>
      </div>

      {/* Controls Title */}
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Sliders size={13} className="text-cyan-400" />
        Controls
      </div>

      {/* 2. Variable Selector */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Variable</label>
        <select
          value={variable}
          onChange={(e) => onVariableChange(e.target.value as OceanVariable)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white shadow-inner focus:border-cyan-400 focus:outline-none"
        >
          {VARIABLES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Depth Level Dropdown */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">Depth Level</label>
        <select
          value={depth}
          onChange={(e) => onDepthChange(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white shadow-inner focus:border-cyan-400 focus:outline-none"
        >
          {DEPTH_LEVELS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Animation Player */}
      <div className="mb-5 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <label className="mb-2 block text-xs font-medium text-slate-300">Animation</label>
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition-colors hover:bg-cyan-400"
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <button
            onClick={() => onTimeChange((timeIndex - 1 + 5) % 5)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Step Back"
          >
            <SkipBack size={12} />
          </button>
          <input
            type="range"
            min={0}
            max={4}
            value={timeIndex}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <button
            onClick={() => onTimeChange((timeIndex + 1) % 5)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Step Forward"
          >
            <SkipForward size={12} />
          </button>
        </div>
      </div>

      {/* 5. Overlays Checkboxes */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-slate-300">Overlays</label>
        <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs">
          <label className="flex cursor-pointer items-center gap-2.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={overlays.currents}
              onChange={() => onToggleOverlay('currents')}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 accent-cyan-500 focus:ring-0"
            />
            <span>Currents</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={overlays.windVectors}
              onChange={() => onToggleOverlay('windVectors')}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 accent-cyan-500 focus:ring-0"
            />
            <span>Wind Vectors</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={overlays.contours}
              onChange={() => onToggleOverlay('contours')}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 accent-cyan-500 focus:ring-0"
            />
            <span>Contours</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={overlays.bathymetry}
              onChange={() => onToggleOverlay('bathymetry')}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 accent-cyan-500 focus:ring-0"
            />
            <span>Bathymetry</span>
          </label>
        </div>
      </div>

      {/* 6. Color Scale (°C) Bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
          <span>Variable Scale (°C)</span>
        </div>
        <div
          className="h-3.5 w-full rounded shadow-inner"
          style={{
            background: 'linear-gradient(to right, #00008b, #0000ff, #00ffff, #00ff00, #ffff00, #ff7f00, #ff0000, #8b0000)',
          }}
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-400 font-mono">
          <span>10</span>
          <span>20</span>
          <span>30</span>
        </div>
      </div>

      {/* Bathymetry Depth Scale (when Bathymetry overlay is ON) */}
      {overlays.bathymetry && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-2.5 backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-cyan-300">
            <span>Bathymetric Depth</span>
            <span className="text-[9px] font-mono text-cyan-400">GEBCO</span>
          </div>
          <div
            className="h-3 w-full rounded shadow-inner"
            style={{
              background: 'linear-gradient(to right, #5eead4 0%, #06b6d4 15%, #2563eb 40%, #1e3a8a 70%, #0a1931 88%, #2e1065 100%)',
            }}
          />
          <div className="mt-1 flex justify-between text-[9px] text-slate-400 font-mono">
            <span>0m (Shelf)</span>
            <span>-2500m</span>
            <span>-6500m</span>
          </div>
        </div>
      )}

      {/* 7. Depth Range Slider (0 to 5500 m) */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
          <span>Depth Range (m)</span>
          <span className="font-mono text-cyan-300">{depthRange} m</span>
        </div>
        <input
          type="range"
          min={500}
          max={5500}
          step={500}
          value={depthRange}
          onChange={(e) => onDepthRangeChange(Number(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0</span>
          <span>5500</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-3 text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/80">
        <span className="text-slate-400 font-medium">INCOIS ROMS High-Res</span> · 1/12° Grid
      </div>
    </aside>
  );
}

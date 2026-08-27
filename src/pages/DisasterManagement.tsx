import { useEffect, useMemo, useState } from 'react';
import {
  Ship,
  LifeBuoy,
  AlertTriangle,
  Wind,
  MapPin,
  Gauge,
  Navigation,
  Compass,
  Radio,
  Play,
  Pause,
  Layers,
  Search,
} from 'lucide-react';
import { OceanScene } from '@/components/scene/OceanScene';
import {
  getFieldSlice,
  getCurrents,
  getObservations,
  REGIONS,
  type GridSlice,
} from '@/services/mockOceanService';
import { VARIABLE_CONFIG, TIME_STEPS } from '@/utils/oceanConfig';
import type {
  ColorPaletteId,
  CurrentVector,
  Observation,
  OceanVariable,
  RegionId,
  OverlaysState,
} from '@/types/ocean';

const MAX_DEPTH = 5500;

interface DistressIncident {
  id: string;
  name: string;
  type: string;
  region: RegionId;
  lat: number;
  lon: number;
  time: string;
  reportedWind: string;
}

const SAMPLE_INCIDENTS: DistressIncident[] = [
  {
    id: 'SAR-2025-01',
    name: 'FV Sagar Kanya (Fishing Vessel)',
    type: 'Engine Failure / Drifting Vessel',
    region: 'arabian-sea',
    lat: 18.5,
    lon: 68.2,
    time: '21 May 2025, 08:30 UTC',
    reportedWind: '18 kts SW',
  },
  {
    id: 'SAR-2025-02',
    name: 'MV Ocean Trader (Cargo)',
    type: 'Man Overboard / Life Raft',
    region: 'bay-of-bengal',
    lat: 15.8,
    lon: 86.4,
    time: '21 May 2025, 06:15 UTC',
    reportedWind: '12 kts NE',
  },
  {
    id: 'SAR-2025-03',
    name: 'Research Buoy MoES-04',
    type: 'Mooring Breakage / Adrift',
    region: 'indian-ocean',
    lat: -2.5,
    lon: 74.0,
    time: '20 May 2025, 22:00 UTC',
    reportedWind: '15 kts SE',
  },
];

export function DisasterManagement() {
  const [selectedIncident, setSelectedIncident] = useState<DistressIncident>(SAMPLE_INCIDENTS[0]);
  const [variable, setVariable] = useState<OceanVariable>('current');
  const [depth, setDepth] = useState(0);
  const [driftHours, setDriftHours] = useState(12);
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [overlays, setOverlays] = useState<OverlaysState>({
    currents: true,
    windVectors: true,
    contours: true,
    bathymetry: true,
  });

  const [slice, setSlice] = useState<GridSlice | null>(null);
  const [currents, setCurrents] = useState<CurrentVector[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  const region = REGIONS[selectedIncident.region];

  // Fetch field slice for selected variable
  useEffect(() => {
    let cancelled = false;
    const sliceVar = variable === 'current' ? 'temperature' : variable;
    getFieldSlice(sliceVar, depth, timeIndex).then((s) => {
      if (!cancelled) setSlice(s);
    });
    return () => {
      cancelled = true;
    };
  }, [variable, depth, timeIndex]);

  // Fetch current vectors
  useEffect(() => {
    let cancelled = false;
    getCurrents(depth, timeIndex, 'high').then((c) => {
      if (!cancelled) setCurrents(c);
    });
    return () => {
      cancelled = true;
    };
  }, [depth, timeIndex]);

  // Fetch observation markers + inject the distress incident beacon
  useEffect(() => {
    let cancelled = false;
    getObservations(timeIndex).then((obsList) => {
      if (cancelled) return;
      // Add Mayday incident as a highlighted observation pin
      const incidentPin: Observation = {
        id: selectedIncident.name,
        type: 'glider',
        latitude: selectedIncident.lat,
        longitude: selectedIncident.lon,
        timestamp: selectedIncident.time,
        depth: 0,
        temperature: 28.5,
        salinity: 35.0,
        chlorophyll: 0.5,
        maxDepth: 100,
      };
      setObservations([incidentPin, ...obsList]);
    });
    return () => {
      cancelled = true;
    };
  }, [timeIndex, selectedIncident]);

  // Animation timeline
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTimeIndex((i) => (i + 1) % 5), 1400);
    return () => clearInterval(id);
  }, [playing]);

  // Filter vectors by the active incident region
  const regionCurrents = useMemo(() => {
    return currents.filter(
      (c) =>
        c.latitude >= region.bounds.latMin - 2 &&
        c.latitude <= region.bounds.latMax + 2 &&
        c.longitude >= region.bounds.lonMin - 2 &&
        c.longitude <= region.bounds.lonMax + 2
    );
  }, [currents, region]);

  // Calculate local surface drift stats near the incident
  const driftStats = useMemo(() => {
    if (regionCurrents.length === 0) {
      return { speed: 0.65, dir: 45, maxSpeed: 1.2, driftDistKm: 28, searchAreaKm2: 120 };
    }
    const speeds = regionCurrents.map((c) => Math.hypot(c.u, c.v));
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const u = regionCurrents.reduce((s, c) => s + c.u, 0) / regionCurrents.length;
    const v = regionCurrents.reduce((s, c) => s + c.v, 0) / regionCurrents.length;
    const headingDeg = (Math.atan2(u, v) * 180) / Math.PI;
    const normHeading = (headingDeg + 360) % 360;

    // Estimated drift distance (speed in m/s * hours * 3600 / 1000 = km)
    const driftKm = (avgSpeed * driftHours * 3600) / 1000;
    const searchRadiusKm = Math.max(5, driftKm * 0.35);
    const searchArea = Math.PI * searchRadiusKm * searchRadiusKm;

    return {
      speed: avgSpeed,
      dir: normHeading,
      maxSpeed: Math.max(...speeds),
      driftDistKm: driftKm,
      searchAreaKm2: searchArea,
    };
  }, [regionCurrents, driftHours]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 text-slate-100">
      
      {/* 1. Left SAR Controls Panel */}
      <aside className="w-80 shrink-0 border-r border-slate-800/80 bg-slate-900/90 p-4 backdrop-blur overflow-y-auto space-y-4 select-none">
        
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
            <Radio size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              Marine Disaster & SAR
            </h2>
            <div className="text-[10px] text-rose-400 font-medium">Search &amp; Rescue Drift Analysis</div>
          </div>
        </div>

        {/* Active Incident Selector */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Distress Incident
          </label>
          <div className="space-y-1.5">
            {SAMPLE_INCIDENTS.map((inc) => {
              const active = inc.id === selectedIncident.id;
              return (
                <button
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    active
                      ? 'border-rose-500/50 bg-rose-500/10 text-white ring-1 ring-rose-500/30'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="truncate">{inc.name}</span>
                    <span className="text-[10px] text-rose-400 font-mono">{inc.id}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400 truncate">{inc.type}</div>
                  <div className="mt-0.5 text-[9px] text-slate-500 flex items-center justify-between">
                    <span>{REGIONS[inc.region].label}</span>
                    <span>{inc.lat.toFixed(1)}°N, {inc.lon.toFixed(1)}°E</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drift Simulation Parameters */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
            <Compass size={13} />
            Drift Forecast Horizon
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Forecast Time</span>
              <span className="font-bold text-cyan-300">+{driftHours} Hours</span>
            </div>
            <input
              type="range"
              min={3}
              max={48}
              step={3}
              value={driftHours}
              onChange={(e) => setDriftHours(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
              <span>+3h</span>
              <span>+24h</span>
              <span>+48h</span>
            </div>
          </div>

          {/* Current Depth */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Layer Depth</span>
              <span className="font-bold text-cyan-300">{depth}m ({depth === 0 ? 'Surface' : 'Subsurface'})</span>
            </div>
            <input
              type="range"
              min={0}
              max={200}
              step={50}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Real-time Computed Drift Analysis */}
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-2 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
            <Navigation size={13} />
            Computed SAR Drift Metrics
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Mean Drift Speed:</span>
              <span className="font-bold text-white">{driftStats.speed.toFixed(2)} m/s ({(driftStats.speed * 1.944).toFixed(1)} kts)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Drift Trajectory:</span>
              <span className="font-bold text-cyan-300">{driftStats.dir.toFixed(0)}° (Heading)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Travel:</span>
              <span className="font-bold text-amber-300">~{driftStats.driftDistKm.toFixed(1)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Search Radius Area:</span>
              <span className="font-bold text-emerald-300">{driftStats.searchAreaKm2.toFixed(0)} km²</span>
            </div>
          </div>
        </div>

        {/* Recommended SAR Search Pattern */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px]">
            <Search size={13} className="text-cyan-400" />
            Recommended Search Pattern
          </div>
          <div className="text-[11px] text-slate-400">
            {driftStats.searchAreaKm2 > 300
              ? '▶ Parallel Track Search (PS) via Coast Guard Aircraft'
              : '▶ Expanding Square Search (SS) via Marine Rescue Vessel'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Datum Marker: <strong className="text-slate-300">{selectedIncident.lat}°N, {selectedIncident.lon}°E</strong>
          </div>
        </div>

      </aside>

      {/* 2. Main 3D Viewport and Overlay Panels */}
      <main className="relative flex-1 h-full overflow-hidden">
        
        {/* 3D Ocean Scene */}
        <div className="absolute inset-0">
          <OceanScene
            slice={slice}
            currents={regionCurrents.length > 0 ? regionCurrents : currents}
            observations={observations}
            variable={variable}
            palette="velocity"
            depth={depth}
            opacity={0.85}
            exaggeration={1.0}
            maxDepth={MAX_DEPTH}
            overlays={overlays}
            selectedId={selectedIncident.name}
            onSelect={() => {}}
            onReset={() => {}}
            resetSignal={0}
            timePhase={timeIndex * 0.5}
          />
        </div>

        {/* Top Header Badge */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/85 px-4 py-2.5 backdrop-blur shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Ship size={15} className="text-rose-400" />
              Incident Target: {selectedIncident.name}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {region.label} · {selectedIncident.time} · Winds: {selectedIncident.reportedWind}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Live INCOIS Current Drift Model Context
            </div>
          </div>
        </div>

        {/* Floating Drift Compass Summary (Top Right) */}
        <div className="absolute right-4 top-4 z-10 w-64 rounded-xl border border-slate-800 bg-slate-900/85 p-3 backdrop-blur shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            <span>Vector Drift Summary</span>
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-md bg-slate-950/60 p-2 border border-slate-800">
              <div className="text-slate-500">Drift Vector</div>
              <div className="text-sm font-bold text-rose-400">{driftStats.dir.toFixed(0)}°</div>
            </div>
            <div className="rounded-md bg-slate-950/60 p-2 border border-slate-800">
              <div className="text-slate-500">Max Current</div>
              <div className="text-sm font-bold text-cyan-400">{driftStats.maxSpeed.toFixed(2)} m/s</div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed">
            Direction indicates calculated surface particle trajectory based on real-time Eulerian current velocity fields.
          </div>
        </div>

        {/* Bottom Time Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 backdrop-blur shadow-lg">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-slate-950 hover:bg-rose-400 transition-colors"
          >
            {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Time Step:</span>
            <span className="font-bold text-cyan-300 font-mono">{TIME_STEPS[timeIndex].label}</span>
          </div>
        </div>

      </main>
    </div>
  );
}

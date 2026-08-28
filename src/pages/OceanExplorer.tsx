import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { Globe, Clock, Waves } from 'lucide-react';
import { OceanScene } from '@/components/scene/OceanScene';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { ProfilePanel } from '@/components/ui/ProfilePanel';
import {
  getFieldSlice,
  getCurrents,
  getObservations,
  type GridSlice,
} from '@/services/mockOceanService';
import type {
  CurrentVector,
  Observation,
  OceanVariable,
  OverlaysState,
} from '@/types/ocean';

// Sample 10-day time series data matching the Phoenix UI screenshot
const TIME_SERIES_DATA = [
  { date: '12 May', sst: 28.2, sss: 34.8, ssh: 0.38 },
  { date: '13 May', sst: 28.5, sss: 34.9, ssh: 0.41 },
  { date: '14 May', sst: 28.9, sss: 35.1, ssh: 0.44 },
  { date: '15 May', sst: 28.6, sss: 35.0, ssh: 0.42 },
  { date: '16 May', sst: 28.8, sss: 35.2, ssh: 0.45 },
  { date: '17 May', sst: 28.4, sss: 34.9, ssh: 0.39 },
  { date: '18 May', sst: 28.7, sss: 35.1, ssh: 0.43 },
  { date: '19 May', sst: 28.5, sss: 35.0, ssh: 0.40 },
  { date: '20 May', sst: 28.8, sss: 35.3, ssh: 0.46 },
  { date: '21 May', sst: 28.6, sss: 35.1, ssh: 0.42 },
];

// Validation scatter data: Observed vs Model SST
const VALIDATION_DATA = [
  { observed: 20.2, model: 20.5 },
  { observed: 21.0, model: 20.8 },
  { observed: 21.8, model: 22.1 },
  { observed: 22.4, model: 22.3 },
  { observed: 23.1, model: 23.5 },
  { observed: 23.9, model: 23.7 },
  { observed: 24.5, model: 24.8 },
  { observed: 25.2, model: 25.0 },
  { observed: 25.8, model: 26.1 },
  { observed: 26.4, model: 26.2 },
  { observed: 27.1, model: 27.4 },
  { observed: 27.8, model: 27.6 },
  { observed: 28.3, model: 28.5 },
  { observed: 28.9, model: 28.7 },
  { observed: 29.5, model: 29.8 },
  { observed: 30.1, model: 30.0 },
];

export function OceanExplorer() {
  const [variable, setVariable] = useState<OceanVariable>('temperature');
  const [depth, setDepth] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timeIndex, setTimeIndex] = useState(0);
  const [depthRange, setDepthRange] = useState(5500);
  const [overlays, setOverlays] = useState<OverlaysState>({
    currents: true,
    windVectors: true,
    contours: true,
    bathymetry: true,
  });

  const [slice, setSlice] = useState<GridSlice | null>(null);
  const [currents, setCurrents] = useState<CurrentVector[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch field slice & currents
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

  useEffect(() => {
    let cancelled = false;

    getCurrents(depth, timeIndex, 'medium').then((c) => {
      if (!cancelled) setCurrents(c);
    });

    return () => {
      cancelled = true;
    };
  }, [depth, timeIndex]);

  useEffect(() => {
    let cancelled = false;

    getObservations(timeIndex).then((o) => {
      if (!cancelled) setObservations(o);
    });

    return () => {
      cancelled = true;
    };
  }, [timeIndex]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setTimeIndex((i) => (i + 1) % 5);
    }, 1500);

    return () => clearInterval(interval);
  }, [playing]);

  const toggleOverlay = (key: keyof OverlaysState) => {
    setOverlays((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedObs = useMemo(
    () => observations.find((o) => o.id === selectedId) ?? null,
    [observations, selectedId]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* 1. Left Controls Sidebar */}
      <ControlPanel
        variable={variable}
        onVariableChange={setVariable}
        depth={depth}
        onDepthChange={setDepth}
        playing={playing}
        onTogglePlay={() => setPlaying(!playing)}
        timeIndex={timeIndex}
        onTimeChange={setTimeIndex}
        overlays={overlays}
        onToggleOverlay={toggleOverlay}
        depthRange={depthRange}
        onDepthRangeChange={setDepthRange}
      />

      {/* 2. Main Dashboard Viewport */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* TOP ROW: 3D Ocean Model View (Left) & Global Map + KPI Stats (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* 3D Ocean Model View Block */}
          <div className="lg:col-span-7 relative rounded-xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur min-h-[400px] flex flex-col">

            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">

              <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                <Waves size={14} className="text-cyan-400" />
                3D Ocean Model View
              </span>

              <div className="flex items-center gap-2">

                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  Click any ball to inspect CTD Profile
                </span>

                <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                  21 May 2025, 10:00 UTC
                </span>

              </div>
            </div>

            {/* 3D Canvas + Vertical Color Scale */}
            <div className="relative flex-1 rounded-lg overflow-hidden flex">

              <div className="flex-1 h-full min-h-[320px]">

                <OceanScene
                  slice={slice}
                  currents={currents}
                  observations={observations}
                  variable={variable}
                  palette="thermal"
                  depth={depth}
                  opacity={0.85}
                  exaggeration={1.0}
                  maxDepth={depthRange}
                  overlays={overlays}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onReset={() => {}}
                  resetSignal={0}
                  timePhase={timeIndex * 0.5}
                />

              </div>

              {/* Vertical Color Scale Legend on Right */}
              <div className="w-10 flex flex-col items-center justify-center pl-2 text-[10px] text-slate-400 font-mono select-none">

                <span className="text-[9px] text-slate-300 font-semibold mb-1">
                  °C
                </span>

                <span>30</span>

                <div
                  className="w-3 my-1 rounded-sm flex-1 shadow-inner"
                  style={{
                    background:
                      'linear-gradient(to bottom, #8b0000, #ff0000, #ff7f00, #ffff00, #00ff00, #00ffff, #0000ff, #00008b)',
                  }}
                />

                <span>0</span>

              </div>

              {/* 3. Slide-Out Profile Panel when a Ball is clicked */}
              {selectedObs && (
                <div className="absolute right-12 top-2 z-30 shadow-2xl">

                  <ProfilePanel
                    observation={selectedObs}
                    variable={
                      variable === 'current'
                        ? 'temperature'
                        : variable
                    }
                    onClose={() => setSelectedId(null)}
                    onVariableChange={setVariable}
                  />

                </div>
              )}

            </div>
          </div>

          {/* Global Map & KPI Stats */}
          <div className="lg:col-span-5 flex flex-col gap-3">

            {/* Global Map (Sea Surface Temperature) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur">

              <div className="flex items-center justify-between mb-2">

                <span className="text-xs font-semibold text-white">
                  Global Map (Sea Surface Temperature)
                </span>

                <span className="text-[9px] text-slate-400">
                  °C
                </span>

              </div>

              <div className="relative h-32 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">

                {/* Stylized Global Heatmap SVG */}
                <svg viewBox="0 0 360 160" className="w-full h-full">

                  <defs>

                    <linearGradient
                      id="globalMapGrad"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >

                      <stop
                        offset="0%"
                        stopColor="#0284c7"
                      />

                      <stop
                        offset="35%"
                        stopColor="#eab308"
                      />

                      <stop
                        offset="50%"
                        stopColor="#ef4444"
                      />

                      <stop
                        offset="65%"
                        stopColor="#eab308"
                      />

                      <stop
                        offset="100%"
                        stopColor="#0369a1"
                      />

                    </linearGradient>

                  </defs>

                  <rect
                    width="360"
                    height="160"
                    fill="url(#globalMapGrad)"
                  />

                  {/* Continents outline path */}
                  <path
                    d="M 50,40 Q 70,30 90,50 Q 80,70 60,90 Q 40,80 50,40 Z M 160,30 Q 180,25 210,40 Q 200,60 180,65 Q 150,55 160,30 Z M 190,70 Q 200,85 195,110 Q 185,115 180,95 Q 185,75 190,70 Z M 270,90 Q 300,85 310,110 Q 290,125 270,110 Z"
                    fill="#1e293b"
                    opacity="0.85"
                  />

                  {/* Selection indicator over Indian Ocean */}
                  <rect
                    x="175"
                    y="60"
                    width="45"
                    height="35"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />

                </svg>

              </div>
            </div>

            {/* 3 KPI Metric Cards */}
            <div className="grid grid-cols-3 gap-2">

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 backdrop-blur">

                <div className="text-[10px] text-slate-400 leading-tight">
                  Sea Surface Temp (°C)
                </div>

                <div className="text-base font-bold text-cyan-400 mt-1">
                  28.6 °C
                </div>

                <div className="text-[9px] text-slate-500 mt-0.5">
                  Min: 18.2 · Max: 30.4
                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 backdrop-blur">

                <div className="text-[10px] text-slate-400 leading-tight">
                  Surface Current Speed
                </div>

                <div className="text-base font-bold text-purple-400 mt-1">
                  0.75 m/s
                </div>

                <div className="text-[9px] text-slate-500 mt-0.5">
                  Min: 0.01 · Max: 1.68
                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 backdrop-blur">

                <div className="text-[10px] text-slate-400 leading-tight">
                  Sea Surface Height
                </div>

                <div className="text-base font-bold text-emerald-400 mt-1">
                  0.42 m
                </div>

                <div className="text-[9px] text-slate-500 mt-0.5">
                  Min: -0.63 · Max: 0.92
                </div>

              </div>

            </div>

            {/* Model Run Time Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 flex items-center justify-between text-xs backdrop-blur">

              <div className="flex items-center gap-2">

                <Clock
                  size={14}
                  className="text-cyan-400"
                />

                <span className="text-slate-400">
                  Model Run Time:
                </span>

                <span className="font-semibold text-white">
                  2h 15m
                </span>

              </div>

              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">

                Next Output:{' '}

                <strong className="text-cyan-300">
                  1h
                </strong>

              </span>

            </div>

          </div>
        </div>

        {/* MIDDLE ROW: Vertical Section (Along 10°N) & Time Series (Past 10 Days) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Vertical Section Along 10°N Depth Profile */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur flex flex-col">

            <div className="flex items-center justify-between mb-2">

              <span className="text-xs font-semibold text-white">
                Vertical Section (Along 10°N)
              </span>

              <span className="text-[9px] text-slate-400 font-mono">
                °C
              </span>

            </div>

            <div className="relative h-44 w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center">

              <svg
                viewBox="0 0 380 160"
                className="w-full h-full"
              >

                <defs>

                  <linearGradient
                    id="vertSectionGrad"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >

                    <stop
                      offset="0%"
                      stopColor="#ef4444"
                    />

                    <stop
                      offset="20%"
                      stopColor="#eab308"
                    />

                    <stop
                      offset="40%"
                      stopColor="#06b6d4"
                    />

                    <stop
                      offset="65%"
                      stopColor="#0284c7"
                    />

                    <stop
                      offset="100%"
                      stopColor="#0f172a"
                    />

                  </linearGradient>

                </defs>

                {/* Thermocline Cross section fill */}
                <rect
                  x="45"
                  y="10"
                  width="310"
                  height="130"
                  fill="url(#vertSectionGrad)"
                />

                {/* Internal Isotherms */}
                <path
                  d="M 45,35 Q 180,45 355,30"
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                />

                <path
                  d="M 45,65 Q 200,80 355,60"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />

                <path
                  d="M 45,95 Q 190,105 355,90"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                />

                {/* Y-Axis Depth Labels */}
                <text
                  x="5"
                  y="20"
                  fill="#64748b"
                  fontSize="8"
                >
                  -1000
                </text>

                <text
                  x="5"
                  y="55"
                  fill="#64748b"
                  fontSize="8"
                >
                  -2000
                </text>

                <text
                  x="5"
                  y="90"
                  fill="#64748b"
                  fontSize="8"
                >
                  -3000
                </text>

                <text
                  x="5"
                  y="125"
                  fill="#64748b"
                  fontSize="8"
                >
                  -4000
                </text>

                <text
                  x="5"
                  y="145"
                  fill="#64748b"
                  fontSize="8"
                >
                  -5000
                </text>

                {/* X-Axis Longitude Labels */}
                <text
                  x="55"
                  y="152"
                  fill="#64748b"
                  fontSize="8"
                >
                  60°E
                </text>

                <text
                  x="130"
                  y="152"
                  fill="#64748b"
                  fontSize="8"
                >
                  80°E
                </text>

                <text
                  x="210"
                  y="152"
                  fill="#64748b"
                  fontSize="8"
                >
                  100°E
                </text>

                <text
                  x="290"
                  y="152"
                  fill="#64748b"
                  fontSize="8"
                >
                  120°E
                </text>

                <text
                  x="175"
                  y="158"
                  fill="#94a3b8"
                  fontSize="8"
                >
                  Longitude
                </text>

              </svg>

            </div>
          </div>

          {/* Time Series (Past 10 Days) */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur flex flex-col">

            <div className="flex items-center justify-between mb-2">

              <span className="text-xs font-semibold text-white">
                Time Series (Past 10 Days)
              </span>

              <div className="flex items-center gap-3 text-[10px]">

                <span className="text-cyan-400 font-medium">
                  ● SST (°C)
                </span>

                <span className="text-emerald-400 font-medium">
                  ● SSS (psu)
                </span>

                <span className="text-purple-400 font-medium">
                  ● SSH (m)
                </span>

              </div>

            </div>

            <div className="h-44 w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={TIME_SERIES_DATA}
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    fontSize={9}
                    domain={[25, 36]}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    fontSize={9}
                    domain={[-1, 1]}
                  />

                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sst"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sss"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    dot={{ r: 2 }}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ssh"
                    stroke="#a855f7"
                    strokeWidth={1.5}
                    dot={{ r: 2 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Model Information (Left) & In-situ vs Model Validation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Model Information Card with 3D Globe */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur flex items-center justify-between">

            <div className="space-y-1.5 text-xs">

              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Model Information
              </h3>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Model Name
                </span>

                <span className="font-medium text-white">
                  : OceanVerse (INCOIS ROMS)
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Model Type
                </span>

                <span className="font-medium text-cyan-300">
                  : ROMS
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Resolution
                </span>

                <span className="font-medium text-white">
                  : 1/12° (~9 km)
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Layers
                </span>

                <span className="font-medium text-white">
                  : 50
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Assimilation
                </span>

                <span className="font-medium text-white">
                  : Hybrid
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-slate-400 w-28">
                  Next Run
                </span>

                <span className="font-medium text-amber-300">
                  : 21 May 2025, 16:00 UTC
                </span>
              </div>

            </div>

            {/* Rotating 3D Mini Globe */}
            <div className="pr-4 flex flex-col items-center">

              <div className="grid h-24 w-24 place-items-center rounded-full bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20">

                <Globe
                  size={56}
                  className="animate-spin"
                  style={{
                    animationDuration: '25s',
                  }}
                />

              </div>

              <span className="mt-2 text-[10px] text-cyan-300/80 font-mono">
                Global Coverage
              </span>

            </div>
          </div>

          {/* In-situ Observations vs Model (SST) Scatter / Regression Plot */}
          <div className="lg:col-span-6 rounded-xl border border-slate-800 bg-slate-900/80 p-3 backdrop-blur flex flex-col">

            <div className="flex items-center justify-between mb-2">

              <span className="text-xs font-semibold text-white">
                In-situ Observations vs Model (SST)
              </span>

              <div className="flex items-center gap-3 text-[10px]">

                <span className="text-cyan-400">
                  ● Observations
                </span>

                <span className="text-emerald-400">
                  — 1:1 Fit Line (R² = 0.94)
                </span>

              </div>
            </div>

            <div className="h-44 w-full">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <ScatterChart
                  margin={{
                    top: 5,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    type="number"
                    dataKey="observed"
                    name="Observed"
                    domain={[18, 32]}
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <YAxis
                    type="number"
                    dataKey="model"
                    name="Model"
                    domain={[18, 32]}
                    stroke="#64748b"
                    fontSize={9}
                  />

                  <Tooltip
                    cursor={{
                      strokeDasharray: '3 3',
                    }}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />

                  <Scatter
                    name="Observations"
                    data={VALIDATION_DATA}
                    fill="#22d3ee"
                  />

                  <Line
                    type="linear"
                    dataKey="model"
                    stroke="#34d399"
                    strokeWidth={1.5}
                    dot={false}
                  />

                </ScatterChart>

              </ResponsiveContainer>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

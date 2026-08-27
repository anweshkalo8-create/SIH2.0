// Mock ocean data service.
// -----------------------------------------------------------------------------
// All synthetic demonstration data for the OceanVision 3D prototype flows
// through this module. Nothing here is real INCOIS data — it is deterministic,
// scientifically-plausible placeholder data generated at runtime.
//
// FUTURE BACKEND: every function below has a matching REST endpoint shape that
// a FastAPI + xarray backend can serve. The signatures are intentionally async
// so the React layer does not change when this module is replaced by a real
// `apiOceanService` that calls FastAPI (which in turn reads NetCDF / ASCII
// files from INCOIS datasets). Only the bodies need to be swapped.
// -----------------------------------------------------------------------------

import type {
  CurrentVector,
  OceanGrid,
  Observation,
  ProfilePoint,
  Region,
  RegionId,
} from '@/types/ocean';
import { DEPTH_LEVELS, TIME_STEPS, VARIABLE_CONFIG } from '@/utils/oceanConfig';

export const OCEAN_GRID: OceanGrid = {
  latMin: -20,
  latMax: 30,
  lonMin: 40,
  lonMax: 100,
  nlats: 26,
  nlons: 31,
  depths: DEPTH_LEVELS,
};

export const REGIONS: Record<RegionId, Region> = {
  'arabian-sea': {
    id: 'arabian-sea',
    label: 'Arabian Sea',
    center: [18, 68],
    bounds: { latMin: 8, latMax: 28, lonMin: 58, lonMax: 78 },
  },
  'bay-of-bengal': {
    id: 'bay-of-bengal',
    label: 'Bay of Bengal',
    center: [16, 88],
    bounds: { latMin: 5, latMax: 27, lonMin: 80, lonMax: 95 },
  },
  'indian-ocean': {
    id: 'indian-ocean',
    label: 'Indian Ocean',
    center: [-5, 75],
    bounds: { latMin: -18, latMax: 12, lonMin: 60, lonMax: 92 },
  },
};

// Deterministic pseudo-random generator so the demo data is stable across reloads.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260826);

function hashLatLon(lat: number, lon: number): number {
  const s = Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Smooth spatial field based on a couple of sine waves — gives a plausible
// large-scale structure (warm near the equator, cooler at depth) without any
// real ocean model.
function baseField(
  lat: number,
  lon: number,
  depth: number,
  variable: 'temperature' | 'salinity' | 'chlorophyll',
): number {
  const latNorm = (lat - OCEAN_GRID.latMin) / (OCEAN_GRID.latMax - OCEAN_GRID.latMin);
  const lonNorm = (lon - OCEAN_GRID.lonMin) / (OCEAN_GRID.lonMax - OCEAN_GRID.lonMin);
  const depthFactor = Math.min(1, depth / 2000);

  if (variable === 'temperature') {
    const surface = 12 + 20 * latNorm + 4 * Math.sin(lonNorm * Math.PI * 2);
    return surface - 18 * depthFactor + (hashLatLon(lat, lon) - 0.5) * 1.5;
  }
  if (variable === 'salinity') {
    return 34 + 1.8 * latNorm + 0.8 * Math.sin(lonNorm * Math.PI) + 0.4 * depthFactor;
  }
  // chlorophyll — higher near coasts (edges of domain) and at shallow depths.
  const coast = Math.max(0, 1 - Math.min(latNorm, 1 - latNorm, lonNorm, 1 - lonNorm) * 4);
  return Math.max(0, 0.2 + 1.6 * coast * (1 - depthFactor) + (hashLatLon(lat, lon) - 0.5) * 0.3);
}

export interface GridPoint {
  lat: number;
  lon: number;
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
}

export interface GridSlice {
  nlats: number;
  nlons: number;
  points: GridPoint[];
}

// FUTURE BACKEND: GET /api/field?variable=temperature&depth=200&time=0
export async function getFieldSlice(
  variable: 'temperature' | 'salinity' | 'chlorophyll',
  depth: number,
  timeIndex: number,
): Promise<GridSlice> {
  const { nlats, nlons } = OCEAN_GRID;
  const points: GridPoint[] = [];
  const timePhase = (timeIndex / TIME_STEPS.length) * Math.PI * 2;

  for (let i = 0; i < nlats; i++) {
    for (let j = 0; j < nlons; j++) {
      const lat = OCEAN_GRID.latMin + (i / (nlats - 1)) * (OCEAN_GRID.latMax - OCEAN_GRID.latMin);
      const lon = OCEAN_GRID.lonMin + (j / (nlons - 1)) * (OCEAN_GRID.lonMax - OCEAN_GRID.lonMin);
      const t = baseField(lat, lon, depth, 'temperature') + Math.sin(timePhase + lon * 0.1) * 0.6;
      const s = baseField(lat, lon, depth, 'salinity') + Math.cos(timePhase + lat * 0.1) * 0.15;
      const c = baseField(lat, lon, depth, 'chlorophyll') + Math.sin(timePhase) * 0.1;
      points.push({
        lat,
        lon,
        depth,
        temperature: t,
        salinity: s,
        chlorophyll: Math.max(0, c),
      });
    }
  }
  return { nlats, nlons, points };
}

// FUTURE BACKEND: GET /api/currents?depth=200&time=0&density=medium
export async function getCurrents(
  depth: number,
  timeIndex: number,
  density: 'low' | 'medium' | 'high' = 'medium',
): Promise<CurrentVector[]> {
  const step = density === 'low' ? 5 : density === 'medium' ? 3 : 2;
  const vectors: CurrentVector[] = [];
  const timePhase = (timeIndex / TIME_STEPS.length) * Math.PI * 2;
  const ts = TIME_STEPS[timeIndex].timestamp;

  for (let i = 0; i < OCEAN_GRID.nlats; i += step) {
    for (let j = 0; j < OCEAN_GRID.nlons; j += step) {
      const lat = OCEAN_GRID.latMin + (i / (OCEAN_GRID.nlats - 1)) * (OCEAN_GRID.latMax - OCEAN_GRID.latMin);
      const lon = OCEAN_GRID.lonMin + (j / (OCEAN_GRID.nlons - 1)) * (OCEAN_GRID.lonMax - OCEAN_GRID.lonMin);
      const latNorm = (lat - OCEAN_GRID.latMin) / (OCEAN_GRID.latMax - OCEAN_GRID.latMin);
      const lonNorm = (lon - OCEAN_GRID.lonMin) / (OCEAN_GRID.lonMax - OCEAN_GRID.lonMin);
      const u = 0.4 * Math.sin(lonNorm * Math.PI * 2 + timePhase) * (1 - depth / 3000);
      const v = 0.4 * Math.cos(latNorm * Math.PI * 2 + timePhase) * (1 - depth / 3000);
      vectors.push({ latitude: lat, longitude: lon, depth, u, v, timestamp: ts });
    }
  }
  return vectors;
}

const ARGO_SEEDS: Array<{ id: string; lat: number; lon: number; maxDepth: number }> = [
  { id: 'ARGO-2901', lat: 14.5, lon: 67.0, maxDepth: 2000 },
  { id: 'ARGO-2902', lat: 3.2, lon: 78.5, maxDepth: 1500 },
  { id: 'ARGO-2903', lat: 18.8, lon: 89.2, maxDepth: 2000 },
  { id: 'ARGO-2904', lat: -8.4, lon: 71.0, maxDepth: 1800 },
  { id: 'ARGO-2905', lat: 22.1, lon: 64.5, maxDepth: 1200 },
];

const GLIDER_SEEDS: Array<{ id: string; lat: number; lon: number; maxDepth: number }> = [
  { id: 'GLD-SEA-01', lat: 16.0, lon: 70.0, maxDepth: 1000 },
  { id: 'GLD-BOB-02', lat: 13.5, lon: 84.0, maxDepth: 900 },
  { id: 'GLD-IO-03', lat: -2.0, lon: 76.0, maxDepth: 800 },
];

function buildObservation(
  seed: { id: string; lat: number; lon: number; maxDepth: number },
  type: 'argo' | 'glider',
  timeIndex: number,
): Observation {
  const ts = TIME_STEPS[timeIndex].timestamp;
  const surfaceT = baseField(seed.lat, seed.lon, 0, 'temperature');
  const s = baseField(seed.lat, seed.lon, 50, 'salinity');
  const c = baseField(seed.lat, seed.lon, 20, 'chlorophyll');
  const jitter = (rand() - 0.5) * 0.6;
  return {
    id: seed.id,
    type,
    latitude: seed.lat,
    longitude: seed.lon,
    timestamp: ts,
    depth: 10,
    temperature: surfaceT + jitter,
    salinity: s,
    chlorophyll: Math.max(0, c),
    maxDepth: seed.maxDepth,
  };
}

// FUTURE BACKEND: GET /api/observations?type=argo&time=0
export async function getObservations(timeIndex: number): Promise<Observation[]> {
  const argo = ARGO_SEEDS.map((s) => buildObservation(s, 'argo', timeIndex));
  const gliders = GLIDER_SEEDS.map((s) => buildObservation(s, 'glider', timeIndex));
  return [...argo, ...gliders];
}

// FUTURE BACKEND: GET /api/profile?id=ARGO-2901&variable=temperature
export async function getProfile(
  obsId: string,
  variable: 'temperature' | 'salinity' | 'chlorophyll',
): Promise<{ observation: ProfilePoint[]; model: ProfilePoint[] }> {
  const seed =
    ARGO_SEEDS.find((s) => s.id === obsId) ??
    GLIDER_SEEDS.find((s) => s.id === obsId) ??
    ARGO_SEEDS[0];
  const isArgo = ARGO_SEEDS.some((s) => s.id === obsId);
  const obs: ProfilePoint[] = [];
  const model: ProfilePoint[] = [];
  const levels = isArgo
    ? [0, 50, 100, 200, 400, 600, 800, 1000, 1200, 1500, 1800, 2000]
    : [0, 25, 50, 100, 200, 300, 500, 700, 900];

  for (const d of levels) {
    if (d > seed.maxDepth) break;
    const t = baseField(seed.lat, seed.lon, d, 'temperature');
    const s = baseField(seed.lat, seed.lon, d, 'salinity');
    const c = baseField(seed.lat, seed.lon, d, 'chlorophyll');
    model.push({ depth: d, temperature: t, salinity: s, chlorophyll: Math.max(0, c) });
    const noise = (hashLatLon(seed.lat + d * 0.01, seed.lon) - 0.5);
    obs.push({
      depth: d,
      temperature: t + noise * 0.8,
      salinity: s + noise * 0.05,
      chlorophyll: Math.max(0, c + noise * 0.15),
    });
  }
  return { observation: obs, model };
  void variable;
}

export function computeStats(
  obs: ProfilePoint[],
  model: ProfilePoint[],
  variable: 'temperature' | 'salinity' | 'chlorophyll',
): { rmse: number; meanError: number; count: number } {
  const n = Math.min(obs.length, model.length);
  if (n === 0) return { rmse: 0, meanError: 0, count: 0 };
  let sumSq = 0;
  let sumErr = 0;
  for (let i = 0; i < n; i++) {
    const diff = obs[i][variable] - model[i][variable];
    sumSq += diff * diff;
    sumErr += diff;
  }
  return {
    rmse: Math.sqrt(sumSq / n),
    meanError: sumErr / n,
    count: n,
  };
}

export function variableRange(variable: 'temperature' | 'salinity' | 'chlorophyll') {
  return VARIABLE_CONFIG[variable].range;
}

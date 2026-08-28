// apiOceanService.ts
// Drop-in replacement for mockOceanService.ts — same function names,
// same signatures, same return types. Only the bodies change.
//
// TO SWITCH FROM MOCK → REAL, change ONE line in each component:
//
//   // Before:
//   import { getFieldSlice } from '@/services/mockOceanService'
//
//   // After:
//   import { getFieldSlice } from '@/services/apiOceanService'

import type { CurrentVector, Observation, ProfilePoint } from '@/types/ocean';

export interface GridPoint {
  lat: number; lon: number; depth: number;
  temperature: number; salinity: number; chlorophyll: number;
}
export interface GridSlice { nlats: number; nlons: number; points: GridPoint[]; }

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// Replaces: mockOceanService.getFieldSlice
// Backend:  GET /api/field?variable=temperature&depth=200&time=3
export async function getFieldSlice(
  variable: 'temperature' | 'salinity' | 'chlorophyll',
  depth: number,
  timeIndex: number,
): Promise<GridSlice> {
  return apiFetch<GridSlice>(
    `/field?variable=${variable}&depth=${depth}&time=${timeIndex}`
  );
}

// Replaces: mockOceanService.getCurrents
// Backend:  GET /api/currents?depth=0&time=0&density=medium
export async function getCurrents(
  depth: number,
  timeIndex: number,
  density: 'low' | 'medium' | 'high' = 'medium',
): Promise<CurrentVector[]> {
  return apiFetch<CurrentVector[]>(
    `/currents?depth=${depth}&time=${timeIndex}&density=${density}`
  );
}

// Replaces: mockOceanService.getObservations
// Backend:  GET /api/observations?time=0
export async function getObservations(timeIndex: number): Promise<Observation[]> {
  return apiFetch<Observation[]>(`/observations?time=${timeIndex}`);
}

// Replaces: mockOceanService.getProfile
// Backend:  GET /api/profile?id=ARGO-2901&variable=temperature
export async function getProfile(
  obsId: string,
  variable: 'temperature' | 'salinity' | 'chlorophyll',
): Promise<{ observation: ProfilePoint[]; model: ProfilePoint[] }> {
  return apiFetch(`/profile?id=${obsId}&variable=${variable}`);
}

// Pure function — no API call needed, identical to mock version
export function computeStats(
  obs: ProfilePoint[],
  model: ProfilePoint[],
  variable: 'temperature' | 'salinity' | 'chlorophyll',
): { rmse: number; meanError: number; count: number } {
  const n = Math.min(obs.length, model.length);
  if (n === 0) return { rmse: 0, meanError: 0, count: 0 };
  let sumSq = 0, sumErr = 0;
  for (let i = 0; i < n; i++) {
    const diff = obs[i][variable] - model[i][variable];
    sumSq += diff * diff;
    sumErr += diff;
  }
  return { rmse: Math.sqrt(sumSq / n), meanError: sumErr / n, count: n };
}

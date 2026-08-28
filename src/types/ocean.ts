// Core domain types for the OceanVision 3D platform.
// These types are used by the prototype mock data service.


// ── Observation Types ─────────────────────────────────────────────────────────

export type ObservationType =
  | 'argo'
  | 'glider';


// ── Ocean Variables ───────────────────────────────────────────────────────────

export type OceanVariable =
  | 'temperature'
  | 'salinity'
  | 'current'
  | 'chlorophyll';


// ── Color Palettes ────────────────────────────────────────────────────────────

export type ColorPaletteId =
  | 'thermal'
  | 'haline'
  | 'velocity'
  | 'chlorophyll'
  | 'viridis';


// ── Ocean Grid ────────────────────────────────────────────────────────────────

export interface OceanGrid {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  nlats: number;
  nlons: number;
  depths: number[];
}


// ── Grid Point ────────────────────────────────────────────────────────────────

export interface GridPoint {
  lat: number;
  lon: number;
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
}


// ── Grid Slice ────────────────────────────────────────────────────────────────

export interface GridSlice {
  nlats: number;
  nlons: number;
  points: GridPoint[];
}


// ── Ocean Observation ─────────────────────────────────────────────────────────

export interface Observation {
  id: string;
  type: ObservationType;
  latitude: number;
  longitude: number;
  timestamp: string;
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
  maxDepth: number;
}


// ── Current Vector ────────────────────────────────────────────────────────────

export interface CurrentVector {
  latitude: number;
  longitude: number;
  depth: number;
  u: number;
  v: number;
  timestamp: string;
}


// ── Profile ───────────────────────────────────────────────────────────────────

export interface ProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
}

export interface ProfileResponse {
  observation: ProfilePoint[];
  model: ProfilePoint[];
}


// ── Time ──────────────────────────────────────────────────────────────────────

export interface TimeStep {
  index: number;
  label: string;
  timestamp: string;
}


// ── Variable Configuration ───────────────────────────────────────────────────

export interface VariableConfig {
  id: OceanVariable;
  label: string;
  unit: string;
  palette: ColorPaletteId;
  range: [number, number];
}


// ── Color Stops ───────────────────────────────────────────────────────────────

export interface ColorStop {
  t: number;
  color: string;
}


// ── Statistics ────────────────────────────────────────────────────────────────

export interface Stats {
  rmse: number;
  meanError: number;
  count: number;
}


// ── Regions ───────────────────────────────────────────────────────────────────

export type RegionId =
  | 'arabian-sea'
  | 'bay-of-bengal'
  | 'indian-ocean';

export interface Region {
  id: RegionId;
  label: string;
  center: [number, number];
  bounds: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  };
}


// ── Map Overlays ──────────────────────────────────────────────────────────────

export interface OverlaysState {
  currents: boolean;
  windVectors: boolean;
  contours: boolean;
  bathymetry: boolean;
}

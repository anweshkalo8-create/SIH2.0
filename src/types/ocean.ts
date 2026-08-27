// Core domain types for the OceanVision 3D platform.
// These mirror the shape of fields returned by the future FastAPI / xarray
// backend, so the mock service can be swapped for a real API with minimal churn.

export type ObservationType = 'argo' | 'glider';

export type OceanVariable = 'temperature' | 'salinity' | 'current' | 'chlorophyll';

export type ColorPaletteId = 'thermal' | 'haline' | 'velocity' | 'chlorophyll' | 'viridis';

export interface OceanGrid {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  nlats: number;
  nlons: number;
  depths: number[];
}

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

export interface CurrentVector {
  latitude: number;
  longitude: number;
  depth: number;
  u: number;
  v: number;
  timestamp: string;
}

export interface ProfilePoint {
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
}

export interface TimeStep {
  index: number;
  label: string;
  timestamp: string;
}

export interface VariableConfig {
  id: OceanVariable;
  label: string;
  unit: string;
  palette: ColorPaletteId;
  range: [number, number];
}

export interface ColorStop {
  t: number;
  color: string;
}

export interface Stats {
  rmse: number;
  meanError: number;
  count: number;
}

export type RegionId = 'arabian-sea' | 'bay-of-bengal' | 'indian-ocean';

export interface Region {
  id: RegionId;
  label: string;
  center: [number, number];
  bounds: { latMin: number; latMax: number; lonMin: number; lonMax: number };
}

export interface OverlaysState {
  currents: boolean;
  windVectors: boolean;
  contours: boolean;
  bathymetry: boolean;
}


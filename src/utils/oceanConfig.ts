import type { OceanVariable } from '@/types/ocean';

export const VARIABLE_CONFIG: Record<
  OceanVariable,
  { label: string; unit: string; range: [number, number]; defaultPalette: string }
> = {
  temperature: { label: 'Temperature', unit: '°C', range: [5, 32], defaultPalette: 'thermal' },
  salinity: { label: 'Salinity', unit: 'PSU', range: [33, 37], defaultPalette: 'haline' },
  current: { label: 'Current Velocity', unit: 'm/s', range: [0, 1.2], defaultPalette: 'velocity' },
  chlorophyll: { label: 'Chlorophyll-a', unit: 'mg/m³', range: [0, 3], defaultPalette: 'chlorophyll' },
};

export const DEPTH_LEVELS = [0, 50, 100, 200, 500, 1000, 1500, 2000];

export const TIME_STEPS = [
  { index: 0, label: '00:00', timestamp: '2026-08-26T00:00:00Z' },
  { index: 1, label: '06:00', timestamp: '2026-08-26T06:00:00Z' },
  { index: 2, label: '12:00', timestamp: '2026-08-26T12:00:00Z' },
  { index: 3, label: '18:00', timestamp: '2026-08-26T18:00:00Z' },
  { index: 4, label: '00:00', timestamp: '2026-08-27T00:00:00Z' },
];

export function formatValue(value: number, variable: OceanVariable): string {
  const unit = VARIABLE_CONFIG[variable].unit;
  const decimals = variable === 'salinity' ? 2 : variable === 'chlorophyll' ? 3 : 2;
  return `${value.toFixed(decimals)} ${unit}`;
}

export function normalize(value: number, variable: OceanVariable): number {
  const [min, max] = VARIABLE_CONFIG[variable].range;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

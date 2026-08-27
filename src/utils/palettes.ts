import type { ColorPaletteId, ColorStop, OceanVariable } from '@/types/ocean';

export const PALETTES: Record<ColorPaletteId, ColorStop[]> = {
  thermal: [
    { t: 0, color: '#1c2a55' },
    { t: 0.2, color: '#1e6fb0' },
    { t: 0.4, color: '#27c2c9' },
    { t: 0.6, color: '#f7d358' },
    { t: 0.8, color: '#f08a3c' },
    { t: 1, color: '#d7263d' },
  ],
  haline: [
    { t: 0, color: '#2a1259' },
    { t: 0.25, color: '#3a4fa3' },
    { t: 0.5, color: '#2fa8c4' },
    { t: 0.75, color: '#9be7b3' },
    { t: 1, color: '#f4f7a1' },
  ],
  velocity: [
    { t: 0, color: '#0a2a43' },
    { t: 0.25, color: '#1b6ca8' },
    { t: 0.5, color: '#3dd6c0' },
    { t: 0.75, color: '#f5e642' },
    { t: 1, color: '#ff5a3c' },
  ],
  chlorophyll: [
    { t: 0, color: '#0a1a3a' },
    { t: 0.2, color: '#13407a' },
    { t: 0.4, color: '#2bbf6a' },
    { t: 0.7, color: '#cfe955' },
    { t: 1, color: '#f2c200' },
  ],
  viridis: [
    { t: 0, color: '#440154' },
    { t: 0.25, color: '#3b528b' },
    { t: 0.5, color: '#21918c' },
    { t: 0.75, color: '#5ec962' },
    { t: 1, color: '#fde725' },
  ],
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function samplePalette(palette: ColorPaletteId, t: number): string {
  const stops = PALETTES[palette];
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (clamped >= a.t && clamped <= b.t) {
      const localT = (clamped - a.t) / (b.t - a.t || 1);
      return lerpColor(a.color, b.color, localT);
    }
  }
  return stops[stops.length - 1].color;
}

export const PALETTE_LABELS: Record<ColorPaletteId, string> = {
  thermal: 'Thermal',
  haline: 'Haline',
  velocity: 'Velocity',
  chlorophyll: 'Chlorophyll',
  viridis: 'Viridis',
};

export const VARIABLE_PALETTE: Record<OceanVariable, ColorPaletteId> = {
  temperature: 'thermal',
  salinity: 'haline',
  current: 'velocity',
  chlorophyll: 'chlorophyll',
};

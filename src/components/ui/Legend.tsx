import { PALETTES } from '@/utils/palettes';
import { VARIABLE_CONFIG } from '@/utils/oceanConfig';
import type { ColorPaletteId, OceanVariable } from '@/types/ocean';

interface LegendProps {
  variable: OceanVariable;
  palette: ColorPaletteId;
}

export function Legend({ variable, palette }: LegendProps) {
  const stops = PALETTES[palette];
  const [min, max] = VARIABLE_CONFIG[variable].range;
  const unit = VARIABLE_CONFIG[variable].unit;

  return (
    <div className="pointer-events-auto w-56 rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-slate-200 backdrop-blur">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
        {VARIABLE_CONFIG[variable].label}
      </div>
      <div className="h-3 w-full rounded-full" style={{ background: gradientCss(stops) }} />
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function gradientCss(stops: { t: number; color: string }[]): string {
  const parts = stops.map((s) => `${s.color} ${Math.round(s.t * 100)}%`);
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

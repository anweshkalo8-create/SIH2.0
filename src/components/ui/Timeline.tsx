import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { TIME_STEPS } from '@/utils/oceanConfig';

interface TimelineProps {
  timeIndex: number;
  playing: boolean;
  onTimeChange: (i: number) => void;
  onTogglePlay: () => void;
}

export function Timeline({ timeIndex, playing, onTimeChange, onTogglePlay }: TimelineProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-slate-200 backdrop-blur">
      <button
        onClick={() => onTimeChange((timeIndex - 1 + TIME_STEPS.length) % TIME_STEPS.length)}
        className="grid h-8 w-8 place-items-center rounded-md bg-slate-800/60 hover:bg-slate-800"
        aria-label="Previous time step"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={onTogglePlay}
        className="grid h-9 w-9 place-items-center rounded-md bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        onClick={() => onTimeChange((timeIndex + 1) % TIME_STEPS.length)}
        className="grid h-8 w-8 place-items-center rounded-md bg-slate-800/60 hover:bg-slate-800"
        aria-label="Next time step"
      >
        <ChevronRight size={16} />
      </button>

      <div className="flex items-center gap-1">
        {TIME_STEPS.map((t, i) => (
          <button
            key={i}
            onClick={() => onTimeChange(i)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              i === timeIndex ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">
        Synthetic Timeline · {TIME_STEPS[timeIndex].timestamp.slice(0, 10)}
      </div>
    </div>
  );
}

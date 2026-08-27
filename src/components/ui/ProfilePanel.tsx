import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as ChartLegend,
} from 'recharts';
import { X, Activity, GitCompare } from 'lucide-react';
import type { Observation, OceanVariable } from '@/types/ocean';
import { getProfile, computeStats } from '@/services/mockOceanService';
import type { ProfilePoint } from '@/types/ocean';
import { VARIABLE_CONFIG, formatValue } from '@/utils/oceanConfig';
import { formatLat, formatLon } from '@/utils/geo';

interface ProfilePanelProps {
  observation: Observation;
  variable: OceanVariable;
  onClose: () => void;
  onVariableChange: (v: OceanVariable) => void;
}

const PROFILE_VARS: OceanVariable[] = ['temperature', 'salinity', 'chlorophyll'];

export function ProfilePanel({ observation, variable, onClose, onVariableChange }: ProfilePanelProps) {
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obs, setObs] = useState<ProfilePoint[]>([]);
  const [model, setModel] = useState<ProfilePoint[]>([]);

  const profileVar: 'temperature' | 'salinity' | 'chlorophyll' =
    variable === 'current' ? 'temperature' : (variable as 'temperature' | 'salinity' | 'chlorophyll');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProfile(observation.id, profileVar)
      .then((res) => {
        if (cancelled) return;
        setObs(res.observation);
        setModel(res.model);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load profile data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [observation.id, profileVar]);

  const chartData = useMemo(() => {
    const n = Math.max(obs.length, model.length);
    const rows: Array<{ depth: number; observation: number | null; model: number | null }> = [];
    for (let i = 0; i < n; i++) {
      rows.push({
        depth: obs[i]?.depth ?? model[i]?.depth ?? 0,
        observation: obs[i] ? obs[i][profileVar] : null,
        model: model[i] ? model[i][profileVar] : null,
      });
    }
    return rows;
  }, [obs, model, profileVar]);

  const stats = useMemo(() => computeStats(obs, model, profileVar), [obs, model, profileVar]);

  const unit = VARIABLE_CONFIG[variable].unit;

  return (
    <div className="pointer-events-auto flex max-h-[calc(100vh-3rem)] w-80 flex-col rounded-xl border border-slate-800 bg-slate-900/90 text-slate-200 backdrop-blur">
      <div className="flex items-start justify-between border-b border-slate-800 p-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                observation.type === 'argo' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {observation.type}
            </span>
            <span className="text-sm font-semibold text-white">{observation.id}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {formatLat(observation.latitude)} · {formatLon(observation.longitude)}
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-800 p-4 text-xs">
        <Field label="Observation Time" value={observation.timestamp.slice(0, 16).replace('T', ' ')} />
        <Field label="Max Depth" value={`${observation.maxDepth} m`} />
        <Field label="Surface Temp" value={formatValue(observation.temperature, 'temperature')} />
        <Field label="Salinity" value={formatValue(observation.salinity, 'salinity')} />
      </div>

      <div className="border-b border-slate-800 p-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">Profile Variable</div>
        <div className="flex gap-1">
          {PROFILE_VARS.map((v) => (
            <button
              key={v}
              onClick={() => onVariableChange(v)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                variable === v ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {VARIABLE_CONFIG[v].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-slate-800 p-4">
        <button
          onClick={() => setCompare((c) => !c)}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            compare ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <GitCompare size={14} />
          Model vs Observation
        </button>

        {compare && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="RMSE" value={stats.rmse.toFixed(3)} />
            <Stat label="Mean Error" value={stats.meanError.toFixed(3)} />
            <Stat label="Obs Count" value={String(stats.count)} />
          </div>
        )}
      </div>

      <div className="min-h-[220px] flex-1 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            <Activity size={14} className="mr-2 animate-pulse" /> Loading profile…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-xs text-rose-400">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="depth"
                domain={['auto', 'auto']}
                reversed
                label={{ value: 'Depth (m)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                stroke="#334155"
              />
              <YAxis
                type="number"
                orientation="right"
                domain={['auto', 'auto']}
                label={{ value: unit, angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                stroke="#334155"
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              {compare && (
                <ChartLegend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="plainline"
                />
              )}
              <Line
                type="monotone"
                dataKey="observation"
                name="Observation"
                stroke="#22d3ee"
                dot={false}
                strokeWidth={2}
                yAxisId={0}
              />
              {compare && (
                <Line
                  type="monotone"
                  dataKey="model"
                  name="Model"
                  stroke="#f59e0b"
                  dot={false}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  yAxisId={0}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-slate-100">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-800/50 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-cyan-200">{value}</div>
    </div>
  );
}

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { OCEAN_GRID } from '@/services/mockOceanService';
import { lonToX, latToZ } from '@/utils/geo';
import type { Observation } from '@/types/ocean';

interface ObservationMarkersProps {
  observations: Observation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ARGO_COLOR = '#22d3ee';
const GLIDER_COLOR = '#f59e0b';

export function ObservationMarkers({ observations, selectedId, onSelect }: ObservationMarkersProps) {
  return (
    <group>
      {observations.map((obs) => (
        <Marker key={obs.id} obs={obs} selected={obs.id === selectedId} onSelect={onSelect} />
      ))}
    </group>
  );
}

function Marker({ obs, selected, onSelect }: { obs: Observation; selected: boolean; onSelect: (id: string) => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const x = useMemo(() => lonToX(obs.longitude, OCEAN_GRID), [obs.longitude]);
  const z = useMemo(() => latToZ(obs.latitude, OCEAN_GRID), [obs.latitude]);
  const color = obs.type === 'argo' ? ARGO_COLOR : GLIDER_COLOR;
  const size = selected ? 1.1 : 0.75;

  return (
    <group position={[x, 0.45, z]}>
      {/* Visual Glowing Sphere */}
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(obs.id);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
      </mesh>

      {/* Larger Invisible Hit Area for Easy Mouse Clicking */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(obs.id);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        visible={false}
      >
        <sphereGeometry args={[1.5, 8, 8]} />
      </mesh>

      {/* Stem down to ocean surface for 3D depth cue */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Floating Sensor Name Tag */}
      <Html distanceFactor={16} position={[0, 1.4, 0]} center>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(obs.id);
          }}
          className={`cursor-pointer select-none whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-semibold shadow-lg transition-transform hover:scale-110 ${
            selected
              ? 'border border-cyan-400 bg-cyan-950/90 text-cyan-200 ring-2 ring-cyan-400/40'
              : 'border border-slate-700 bg-slate-950/80 text-slate-300 hover:border-cyan-400'
          }`}
        >
          {obs.id}
        </div>
      </Html>

      {/* Pulsing Sonar Ring when selected */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

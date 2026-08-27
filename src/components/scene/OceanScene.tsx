import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OceanBasin } from './OceanBasin';
import { FieldLayer } from './FieldLayer';
import { CurrentArrows } from './CurrentArrows';
import { WindVectors } from './WindVectors';
import { ObservationMarkers } from './ObservationMarkers';
import type { GridSlice } from '@/services/mockOceanService';
import type { CurrentVector, Observation, OceanVariable, ColorPaletteId, OverlaysState } from '@/types/ocean';

interface OceanSceneProps {
  slice: GridSlice | null;
  currents: CurrentVector[];
  observations: Observation[];
  variable: OceanVariable;
  palette: ColorPaletteId;
  depth?: number;
  opacity: number;
  exaggeration: number;
  maxDepth: number;
  showCurrents?: boolean;
  overlays?: OverlaysState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReset: () => void;
  resetSignal: number;
  timePhase?: number;
}

export function OceanScene(props: OceanSceneProps) {
  const {
    slice,
    currents,
    observations,
    variable,
    palette,
    depth = 0,
    opacity,
    exaggeration,
    maxDepth,
    overlays = { currents: true, windVectors: true, contours: true, bathymetry: true },
    selectedId,
    onSelect,
    timePhase = 0,
  } = props;

  return (
    <Canvas
      camera={{ position: [32, 26, 36], fov: 38, near: 0.1, far: 500 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#030712'));
      }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[40, 50, 30]} intensity={1.1} />
      <directionalLight position={[-30, 20, -20]} intensity={0.4} color="#38bdf8" />
      <hemisphereLight args={['#38bdf8', '#020617', 0.6]} />

      <Suspense fallback={null}>
        {/* 1. 3D Volumetric Ocean Extruded Block */}
        <OceanBasin
          exaggeration={exaggeration}
          variable={variable}
          overlays={overlays}
          timePhase={timePhase}
        />

        {/* 2. Horizontal Depth Slice (when depth > 0m) */}
        {slice && depth > 10 && (
          <FieldLayer
            slice={slice}
            variable={variable}
            palette={palette}
            opacity={opacity}
            exaggeration={exaggeration}
            maxDepth={maxDepth}
            depth={depth}
          />
        )}

        {/* 3. Surface / Subsurface Current Streamline Vectors */}
        {overlays.currents && currents.length > 0 && (
          <CurrentArrows
            currents={currents}
            exaggeration={exaggeration}
            maxDepth={maxDepth}
            opacity={0.9}
          />
        )}

        {/* 4. Atmospheric Wind Streamline Vectors */}
        {overlays.windVectors && (
          <WindVectors opacity={0.85} timePhase={timePhase} />
        )}

        {/* 5. In-Situ Observation Markers (Argo Floats & Gliders) */}
        <ObservationMarkers
          observations={observations}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan
        enableDamping
        dampingFactor={0.06}
        minDistance={12}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, -3, 0]}
      />
    </Canvas>
  );
}

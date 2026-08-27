import { useMemo } from 'react';
import * as THREE from 'three';
import { SCENE_SIZE, depthToY } from '@/utils/geo';
import { createTopSurfaceTexture } from '@/utils/oceanTextures';
import type { ColorPaletteId, OceanVariable } from '@/types/ocean';
import type { GridSlice } from '@/services/mockOceanService';

interface FieldLayerProps {
  slice: GridSlice;
  variable: OceanVariable;
  palette: ColorPaletteId;
  opacity: number;
  exaggeration: number;
  maxDepth: number;
  depth?: number;
}

export function FieldLayer({
  variable,
  opacity = 0.85,
  exaggeration,
  maxDepth,
  depth = 0,
}: FieldLayerProps) {
  // If at surface (0m), OceanBasin top plane renders the surface heatmap
  if (depth <= 10) return null;

  const y = depthToY(depth, maxDepth, exaggeration);

  const texture = useMemo(() => {
    return createTopSurfaceTexture(variable, true, true, 0);
  }, [variable]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[SCENE_SIZE, SCENE_SIZE]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

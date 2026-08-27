import { useMemo } from 'react';
import * as THREE from 'three';
import { SCENE_SIZE, SCENE_DEPTH } from '@/utils/geo';
import {
  createTopSurfaceTexture,
  createSideDepthTexture,
  createBathymetrySeafloorTexture,
  getBathymetricDepth,
} from '@/utils/oceanTextures';
import type { OceanVariable, OverlaysState } from '@/types/ocean';

interface OceanBasinProps {
  exaggeration: number;
  variable?: OceanVariable;
  overlays?: OverlaysState;
  timePhase?: number;
}

export function OceanBasin({
  exaggeration = 1.0,
  variable = 'temperature',
  overlays = { currents: true, windVectors: true, contours: true, bathymetry: true },
  timePhase = 0,
}: OceanBasinProps) {
  const half = SCENE_SIZE / 2;
  const depth = SCENE_DEPTH * exaggeration * 1.5;

  // 1. Top Surface Texture with variable heatmap & bathymetric isobaths
  const topTexture = useMemo(() => {
    return createTopSurfaceTexture(variable, overlays.contours, overlays.bathymetry, timePhase);
  }, [variable, overlays.contours, overlays.bathymetry, timePhase]);

  // 2. High-resolution Bathymetric Seafloor Texture with GEBCO tints, hillshading & annotations
  const seafloorTexture = useMemo(() => {
    return createBathymetrySeafloorTexture(overlays.bathymetry);
  }, [overlays.bathymetry]);

  // 3. Side Depth Stratification Textures
  const sideTextureEW = useMemo(() => {
    return createSideDepthTexture(true, exaggeration, overlays.bathymetry);
  }, [exaggeration, overlays.bathymetry]);

  const sideTextureNS = useMemo(() => {
    return createSideDepthTexture(false, exaggeration, overlays.bathymetry);
  }, [exaggeration, overlays.bathymetry]);

  // 4. 3D Displaced Bathymetric Seafloor Mesh Geometry
  const seafloorGeometry = useMemo(() => {
    const segments = 96;
    const geom = new THREE.PlaneGeometry(SCENE_SIZE, SCENE_SIZE, segments, segments);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);

      if (overlays.bathymetry) {
        // Convert local plane coords to geographical (lon, lat)
        const u = (vx + half) / SCENE_SIZE; // 0 to 1 (West to East: 40 to 100°E)
        const v = (vy + half) / SCENE_SIZE; // 0 to 1 (South to North: -20 to +30°N)
        const lon = 40 + u * 60;
        const lat = -20 + v * 50;

        const bDepth = getBathymetricDepth(lon, lat);

        // Local Z points upwards in world space when rotated [-PI/2, 0, 0]
        // Displace vertices upwards for shallower features (ridges, shelves) and downwards for trenches
        const zDisplacement = (1 - bDepth / 5500) * (depth * 0.42);
        pos.setZ(i, zDisplacement);
      } else {
        pos.setZ(i, 0);
      }
    }

    geom.computeVertexNormals();
    return geom;
  }, [overlays.bathymetry, depth, half]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. TOP SURFACE: Volumetric Heatmap Plane (SST / Salinity / Contours / Bathymetry Isobaths) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[SCENE_SIZE, SCENE_SIZE, 64, 64]} />
        <meshStandardMaterial
          map={topTexture}
          roughness={0.3}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. SIDE DEPTH WALLS: Depth Stratification Thermocline */}
      {/* South Wall (Front) */}
      <mesh position={[0, -depth / 2, half]}>
        <planeGeometry args={[SCENE_SIZE, depth]} />
        <meshBasicMaterial map={sideTextureEW} side={THREE.DoubleSide} />
      </mesh>

      {/* North Wall (Back) */}
      <mesh position={[0, -depth / 2, -half]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SCENE_SIZE, depth]} />
        <meshBasicMaterial map={sideTextureEW} side={THREE.DoubleSide} />
      </mesh>

      {/* West Wall (Left) */}
      <mesh position={[-half, -depth / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SCENE_SIZE, depth]} />
        <meshBasicMaterial map={sideTextureNS} side={THREE.DoubleSide} />
      </mesh>

      {/* East Wall (Right) */}
      <mesh position={[half, -depth / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SCENE_SIZE, depth]} />
        <meshBasicMaterial map={sideTextureNS} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. SEAFLOOR: 3D Displaced Bathymetric Bed with GEBCO Color & Hillshaded Relief */}
      <mesh
        geometry={seafloorGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -depth, 0]}
      >
        <meshStandardMaterial
          map={seafloorTexture}
          roughness={0.7}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. SOLID BLOCK WIREFRAME EDGES (Borders) */}
      <lineSegments position={[0, -depth / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(SCENE_SIZE, depth, SCENE_SIZE)]} />
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
}

export function Coastline() {
  return null; // Integrated into the high-res top surface texture matching the screenshot
}

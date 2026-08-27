import { useMemo } from 'react';
import * as THREE from 'three';
import { OCEAN_GRID } from '@/services/mockOceanService';
import { lonToX, latToZ } from '@/utils/geo';

interface WindVectorsProps {
  opacity?: number;
  timePhase?: number;
}

const WIND_ARROW_GEOMETRY = new THREE.ConeGeometry(0.22, 0.75, 5);

export function WindVectors({ opacity = 0.85, timePhase = 0 }: WindVectorsProps) {
  const { matrices, colors } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    // Generate SW Monsoon wind field grid across the Indian Ocean domain
    for (let lat = -16; lat <= 26; lat += 4.5) {
      for (let lon = 44; lon <= 96; lon += 5.0) {
        const x = lonToX(lon, OCEAN_GRID);
        const z = latToZ(lat, OCEAN_GRID);
        const y = 0.5; // Hovering just above the surface plane

        // SW Monsoon wind model: Strong South-Westerly winds over Arabian Sea & Bay of Bengal
        const uWind = 0.6 + Math.sin((lon - 40) * 0.08) * 0.4 + Math.sin(timePhase) * 0.15;
        const vWind = 0.7 + Math.cos((lat + 20) * 0.07) * 0.3 + Math.cos(timePhase) * 0.12;

        const speed = Math.hypot(uWind, vWind);
        const angle = Math.atan2(uWind, -vWind);
        const scale = 0.6 + Math.min(1.0, speed * 0.8);

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, angle, 0);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mats.push(dummy.matrix.clone());

        // Golden/Amber atmospheric wind vector colors
        const col = new THREE.Color().lerpColors(
          new THREE.Color('#fbbf24'), // Warm Amber/Gold
          new THREE.Color('#f59e0b'), // Deep Gold
          Math.min(1, speed / 1.5)
        );
        cols.push(col);
      }
    }
    return { matrices: mats, colors: cols };
  }, [timePhase]);

  const colorArray = useMemo(() => {
    const arr = new Float32Array(colors.length * 3);
    colors.forEach((c, i) => {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return arr;
  }, [colors]);

  return (
    <instancedMesh
      args={[
        WIND_ARROW_GEOMETRY,
        new THREE.MeshBasicMaterial({
          transparent: true,
          opacity,
          vertexColors: true,
          toneMapped: false,
        }),
        matrices.length,
      ]}
      ref={(ref) => {
        if (!ref) return;
        for (let i = 0; i < matrices.length; i++) {
          ref.setMatrixAt(i, matrices[i]);
        }
        ref.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
        ref.instanceMatrix.needsUpdate = true;
      }}
    />
  );
}

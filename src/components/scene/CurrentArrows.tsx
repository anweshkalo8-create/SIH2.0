import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OCEAN_GRID } from '@/services/mockOceanService';
import { lonToX, latToZ, depthToY, SCENE_SIZE } from '@/utils/geo';
import type { CurrentVector } from '@/types/ocean';

interface CurrentArrowsProps {
  currents: CurrentVector[];
  exaggeration: number;
  maxDepth: number;
  opacity?: number;
}

const PARTICLE_COUNT = 1400;
const HALF_SIZE = SCENE_SIZE / 2;

export function CurrentArrows({
  currents,
  exaggeration = 1.0,
  maxDepth = 5500,
  opacity = 0.95,
}: CurrentArrowsProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // 1. Static Directional Arrow Matrix Grid
  const { matrices, arrowColors } = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    for (const cv of currents) {
      const x = lonToX(cv.longitude, OCEAN_GRID);
      const z = latToZ(cv.latitude, OCEAN_GRID);
      const y = cv.depth === 0 ? 0.2 : depthToY(cv.depth, maxDepth, exaggeration) + 0.15;

      const speed = Math.hypot(cv.u, cv.v);
      const angle = Math.atan2(cv.u, -cv.v);
      const scale = 0.4 + Math.min(1.0, speed * 1.5);

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, angle, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());

      const t = Math.min(1, speed / 1.2);
      cols.push(
        new THREE.Color().lerpColors(
          new THREE.Color('#ffffff'),
          new THREE.Color('#38bdf8'),
          t
        )
      );
    }
    return { matrices: mats, arrowColors: cols };
  }, [currents, exaggeration, maxDepth]);

  // 2. Animated Particle Streamline System (Windy / Earth.nullschool style)
  const particles = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const linePos = new Float32Array(PARTICLE_COUNT * 6); // head + tail for each particle streak
    const colors = new Float32Array(PARTICLE_COUNT * 6);
    const life = new Float32Array(PARTICLE_COUNT);
    const maxLife = new Float32Array(PARTICLE_COUNT);
    const vel = new Float32Array(PARTICLE_COUNT * 2); // vx, vz

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      resetParticle(i, pos, linePos, life, maxLife, vel);

      // Color gradient for particle streaks (white to cyan glow)
      const c = new THREE.Color(i % 3 === 0 ? '#38bdf8' : '#ffffff');
      colors[i * 6] = c.r;
      colors[i * 6 + 1] = c.g;
      colors[i * 6 + 2] = c.b;
      colors[i * 6 + 3] = c.r * 0.2;
      colors[i * 6 + 4] = c.g * 0.2;
      colors[i * 6 + 5] = c.b * 0.2;
    }

    return { pos, linePos, colors, life, maxLife, vel };
  }, []);

  // Frame animation loop for streaming flow
  useFrame((_, delta) => {
    if (!linesRef.current) return;

    const linePositions = linesRef.current.geometry.attributes.position.array as Float32Array;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.life[i] += dt * 25;

      if (particles.life[i] >= particles.maxLife[i]) {
        resetParticle(i, particles.pos, linePositions, particles.life, particles.maxLife, particles.vel);
        continue;
      }

      const idx3 = i * 3;
      const idx6 = i * 6;

      // Current head position
      const curX = particles.pos[idx3];
      const curZ = particles.pos[idx3 + 2];

      // Sample velocity from current field
      const vx = particles.vel[i * 2];
      const vz = particles.vel[i * 2 + 1];

      // Move head forward
      const nextX = curX + vx * dt * 8;
      const nextZ = curZ + vz * dt * 8;

      // Wrap boundaries
      if (Math.abs(nextX) > HALF_SIZE - 0.5 || Math.abs(nextZ) > HALF_SIZE - 0.5) {
        resetParticle(i, particles.pos, linePositions, particles.life, particles.maxLife, particles.vel);
        continue;
      }

      // Update tail (old head) & new head for streamline streak
      linePositions[idx6] = curX;         // tail X
      linePositions[idx6 + 1] = 0.22;     // tail Y
      linePositions[idx6 + 2] = curZ;     // tail Z

      linePositions[idx6 + 3] = nextX;    // head X
      linePositions[idx6 + 4] = 0.22;     // head Y
      linePositions[idx6 + 5] = nextZ;    // head Z

      // Store updated head position
      particles.pos[idx3] = nextX;
      particles.pos[idx3 + 2] = nextZ;
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const arrowColorArray = useMemo(() => {
    const arr = new Float32Array(arrowColors.length * 3);
    arrowColors.forEach((c, i) => {
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return arr;
  }, [arrowColors]);

  return (
    <group>
      {/* 1. Animated Windy-Style Flow Streamlines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles.linePos, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particles.colors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          linewidth={2}
        />
      </lineSegments>

      {/* 2. Directional Vector Cones */}
      <instancedMesh
        args={[
          new THREE.ConeGeometry(0.14, 0.45, 5),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.6,
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
          ref.instanceColor = new THREE.InstancedBufferAttribute(arrowColorArray, 3);
          ref.instanceMatrix.needsUpdate = true;
        }}
      />
    </group>
  );
}

function resetParticle(
  i: number,
  pos: Float32Array,
  linePos: Float32Array,
  life: Float32Array,
  maxLife: Float32Array,
  vel: Float32Array
) {
  // Random start coordinates on the ocean surface plane
  const x = (Math.random() - 0.5) * (SCENE_SIZE - 2);
  const z = (Math.random() - 0.5) * (SCENE_SIZE - 2);
  const y = 0.22;

  pos[i * 3] = x;
  pos[i * 3 + 1] = y;
  pos[i * 3 + 2] = z;

  // Streamline tail & head initial position
  const idx6 = i * 6;
  linePos[idx6] = x;
  linePos[idx6 + 1] = y;
  linePos[idx6 + 2] = z;
  linePos[idx6 + 3] = x + 0.05;
  linePos[idx6 + 4] = y;
  linePos[idx6 + 5] = z + 0.05;

  life[i] = Math.random() * 20;
  maxLife[i] = 60 + Math.random() * 60; // 60 to 120 frames lifespan

  // Compute flow velocity vector at this location (Indian Ocean Gyre / Monsoon flow)
  const normX = x / HALF_SIZE;
  const normZ = z / HALF_SIZE;
  const u = 0.45 * Math.sin(normX * Math.PI * 1.5) + 0.35;
  const v = -0.35 * Math.cos(normZ * Math.PI * 1.2) - 0.15;

  vel[i * 2] = u;
  vel[i * 2 + 1] = v;
}

// Mock ocean data service.
// -----------------------------------------------------------------------------
// All synthetic demonstration data for the OceanVision 3D prototype flows
// through this module. Nothing here is real INCOIS data.
//
// This service is kept as a development fallback while the FastAPI backend
// is being integrated. The exported function signatures should remain stable
// so the React layer can switch between mock and real data without changes.
// -----------------------------------------------------------------------------

import type {
  CurrentVector,
  OceanGrid,
  Observation,
  ProfilePoint,
  Region,
  RegionId,
} from '@/types/ocean';

import {
  DEPTH_LEVELS,
  TIME_STEPS,
  VARIABLE_CONFIG,
} from '@/utils/oceanConfig';


// ── Ocean grid ────────────────────────────────────────────────────────────────

export const OCEAN_GRID: OceanGrid = {
  latMin: -20,
  latMax: 30,
  lonMin: 40,
  lonMax: 100,
  nlats: 26,
  nlons: 31,
  depths: DEPTH_LEVELS,
};


// ── Regions ───────────────────────────────────────────────────────────────────

export const REGIONS: Record<RegionId, Region> = {
  'arabian-sea': {
    id: 'arabian-sea',
    label: 'Arabian Sea',
    center: [18, 68],
    bounds: {
      latMin: 8,
      latMax: 28,
      lonMin: 58,
      lonMax: 78,
    },
  },

  'bay-of-bengal': {
    id: 'bay-of-bengal',
    label: 'Bay of Bengal',
    center: [16, 88],
    bounds: {
      latMin: 5,
      latMax: 27,
      lonMin: 80,
      lonMax: 95,
    },
  },

  'indian-ocean': {
    id: 'indian-ocean',
    label: 'Indian Ocean',
    center: [-5, 75],
    bounds: {
      latMin: -18,
      latMax: 12,
      lonMin: 60,
      lonMax: 92,
    },
  },
};


// ── Deterministic pseudo-random helpers ───────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;

  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(
      a ^ (a >>> 15),
      1 | a,
    );

    t = (
      t +
      Math.imul(
        t ^ (t >>> 7),
        61 | t,
      )
    ) ^ t;

    return (
      (t ^ (t >>> 14)) >>> 0
    ) / 4294967296;
  };
}


function hashLatLon(
  lat: number,
  lon: number,
): number {
  const value =
    Math.sin(
      lat * 12.9898 +
      lon * 78.233,
    ) * 43758.5453;

  return value - Math.floor(value);
}


// ── Synthetic ocean field ─────────────────────────────────────────────────────

function baseField(
  lat: number,
  lon: number,
  depth: number,
  variable:
    | 'temperature'
    | 'salinity'
    | 'chlorophyll',
): number {
  const latNorm =
    (lat - OCEAN_GRID.latMin) /
    (OCEAN_GRID.latMax - OCEAN_GRID.latMin);

  const lonNorm =
    (lon - OCEAN_GRID.lonMin) /
    (OCEAN_GRID.lonMax - OCEAN_GRID.lonMin);

  const depthFactor =
    Math.min(1, Math.max(0, depth / 2000));


  if (variable === 'temperature') {
    const surface =
      12 +
      20 * latNorm +
      4 * Math.sin(
        lonNorm * Math.PI * 2,
      );

    return (
      surface -
      18 * depthFactor +
      (hashLatLon(lat, lon) - 0.5) * 1.5
    );
  }


  if (variable === 'salinity') {
    return (
      34 +
      1.8 * latNorm +
      0.8 * Math.sin(
        lonNorm * Math.PI,
      ) +
      0.4 * depthFactor
    );
  }


  // Chlorophyll is higher near the edges/coastal areas
  // and decreases with depth.
  const coast =
    Math.max(
      0,
      1 -
        Math.min(
          latNorm,
          1 - latNorm,
          lonNorm,
          1 - lonNorm,
        ) * 4,
    );

  return Math.max(
    0,
    0.2 +
      1.6 *
        coast *
        (1 - depthFactor) +
      (hashLatLon(lat, lon) - 0.5) *
        0.3,
  );
}


// ── Grid schemas ─────────────────────────────────────────────────────────────

export interface GridPoint {
  lat: number;
  lon: number;
  depth: number;
  temperature: number;
  salinity: number;
  chlorophyll: number;
}


export interface GridSlice {
  nlats: number;
  nlons: number;
  points: GridPoint[];
}


// ── Field slice ───────────────────────────────────────────────────────────────
// FUTURE BACKEND:
// GET /api/field?variable=temperature&depth=200&time=0

export async function getFieldSlice(
  variable:
    | 'temperature'
    | 'salinity'
    | 'chlorophyll',
  depth: number,
  timeIndex: number,
): Promise<GridSlice> {
  const { nlats, nlons } = OCEAN_GRID;

  const points: GridPoint[] = [];

  const safeTimeIndex =
    Math.max(
      0,
      Math.min(
        timeIndex,
        TIME_STEPS.length - 1,
      ),
    );

  const timePhase =
    (safeTimeIndex / TIME_STEPS.length) *
    Math.PI *
    2;


  for (let i = 0; i < nlats; i++) {
    for (let j = 0; j < nlons; j++) {

      const lat =
        OCEAN_GRID.latMin +
        (i / (nlats - 1)) *
          (
            OCEAN_GRID.latMax -
            OCEAN_GRID.latMin
          );

      const lon =
        OCEAN_GRID.lonMin +
        (j / (nlons - 1)) *
          (
            OCEAN_GRID.lonMax -
            OCEAN_GRID.lonMin
          );


      const temperature =
        baseField(
          lat,
          lon,
          depth,
          'temperature',
        ) +
        Math.sin(
          timePhase +
          lon * 0.1,
        ) * 0.6;


      const salinity =
        baseField(
          lat,
          lon,
          depth,
          'salinity',
        ) +
        Math.cos(
          timePhase +
          lat * 0.1,
        ) * 0.15;


      const chlorophyll =
        baseField(
          lat,
          lon,
          depth,
          'chlorophyll',
        ) +
        Math.sin(timePhase) * 0.1;


      points.push({
        lat,
        lon,
        depth,
        temperature,
        salinity,
        chlorophyll:
          Math.max(
            0,
            chlorophyll,
          ),
      });
    }
  }


  // Keep the parameter in the public API because the
  // frontend uses it to request a selected variable.
  void variable;

  return {
    nlats,
    nlons,
    points,
  };
}


// ── Current vectors ───────────────────────────────────────────────────────────
// FUTURE BACKEND:
// GET /api/currents?depth=200&time=0&density=medium

export async function getCurrents(
  depth: number,
  timeIndex: number,
  density:
    | 'low'
    | 'medium'
    | 'high' = 'medium',
): Promise<CurrentVector[]> {

  const step =
    density === 'low'
      ? 5
      : density === 'medium'
        ? 3
        : 2;


  const vectors: CurrentVector[] = [];

  const safeTimeIndex =
    Math.max(
      0,
      Math.min(
        timeIndex,
        TIME_STEPS.length - 1,
      ),
    );


  const timePhase =
    (safeTimeIndex / TIME_STEPS.length) *
    Math.PI *
    2;

  const timestamp =
    TIME_STEPS[
      safeTimeIndex
    ].timestamp;


  const depthFactor =
    Math.max(
      0,
      1 - depth / 3000,
    );


  for (
    let i = 0;
    i < OCEAN_GRID.nlats;
    i += step
  ) {
    for (
      let j = 0;
      j < OCEAN_GRID.nlons;
      j += step
    ) {

      const lat =
        OCEAN_GRID.latMin +
        (i / (OCEAN_GRID.nlats - 1)) *
          (
            OCEAN_GRID.latMax -
            OCEAN_GRID.latMin
          );


      const lon =
        OCEAN_GRID.lonMin +
        (j / (OCEAN_GRID.nlons - 1)) *
          (
            OCEAN_GRID.lonMax -
            OCEAN_GRID.lonMin
          );


      const latNorm =
        (lat - OCEAN_GRID.latMin) /
        (
          OCEAN_GRID.latMax -
          OCEAN_GRID.latMin
        );


      const lonNorm =
        (lon - OCEAN_GRID.lonMin) /
        (
          OCEAN_GRID.lonMax -
          OCEAN_GRID.lonMin
        );


      const u =
        0.4 *
        Math.sin(
          lonNorm *
            Math.PI *
            2 +
            timePhase,
        ) *
        depthFactor;


      const v =
        0.4 *
        Math.cos(
          latNorm *
            Math.PI *
            2 +
            timePhase,
        ) *
        depthFactor;


      vectors.push({
        latitude: lat,
        longitude: lon,
        depth,
        u,
        v,
        timestamp,
      });
    }
  }


  return vectors;
}


// ── Observation seeds ─────────────────────────────────────────────────────────

const ARGO_SEEDS: Array<{
  id: string;
  lat: number;
  lon: number;
  maxDepth: number;
}> = [
  {
    id: 'ARGO-2901',
    lat: 14.5,
    lon: 67.0,
    maxDepth: 2000,
  },
  {
    id: 'ARGO-2902',
    lat: 3.2,
    lon: 78.5,
    maxDepth: 1500,
  },
  {
    id: 'ARGO-2903',
    lat: 18.8,
    lon: 89.2,
    maxDepth: 2000,
  },
  {
    id: 'ARGO-2904',
    lat: -8.4,
    lon: 71.0,
    maxDepth: 1800,
  },
  {
    id: 'ARGO-2905',
    lat: 22.1,
    lon: 64.5,
    maxDepth: 1200,
  },
];


const GLIDER_SEEDS: Array<{
  id: string;
  lat: number;
  lon: number;
  maxDepth: number;
}> = [
  {
    id: 'GLD-SEA-01',
    lat: 16.0,
    lon: 70.0,
    maxDepth: 1000,
  },
  {
    id: 'GLD-BOB-02',
    lat: 13.5,
    lon: 84.0,
    maxDepth: 900,
  },
  {
    id: 'GLD-IO-03',
    lat: -2.0,
    lon: 76.0,
    maxDepth: 800,
  },
];


// ── Observation builder ───────────────────────────────────────────────────────

function buildObservation(
  seed: {
    id: string;
    lat: number;
    lon: number;
    maxDepth: number;
  },
  type: 'argo' | 'glider',
  timeIndex: number,
): Observation {

  const safeTimeIndex =
    Math.max(
      0,
      Math.min(
        timeIndex,
        TIME_STEPS.length - 1,
      ),
    );


  const timestamp =
    TIME_STEPS[
      safeTimeIndex
    ].timestamp;


  const surfaceTemperature =
    baseField(
      seed.lat,
      seed.lon,
      0,
      'temperature',
    );


  const salinity =
    baseField(
      seed.lat,
      seed.lon,
      50,
      'salinity',
    );


  const chlorophyll =
    baseField(
      seed.lat,
      seed.lon,
      20,
      'chlorophyll',
    );


  // Use a seed derived from the observation and
  // time so repeated calls remain deterministic.
  const seedValue =
    Math.floor(
      (
        Math.abs(seed.lat) * 1000 +
        Math.abs(seed.lon) * 100 +
        safeTimeIndex * 7919
      ),
    );


  const random =
    mulberry32(seedValue);


  const jitter =
    (random() - 0.5) * 0.6;


  return {
    id: seed.id,
    type,
    latitude: seed.lat,
    longitude: seed.lon,
    timestamp,
    depth: 10,
    temperature:
      surfaceTemperature +
      jitter,
    salinity,
    chlorophyll:
      Math.max(
        0,
        chlorophyll,
      ),
    maxDepth: seed.maxDepth,
  };
}


// ── Observations ──────────────────────────────────────────────────────────────
// FUTURE BACKEND:
// GET /api/observations?type=argo&time=0

export async function getObservations(
  timeIndex: number,
): Promise<Observation[]> {

  const argo =
    ARGO_SEEDS.map(
      (seed) =>
        buildObservation(
          seed,
          'argo',
          timeIndex,
        ),
    );


  const gliders =
    GLIDER_SEEDS.map(
      (seed) =>
        buildObservation(
          seed,
          'glider',
          timeIndex,
        ),
    );


  return [
    ...argo,
    ...gliders,
  ];
}


// ── Profile ───────────────────────────────────────────────────────────────────
// FUTURE BACKEND:
// GET /api/profile?id=ARGO-2901&variable=temperature

export async function getProfile(
  obsId: string,
  variable:
    | 'temperature'
    | 'salinity'
    | 'chlorophyll',
): Promise<{
  observation: ProfilePoint[];
  model: ProfilePoint[];
}> {

  const seed =
    ARGO_SEEDS.find(
      (item) => item.id === obsId,
    ) ??
    GLIDER_SEEDS.find(
      (item) => item.id === obsId,
    ) ??
    ARGO_SEEDS[0];


  const isArgo =
    ARGO_SEEDS.some(
      (item) => item.id === obsId,
    );


  const observation: ProfilePoint[] = [];
  const model: ProfilePoint[] = [];


  const levels = isArgo
    ? [
        0,
        50,
        100,
        200,
        400,
        600,
        800,
        1000,
        1200,
        1500,
        1800,
        2000,
      ]
    : [
        0,
        25,
        50,
        100,
        200,
        300,
        500,
        700,
        900,
      ];


  for (const depth of levels) {

    if (depth > seed.maxDepth) {
      break;
    }


    const temperature =
      baseField(
        seed.lat,
        seed.lon,
        depth,
        'temperature',
      );


    const salinity =
      baseField(
        seed.lat,
        seed.lon,
        depth,
        'salinity',
      );


    const chlorophyll =
      baseField(
        seed.lat,
        seed.lon,
        depth,
        'chlorophyll',
      );


    model.push({
      depth,
      temperature,
      salinity,
      chlorophyll:
        Math.max(
          0,
          chlorophyll,
        ),
    });


    const noise =
      hashLatLon(
        seed.lat +
          depth * 0.01,
        seed.lon,
      ) - 0.5;


    observation.push({
      depth,
      temperature:
        temperature +
        noise * 0.8,
      salinity:
        salinity +
        noise * 0.05,
      chlorophyll:
        Math.max(
          0,
          chlorophyll +
            noise * 0.15,
        ),
    });
  }


  // The frontend currently requests a profile for a selected
  // variable but expects all three values in each ProfilePoint.
  void variable;


  return {
    observation,
    model,
  };
}


// ── Statistics ────────────────────────────────────────────────────────────────

export function computeStats(
  obs: ProfilePoint[],
  model: ProfilePoint[],
  variable:
    | 'temperature'
    | 'salinity'
    | 'chlorophyll',
): {
  rmse: number;
  meanError: number;
  count: number;
} {

  const count =
    Math.min(
      obs.length,
      model.length,
    );


  if (count === 0) {
    return {
      rmse: 0,
      meanError: 0,
      count: 0,
    };
  }


  let sumSquaredError = 0;
  let sumError = 0;


  for (let i = 0; i < count; i++) {

    const difference =
      obs[i][variable] -
      model[i][variable];


    sumSquaredError +=
      difference *
      difference;


    sumError +=
      difference;
  }


  return {
    rmse: Math.sqrt(
      sumSquaredError / count,
    ),
    meanError:
      sumError / count,
    count,
  };
}


// ── Variable range ────────────────────────────────────────────────────────────

export function variableRange(
  variable:
    | 'temperature'
    | 'salinity'
    | 'chlorophyll',
) {
  return VARIABLE_CONFIG[
    variable
  ].range;
}

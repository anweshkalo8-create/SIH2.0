// Geographic helpers shared by the 3D scene and the disaster map.

import type { OceanGrid } from '@/types/ocean';

export const SCENE_SIZE = 60; // three.js units across the ocean plane
export const SCENE_DEPTH = 24; // three.js units for max vertical exaggeration

export function lonToX(lon: number, grid: OceanGrid): number {
  const t = (lon - grid.lonMin) / (grid.lonMax - grid.lonMin);
  return (t - 0.5) * SCENE_SIZE;
}

export function latToZ(lat: number, grid: OceanGrid): number {
  const t = (lat - grid.latMin) / (grid.latMax - grid.latMin);
  return (0.5 - t) * SCENE_SIZE;
}

export function depthToY(depth: number, maxDepth: number, exaggeration: number): number {
  const t = depth / maxDepth;
  return -t * SCENE_DEPTH * exaggeration;
}

export function formatLat(lat: number): string {
  const dir = lat >= 0 ? 'N' : 'S';
  return `${Math.abs(lat).toFixed(2)}° ${dir}`;
}

export function formatLon(lon: number): string {
  const dir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lon).toFixed(2)}° ${dir}`;
}

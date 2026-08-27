import * as THREE from 'three';
import type { OceanVariable } from '@/types/ocean';

/**
 * Procedural canvas textures and Bathymetry engine for the 3D Volumetric Ocean Model.
 * Domain: Longitude 40°E to 100°E, Latitude -20°S to +30°N.
 */

// Helper to compute distance from point (px, py) to segment (x1, y1)-(x2, y2) in degrees
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

/**
 * Scientifically modeled Bathymetric Depth function across the Indian Ocean (0 to 6500 meters).
 * Returns depth in meters (0 = sea level/land, 200m = shelf edge, ~4500m = abyssal plain, ~6400m = Java trench).
 */
export function getBathymetricDepth(lon: number, lat: number): number {
  if (isLandPoint(lon, lat)) return 0;

  // 1. Base Abyssal Plain depth across Indian Ocean basins
  let depth = 4500;

  // Regional basin depth adjustments
  if (lon < 65 && lat > 10) {
    depth = 4150; // Arabian Basin
  } else if (lon < 58 && lat <= 10 && lat >= -10) {
    depth = 4850; // Somali Basin
  } else if (lon >= 75 && lon <= 88 && lat <= 5 && lat >= -20) {
    depth = 4950; // Central Indian Basin
  } else if (lon > 90 && lat < -5) {
    depth = 5250; // Wharton Basin / Cocos Basin
  }

  // 2. Bengal Submarine Fan (sloping from head of Bay of Bengal towards equator)
  if (lon >= 81 && lon <= 92 && lat >= 5 && lat <= 21) {
    const fanFraction = (lat - 5) / 16; // 0 at 5°N, 1 at 21°N
    const fanDepth = 3900 - fanFraction * 2700; // 3900m in south to 1200m in north
    depth = Math.min(depth, fanDepth);
  }

  // 3. Continental Shelves (< 200m) & Continental Slopes (200 - 2500m)
  // Distance to Indian Subcontinent coastlines
  let minDistToCoast = 999;

  // Western India coast (Gujarat / Mumbai High / Konkan / Malabar)
  const westCoastDist = distToSegment(lon, lat, 68, 24, 77.5, 8.4);
  minDistToCoast = Math.min(minDistToCoast, westCoastDist);

  // Eastern India coast (Coromandel / Andhra / Odisha / Bengal)
  const eastCoastDist = distToSegment(lon, lat, 77.5, 8.4, 90, 22.5);
  minDistToCoast = Math.min(minDistToCoast, eastCoastDist);

  // Arabian Peninsula / Oman / Bab-el-Mandeb
  const arabiaDist = distToSegment(lon, lat, 45, 12, 60, 25);
  minDistToCoast = Math.min(minDistToCoast, arabiaDist);

  // Myanmar / Andaman coast
  const andamanCoastDist = distToSegment(lon, lat, 93, 14, 98, 10);
  minDistToCoast = Math.min(minDistToCoast, andamanCoastDist);

  // Sri Lanka coastal ring
  const sriLankaDist = Math.hypot(lon - 80.7, lat - 7.8);
  minDistToCoast = Math.min(minDistToCoast, sriLankaDist);

  // Apply Continental Shelf & Slope transition
  // Gujarat / Mumbai High has an exceptionally wide shelf (up to 2.5 degrees offshore)
  const isGujaratShelf = lon >= 68 && lon <= 73 && lat >= 18 && lat <= 23;
  const isBengalDelta = lon >= 86 && lon <= 91 && lat >= 20 && lat <= 22.5;
  const shelfThreshold = isGujaratShelf || isBengalDelta ? 1.8 : 0.8;
  const slopeThreshold = isGujaratShelf || isBengalDelta ? 3.5 : 2.2;

  if (minDistToCoast < shelfThreshold) {
    const t = minDistToCoast / shelfThreshold;
    const shelfDepth = 30 + t * 170; // 30m to 200m
    depth = Math.min(depth, shelfDepth);
  } else if (minDistToCoast < slopeThreshold) {
    const t = (minDistToCoast - shelfThreshold) / (slopeThreshold - shelfThreshold);
    const slopeDepth = 200 + Math.pow(t, 1.4) * 2300; // 200m to 2500m
    depth = Math.min(depth, slopeDepth);
  }

  // 4. Submarine Ridges & Underwater Plateaus (Elevated Seafloor)

  // (A) Ninety East Ridge: ~88.5°E to 90.0°E from 20°S to 10°N
  if (lat >= -20 && lat <= 10) {
    const dLon = Math.abs(lon - 89.0);
    if (dLon < 2.0) {
      const ridgeProfile = Math.exp(-(dLon * dLon) / 0.7); // Gaussian cross-section
      const ridgeHeight = 2700 * ridgeProfile; // rises from 4900m to ~2200m depth
      depth -= ridgeHeight;
    }
  }

  // (B) Chagos-Laccadive Plateau: ~71.5°E to 73.5°E from -8°S to +14°N
  if (lat >= -8 && lat <= 14) {
    const dLon = Math.abs(lon - 72.8);
    if (dLon < 2.2) {
      const plateauProfile = Math.exp(-(dLon * dLon) / 0.8);
      // Extra shallow around Lakshadweep (10-12°N) and Maldives (0-6°N)
      const isAtoll = (lat >= 9 && lat <= 12) || (lat >= 0 && lat <= 6);
      const plateauHeight = (isAtoll ? 3600 : 2900) * plateauProfile;
      depth -= plateauHeight;
    }
  }

  // (C) Carlsberg Ridge: NW-SE mid-ocean spreading ridge from (57°E, 10°N) to (67°E, 2°N)
  const carlsbergDist = distToSegment(lon, lat, 57, 10, 67, 2);
  if (carlsbergDist < 2.5) {
    const ridgeProfile = Math.exp(-(carlsbergDist * carlsbergDist) / 1.1);
    const ridgeHeight = 2200 * ridgeProfile; // rises from 4400m to ~2200m
    depth -= ridgeHeight;
  }

  // (D) Central Indian Ridge (CIR): Equator down to 20°S along ~67.5°E to 70.0°E
  const cirDist = distToSegment(lon, lat, 67, 2, 69.5, -20);
  if (cirDist < 2.5) {
    const ridgeProfile = Math.exp(-(cirDist * cirDist) / 1.2);
    const ridgeHeight = 2000 * ridgeProfile; // rises to ~2500m
    depth -= ridgeHeight;
  }

  // (E) Mascarene Plateau & Seychelles Bank: SW corner around (54-60°E, -18 to -4°S)
  if (lon >= 53 && lon <= 61 && lat >= -18 && lat <= -4) {
    const mascDist = Math.hypot((lon - 57) * 0.8, lat - -10);
    if (mascDist < 4.0) {
      const mascProfile = Math.exp(-(mascDist * mascDist) / 4.5);
      depth -= 2800 * mascProfile; // rises to 800 - 1500m
    }
  }

  // 5. Deep Subduction Trench: Java / Sunda Trench along Indonesian Arc
  const trenchDist1 = distToSegment(lon, lat, 92, 6, 96, 0);
  const trenchDist2 = distToSegment(lon, lat, 96, 0, 100, -8);
  const javaTrenchDist = Math.min(trenchDist1, trenchDist2);
  if (javaTrenchDist < 1.6) {
    const trenchProfile = Math.exp(-(javaTrenchDist * javaTrenchDist) / 0.5);
    const trenchPlunge = 1600 * trenchProfile; // plunges to 6100 - 6500m
    depth += trenchPlunge;
  }

  // 6. Natural abyssal hill micro-relief (fine geological harmonics)
  const microRelief =
    Math.sin(lon * 2.5 + lat * 1.8) * 80 +
    Math.cos(lon * 4.2 - lat * 3.1) * 50 +
    Math.sin(lon * 8.5 + lat * 7.2) * 25;
  depth += microRelief;

  // Clamp depth to realistic marine bounds [20, 6500] meters
  return Math.max(20, Math.min(6500, depth));
}

/**
 * GEBCO / NOAA Oceanographic Bathymetric Color Mapping.
 * Maps depth in meters [0, 6500] to RGB.
 */
export function getBathymetryRGB(depth: number): [number, number, number] {
  if (depth <= 0) return [38, 55, 45]; // Land olive dark green

  if (depth < 200) {
    // Continental Shelf: Shallow turquoise / emerald teal (0 to 200m)
    const t = depth / 200;
    const r = Math.round(94 + t * (45 - 94));
    const g = Math.round(234 + t * (180 - 234));
    const b = Math.round(212 + t * (230 - 212));
    return [r, g, b];
  } else if (depth < 1000) {
    // Upper Continental Slope: Vibrant Sky Blue / Cyan (200 to 1000m)
    const t = (depth - 200) / 800;
    const r = Math.round(45 + t * (14 - 45));
    const g = Math.round(180 + t * (130 - 180));
    const b = Math.round(230 + t * (235 - 230));
    return [r, g, b];
  } else if (depth < 2500) {
    // Mid-Ocean Ridges & Submarine Plateaus: Cobalt Blue (1000 to 2500m)
    const t = (depth - 1000) / 1500;
    const r = Math.round(14 + t * (25 - 14));
    const g = Math.round(130 + t * (75 - 130));
    const b = Math.round(235 + t * (210 - 235));
    return [r, g, b];
  } else if (depth < 4000) {
    // Lower Continental Rise & Deep Basins: Deep Royal Navy (2500 to 4000m)
    const t = (depth - 2500) / 1500;
    const r = Math.round(25 + t * (14 - 25));
    const g = Math.round(75 + t * (35 - 75));
    const b = Math.round(210 + t * (140 - 210));
    return [r, g, b];
  } else if (depth < 5200) {
    // Abyssal Plain: Midnight Abyss Navy (4000 to 5200m)
    const t = (depth - 4000) / 1200;
    const r = Math.round(14 + t * (6 - 14));
    const g = Math.round(35 + t * (18 - 35));
    const b = Math.round(140 + t * (75 - 140));
    return [r, g, b];
  } else {
    // Ultra-deep Subduction Trenches: Deep Violet / Dark Indigo (> 5200m)
    const t = Math.min(1, (depth - 5200) / 1300);
    const r = Math.round(6 + t * (28 - 6));
    const g = Math.round(18 + t * (10 - 18));
    const b = Math.round(75 + t * (55 - 75));
    return [r, g, b];
  }
}

export function getThermalColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  let r = 0, g = 0, b = 0;
  
  if (clamped < 0.125) {
    r = 0; g = 0; b = 0.5 + clamped * 4;
  } else if (clamped < 0.375) {
    const k = (clamped - 0.125) / 0.25;
    r = 0; g = k; b = 1;
  } else if (clamped < 0.625) {
    const k = (clamped - 0.375) / 0.25;
    r = k; g = 1; b = 1 - k;
  } else if (clamped < 0.875) {
    const k = (clamped - 0.625) / 0.25;
    r = 1; g = 1 - k * 0.8; b = 0;
  } else {
    const k = (clamped - 0.875) / 0.125;
    r = 1 - k * 0.25; g = 0.2 * (1 - k); b = 0;
  }

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/**
 * Top Surface Sea Surface Temperature (SST) & Variable Texture with
 * integrated Bathymetric Isobaths and Continental Shelf Overlays.
 */
export function createTopSurfaceTexture(
  variable: OceanVariable,
  showContours: boolean = true,
  showBathymetry: boolean = true,
  timePhase: number = 0
): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Domain: Lat -20 to 30 (y: 0 to 1), Lon 40 to 100 (x: 0 to 1)
  for (let py = 0; py < height; py++) {
    const v = 1 - py / height; // lat 0 to 1 (South to North)
    const lat = -20 + v * 50;

    for (let px = 0; px < width; px++) {
      const u = px / width; // lon 0 to 1 (West to East)
      const lon = 40 + u * 60;
      const idx = (py * width + px) * 4;

      const isLand = isLandPoint(lon, lat);

      if (isLand) {
        const landShade = Math.sin(px * 0.05) * Math.cos(py * 0.05) * 15;
        data[idx] = Math.min(255, 38 + landShade);
        data[idx + 1] = Math.min(255, 55 + landShade);
        data[idx + 2] = Math.min(255, 45 + landShade);
        data[idx + 3] = 255;
        continue;
      }

      // Compute Sea Surface Heatmap Field
      const eqDist = 1 - Math.abs(lat - 5) / 35;
      const eastGrad = u * 0.25;
      const wave = Math.sin(u * 8 + timePhase) * Math.cos(v * 6) * 0.08;
      const eddy = Math.sin(u * 18 + timePhase * 1.5) * Math.cos(v * 14) * 0.04;
      
      let normVal = Math.max(0, Math.min(1, eqDist * 0.8 + eastGrad + wave + eddy));

      // Upwelling cooling zone off Somalia / Arabian coast
      if (lon < 60 && lat > 8 && lat < 22) {
        normVal = Math.max(0, normVal - 0.25);
      }

      // 1. Variable Temperature Contours
      let contourFactor = 1.0;
      if (showContours) {
        const contourLevel = (normVal * 10) % 1.0;
        if (contourLevel < 0.06 || contourLevel > 0.94) {
          contourFactor = 0.72;
        }
      }

      const rgb = getThermalRGB(normVal);
      let r = Math.round(rgb[0] * contourFactor);
      let g = Math.round(rgb[1] * contourFactor);
      let b = Math.round(rgb[2] * contourFactor);

      // 2. Bathymetric Overlay: Shelf shading and underwater isobaths
      if (showBathymetry) {
        const bDepth = getBathymetricDepth(lon, lat);

        // Continental Shelf Highlight (< 200m depth)
        if (bDepth <= 200) {
          // Blend with shallow turquoise glow
          const shelfBlend = 0.28 * (1 - bDepth / 200);
          r = Math.round(r * (1 - shelfBlend) + 56 * shelfBlend);
          g = Math.round(g * (1 - shelfBlend) + 189 * shelfBlend);
          b = Math.round(b * (1 - shelfBlend) + 248 * shelfBlend);
        }

        // 200m Continental Shelf Break Isobath Line
        if (Math.abs(bDepth - 200) < 35) {
          r = Math.min(255, r + 90);
          g = Math.min(255, g + 130);
          b = Math.min(255, b + 160);
        }

        // 1000m Upper Slope Isobath Line
        if (Math.abs(bDepth - 1000) < 45) {
          r = Math.round(r * 0.7 + 40);
          g = Math.round(g * 0.7 + 100);
          b = Math.round(b * 0.7 + 220);
        }

        // 2500m Mid-Ocean Ridge / Plateau Isobath Line
        if (Math.abs(bDepth - 2500) < 55) {
          r = Math.round(r * 0.75 + 30);
          g = Math.round(g * 0.75 + 70);
          b = Math.round(b * 0.75 + 180);
        }

        // 4000m Abyssal Plain Boundary Isobath Line
        if (Math.abs(bDepth - 4000) < 65) {
          r = Math.round(r * 0.85);
          g = Math.round(g * 0.85);
          b = Math.round(b * 0.85 + 30);
        }
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  drawCoastlineBorders(ctx, width, height);

  // When Bathymetry is enabled, draw isobath annotations and bathymetric markers
  if (showBathymetry) {
    drawBathymetryAnnotations(ctx, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Creates high-resolution 3D Seafloor Bathymetry Texture with GEBCO hypsometric tints,
 * directional hillshading, isobath depth contours, and major submarine feature labels.
 */
export function createBathymetrySeafloorTexture(showLabels: boolean = true): THREE.CanvasTexture {
  const width = 1024;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  // Sun illumination vector for Hillshading relief (from North-West: dx < 0, dy < 0)
  const sunX = -0.6;
  const sunY = -0.6;
  const sunZ = 0.52;
  const sunLen = Math.hypot(sunX, sunY, sunZ);
  const nxSun = sunX / sunLen;
  const nySun = sunY / sunLen;
  const nzSun = sunZ / sunLen;

  for (let py = 0; py < height; py++) {
    const v = 1 - py / height;
    const lat = -20 + v * 50;

    for (let px = 0; px < width; px++) {
      const u = px / width;
      const lon = 40 + u * 60;
      const idx = (py * width + px) * 4;

      const isLand = isLandPoint(lon, lat);
      if (isLand) {
        const landShade = Math.sin(px * 0.05) * Math.cos(py * 0.05) * 10;
        data[idx] = Math.min(255, 25 + landShade);
        data[idx + 1] = Math.min(255, 38 + landShade);
        data[idx + 2] = Math.min(255, 30 + landShade);
        data[idx + 3] = 255;
        continue;
      }

      const centerDepth = getBathymetricDepth(lon, lat);

      // Compute local slope gradient for Hillshading
      const dLon = 0.15;
      const dLat = 0.15;
      const depthE = getBathymetricDepth(lon + dLon, lat);
      const depthW = getBathymetricDepth(lon - dLon, lat);
      const depthN = getBathymetricDepth(lon, lat + dLat);
      const depthS = getBathymetricDepth(lon, lat - dLat);

      const dzdx = (depthE - depthW) / (2 * dLon * 111000);
      const dzdy = (depthN - depthS) / (2 * dLat * 111000);

      // Surface normal vector
      const normLen = Math.hypot(-dzdx * 450, -dzdy * 450, 1.0);
      const nx = (-dzdx * 450) / normLen;
      const ny = (-dzdy * 450) / normLen;
      const nz = 1.0 / normLen;

      // Hillshade factor (Lambertian diffuse + ambient)
      const dot = Math.max(0, nx * nxSun + ny * nySun + nz * nzSun);
      const hillshade = 0.65 + dot * 0.65;

      // Base GEBCO Bathymetric color
      const baseRgb = getBathymetryRGB(centerDepth);

      // Apply Isobath contour rings (200m, 1000m, 2000m, 3000m, 4000m, 5000m)
      let isobathFactor = 1.0;
      const isobaths = [200, 1000, 2000, 3000, 4000, 5000];
      for (const iso of isobaths) {
        if (Math.abs(centerDepth - iso) < 30) {
          isobathFactor = 1.35; // Luminous isobath line
          break;
        }
      }

      data[idx] = Math.min(255, Math.round(baseRgb[0] * hillshade * isobathFactor));
      data[idx + 1] = Math.min(255, Math.round(baseRgb[1] * hillshade * isobathFactor));
      data[idx + 2] = Math.min(255, Math.round(baseRgb[2] * hillshade * isobathFactor));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  drawCoastlineBorders(ctx, width, height);

  if (showLabels) {
    drawSeafloorBathymetricLabels(ctx, width, height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

export function createSideDepthTexture(
  isEastWest: boolean = true,
  depthExaggeration: number = 1.0,
  showBathymetry: boolean = true
): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  for (let py = 0; py < height; py++) {
    const depthFrac = py / height; // 0 (surface) to 1 (5500m abyssal depth)
    const meterDepth = depthFrac * 5500;

    for (let px = 0; px < width; px++) {
      const u = px / width;
      const idx = (py * width + px) * 4;

      const surfVal = 0.75 + Math.sin(u * Math.PI) * 0.2;
      const tempFactor = surfVal * Math.exp(-depthFrac * 4.5);
      const internalWave = Math.sin(u * 12 + depthFrac * 20) * 0.015 * Math.exp(-depthFrac * 2);
      const val = Math.max(0, Math.min(1, tempFactor + internalWave));
      const abyssalDark = depthFrac > 0.85 ? (1 - (depthFrac - 0.85) / 0.15 * 0.4) : 1.0;

      const rgb = getThermalRGB(val);
      data[idx] = Math.round(rgb[0] * abyssalDark);
      data[idx + 1] = Math.round(rgb[1] * abyssalDark);
      data[idx + 2] = Math.round(rgb[2] * abyssalDark);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Depth stratum grid lines & isobaths on side walls
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  const depthLabels = ['200m (Shelf)', '1000m', '2000m', '3000m', '4000m', '5000m'];
  const depthSteps = [200 / 5500, 1000 / 5500, 2000 / 5500, 3000 / 5500, 4000 / 5500, 5000 / 5500];

  depthSteps.forEach((frac, i) => {
    const y = frac * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    if (showBathymetry && i % 2 === 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.font = '10px monospace';
      ctx.fillText(depthLabels[i], 12, y - 4);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function getThermalRGB(t: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, t));
  let r = 0, g = 0, b = 0;
  if (clamped < 0.125) {
    r = 0; g = 0; b = 0.5 + clamped * 4;
  } else if (clamped < 0.375) {
    const k = (clamped - 0.125) / 0.25;
    r = 0; g = k; b = 1;
  } else if (clamped < 0.625) {
    const k = (clamped - 0.375) / 0.25;
    r = k; g = 1; b = 1 - k;
  } else if (clamped < 0.875) {
    const k = (clamped - 0.625) / 0.25;
    r = 1; g = 1 - k * 0.8; b = 0;
  } else {
    const k = (clamped - 0.875) / 0.125;
    r = 1 - k * 0.25; g = 0.2 * (1 - k); b = 0;
  }
  return [r * 255, g * 255, b * 255];
}

export function isLandPoint(lon: number, lat: number): boolean {
  // Indian Subcontinent triangular landmass
  if (lat >= 8.4 && lat <= 30 && lon >= 68 && lon <= 90) {
    const midLon = 78.5;
    const halfWidth = 1.2 + ((lat - 8.4) / 21.6) * 11.5;
    if (Math.abs(lon - midLon) < halfWidth) {
      if (lat > 20 && lat < 24 && lon < 73) return false; // Gulf of Khambhat ocean inlet
      return true;
    }
  }
  // Arabian Peninsula / Middle East
  if (lon < 58 && lat > 12) {
    if (lat > 14 + (lon - 45) * 0.6) return true;
  }
  // Indochina / Myanmar
  if (lon > 93 && lat > 14) {
    if (lat > 10 + (100 - lon) * 0.8) return true;
  }
  // Sri Lanka
  if (lat >= 5.9 && lat <= 9.8 && lon >= 79.5 && lon <= 81.8) return true;
  // Northern Land Boundary
  if (lat > 25 && (lon < 68 || lon > 89)) return true;

  return false;
}

function drawCoastlineBorders(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  const toCanvas = (lon: number, lat: number): [number, number] => [
    ((lon - 40) / 60) * width,
    (1 - (lat - -20) / 50) * height,
  ];

  const coast: Array<[number, number]> = [
    [68, 24], [70, 23], [72.8, 19], [74.8, 15], [76.2, 11], [77.5, 8.4],
    [78.5, 9.5], [80.3, 13.1], [82.5, 17], [85.5, 19.8], [88, 21.7], [90, 22.5]
  ];

  coast.forEach(([lon, lat], i) => {
    const [cx, cy] = toCanvas(lon, lat);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();
}

/**
 * Top Surface Bathymetry Annotations & Isobath Labels.
 */
function drawBathymetryAnnotations(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const toCanvas = (lon: number, lat: number): [number, number] => [
    ((lon - 40) / 60) * width,
    (1 - (lat - -20) / 50) * height,
  ];

  ctx.save();
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;

  const features = [
    { name: '200m Continental Shelf Edge', lon: 70.0, lat: 17.5 },
    { name: 'Carlsberg Ridge (-2100m)', lon: 61.5, lat: 6.0 },
    { name: 'Ninety East Ridge (-1950m)', lon: 89.2, lat: -4.0 },
    { name: 'Chagos-Laccadive Plateau', lon: 72.8, lat: 4.5 },
    { name: 'Java Trench (-6400m)', lon: 96.5, lat: -3.5 },
  ];

  features.forEach((f) => {
    const [x, y] = toCanvas(f.lon, f.lat);
    ctx.fillText(f.name, x, y);
  });

  ctx.restore();
}

/**
 * 3D Seafloor Bathymetric Feature Soundings & Geological Labels.
 */
function drawSeafloorBathymetricLabels(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const toCanvas = (lon: number, lat: number): [number, number] => [
    ((lon - 40) / 60) * width,
    (1 - (lat - -20) / 50) * height,
  ];

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6;

  const bathyLabels = [
    { name: 'CARLSBERG RIDGE', depth: '-2,100 m', lon: 61.5, lat: 6.5, color: '#67e8f9' },
    { name: 'NINETY EAST RIDGE', depth: '-1,950 m', lon: 89.2, lat: -5.0, color: '#67e8f9' },
    { name: 'CENTRAL INDIAN RIDGE', depth: '-2,400 m', lon: 68.5, lat: -12.0, color: '#38bdf8' },
    { name: 'CHAGOS-LACCADIVE RIDGE', depth: '-1,100 m', lon: 72.8, lat: 4.5, color: '#5eead4' },
    { name: 'SUNDA / JAVA TRENCH', depth: '-6,400 m (Deepest)', lon: 95.8, lat: -2.0, color: '#c084fc' },
    { name: 'ARABIAN BASIN', depth: '-4,150 m', lon: 64.0, lat: 15.0, color: '#93c5fd' },
    { name: 'BENGAL FAN', depth: '-3,200 m', lon: 86.5, lat: 12.0, color: '#93c5fd' },
    { name: 'SOMALI BASIN', depth: '-4,850 m', lon: 53.0, lat: 0.0, color: '#93c5fd' },
    { name: 'CENTRAL INDIAN BASIN', depth: '-4,950 m', lon: 81.5, lat: -10.0, color: '#93c5fd' },
  ];

  bathyLabels.forEach((lbl) => {
    const [x, y] = toCanvas(lbl.lon, lbl.lat);

    ctx.fillStyle = lbl.color;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl.name, x - 50, y);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '10px monospace';
    ctx.fillText(lbl.depth, x - 50, y + 14);
  });

  ctx.restore();
}

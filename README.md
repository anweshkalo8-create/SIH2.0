# OceanVerse — Interactive Ocean Model & Observation Visualization Platform

> **Smart India Hackathon (SIH)**  
> **Theme:** Smart Automation  
> **Ministry / Department:** Ministry of Earth Sciences (MoES) · Indian National Centre for Ocean Information Services (INCOIS)  
> **Category:** Software  

---

## 🌊 Overview

**OceanVerse** is a web-based, interactive 3D platform designed to explore and visualize numerical ocean model fields (Temperature, Salinity, Current Velocity, Chlorophyll-a) alongside in-situ oceanographic observations from **Argo Floats** and **Underwater Gliders**.

Traditional ocean data (NetCDF, GRIB, ASCII) requires specialized desktop GIS / scientific tools (such as Ferret, ODV, ParaView). **OceanVision 3D** brings volumetric depth slicing, particle/vector drift analysis, and model-versus-observation comparison directly into modern web browsers.

---

## ✨ Key Capabilities

1. **Interactive 3D Ocean Basin & Volumetric Slicing**:
   - 3D ocean volume with vertical exaggeration controls and depth slicing (0m to 2000m).
   - Real-time color palette mapping (Thermal, Haline, Velocity, Chlorophyll).
   - Orbit, zoom, pan, and orientation gizmo powered by Three.js & React Three Fiber.

2. **In-Situ Observation Markers (Argo & Gliders)**:
   - Clickable 3D markers for active Argo profiling floats and underwater Gliders across the Arabian Sea, Bay of Bengal, and Indian Ocean.
   - Comprehensive metadata inspector (coordinates, surface temp, salinity, max operating depth).

3. **Model vs. Observation Profile Comparison**:
   - Vertical CTD profile charts (Depth vs Parameter) rendered using Recharts.
   - Statistical verification overlay with real-time **RMSE (Root Mean Square Error)** and **Mean Error** computations.

4. **Marine Disaster & Search-and-Rescue (SAR) Support**:
   - Depth-dependent current vector visualization with adjustable density.
   - Real-time regional drift velocity and direction analysis for maritime emergency forecasting.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **3D Graphics & WebGL**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling & UI Components**: Tailwind CSS, Lucide React
- **Data Visualizations**: Recharts
- **Architecture**: Modular service layer designed for drop-in REST integration with a FastAPI + xarray NetCDF backend.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or higher recommended)
- npm or pnpm / yarn

### Installation & Run

1. Navigate to the project directory:
   ```bash
   cd SIH-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🗺️ Future Backend Integration Roadmap

The application's `services/mockOceanService.ts` contains async signatures mirroring planned FastAPI REST endpoints:
- `GET /api/field?variable={var}&depth={depth}&time={time}`
- `GET /api/currents?depth={depth}&time={time}&density={density}`
- `GET /api/observations?time={time}`
- `GET /api/profile?id={obsId}&variable={var}`

By swapping `mockOceanService.ts` with real API calls, the frontend seamlessly connects to live INCOIS OGC / NetCDF data pipelines with zero UI refactoring required.

---

## 📄 License & Disclaimer

*This prototype is built for demonstration and hackathon evaluation. Synthetic data is used for visualization demonstration unless connected to live INCOIS data services.*

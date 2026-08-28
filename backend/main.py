"""
OceanVerse Backend — FastAPI
Serves ocean model data, observation points, and user management
for the MoES / INCOIS interactive 3D visualization platform.

Routers map directly to the FUTURE BACKEND comments in:
  src/services/mockOceanService.ts
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import observations, models, layers, users, export, field

app = FastAPI(
    title="OceanVerse API",
    description="Backend for the Interactive 3D Ocean Model & Observation Visualization Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ocean-verse-delta.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core endpoints used by the frontend mock replacement
app.include_router(field.router,        prefix="/api",              tags=["Field & Currents"])
app.include_router(observations.router, prefix="/api/observations", tags=["Observations"])

# Supporting endpoints
app.include_router(models.router,  prefix="/api/models",  tags=["Ocean Models"])
app.include_router(layers.router,  prefix="/api/layers",  tags=["Map Layers"])
app.include_router(users.router,   prefix="/api/users",   tags=["Users"])
app.include_router(export.router,  prefix="/api/export",  tags=["Export"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "OceanVerse API v1.0"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}

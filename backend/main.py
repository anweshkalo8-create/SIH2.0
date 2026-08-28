import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import export, field, layers, models, observations, users


# ─────────────────────────────────────────────────────────────────────────────
# Application
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="OceanVision API",
    description="FastAPI backend for the OceanVision 3D ocean data platform.",
    version="1.0.0",
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────────────────────

frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "http://localhost:5173",
)

allowed_origins = [
    origin.strip()
    for origin in frontend_origin.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────────────────────

app.include_router(field.router, prefix="/api")
app.include_router(observations.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(layers.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(export.router, prefix="/api")


# ─────────────────────────────────────────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "ok",
        "service": "OceanVision API",
    }


@app.get("/", tags=["system"])
def root():
    return {
        "message": "OceanVision API is running",
        "docs": "/docs",
    }

"""
/api/models — Ocean model run catalogue and gridded slice endpoints
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime
from models.schemas import ModelName, OceanVariable

router = APIRouter()


@router.get("/runs")
def list_model_runs(
    model_name: Optional[ModelName] = Query(None),
    domain: Optional[str] = Query(None),
    status: str = Query("available"),
    limit: int = Query(50, le=200),
):
    """
    List available model runs filtered by model name, domain, status.
    TODO: query model catalogue DB
    """
    return []


@router.get("/runs/latest")
def latest_runs():
    """Most recent available run for each configured model."""
    return {}


@router.get("/runs/{run_id}")
def get_model_run(run_id: str):
    """Full metadata for one model run."""
    raise HTTPException(status_code=404, detail="Model run not found")


@router.get("/runs/{run_id}/profile")
def get_model_profile(
    run_id: str,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    variable: OceanVariable = Query(...),
    valid_time: Optional[datetime] = Query(None),
):
    """
    Vertical profile at a single lat/lon point from model output.
    Useful for comparing model vs in-situ observations.
    TODO: read from NetCDF using xarray
    """
    raise HTTPException(status_code=404, detail="Model run not found")


@router.get("/runs/{run_id}/timeseries")
def get_model_timeseries(
    run_id: str,
    lat: float = Query(...),
    lon: float = Query(...),
    depth_m: float = Query(0.0),
    variable: OceanVariable = Query(...),
):
    """Time series of a variable at a fixed point across all forecast steps."""
    raise HTTPException(status_code=404, detail="Model run not found")


@router.get("/compare")
def compare_models(
    run_ids: List[str] = Query(...),
    variable: OceanVariable = Query(...),
    lat: float = Query(...),
    lon: float = Query(...),
    depth_m: float = Query(0.0),
):
    """Side-by-side profile values from multiple model runs at the same point."""
    return {"point": {"lat": lat, "lon": lon, "depth_m": depth_m}, "runs": []}

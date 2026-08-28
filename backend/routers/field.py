"""
/api/field     — 2D horizontal grid slice (drives the coloured ocean layer)
/api/currents  — current vectors (drives arrows / streamlines)
/api/profile   — vertical profile for one observation platform

These three endpoints directly replace the mock functions in:
  src/services/mockOceanService.ts
"""

from fastapi import APIRouter, Query
from typing import Literal, List
from models.schemas import GridSlice, GridPoint, CurrentVector, ProfileResponse, ProfilePoint

router = APIRouter()

LAT_MIN, LAT_MAX, NLATS = -20, 30, 26
LON_MIN, LON_MAX, NLONS =  40, 100, 31


@router.get("/field", response_model=GridSlice)
def get_field_slice(
    variable: Literal["temperature", "salinity", "chlorophyll"] = Query(...),
    depth: float = Query(0.0, ge=0),
    time: int   = Query(0, ge=0),
):
    """
    2D horizontal grid slice at the requested depth and time step.
    Frontend calls: getFieldSlice(variable, depth, timeIndex)
    Maps to: GET /api/field?variable=temperature&depth=200&time=3

    TODO: replace with real xarray NetCDF read from INCOIS dataset
        import xarray as xr
        ds = xr.open_dataset("incois_model.nc")
        da = ds[variable].isel(time=time).sel(depth=depth, method="nearest")
        points = [GridPoint(lat=..., lon=..., depth=depth, ...) for ...]
    """
    return GridSlice(nlats=NLATS, nlons=NLONS, points=[])


@router.get("/currents", response_model=List[CurrentVector])
def get_currents(
    depth:   float = Query(0.0, ge=0),
    time:    int   = Query(0, ge=0),
    density: Literal["low", "medium", "high"] = Query("medium"),
):
    """
    Current vectors (u, v) for arrow rendering on the map.
    Frontend calls: getCurrents(depth, timeIndex, density)
    Maps to: GET /api/currents?depth=0&time=0&density=medium

    TODO: replace with real INCOIS current data
        step = {"low": 5, "medium": 3, "high": 2}[density]
        ds = xr.open_dataset("incois_currents.nc")
        ...
    """
    return []


@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    id:       str = Query(...),
    variable: Literal["temperature", "salinity", "chlorophyll"] = Query(...),
):
    """
    Vertical profile for one observation platform.
    Returns observed data AND model output so the frontend can overlay them.
    Frontend calls: getProfile(obsId, variable)
    Maps to: GET /api/profile?id=ARGO-2901&variable=temperature

    TODO: replace with real Argo NetCDF + model data
        obs_points   = [ProfilePoint(depth=d, ...) for d in argo_data]
        model_points = [ProfilePoint(depth=d, ...) for d in model_data]
        return ProfileResponse(observation=obs_points, model=model_points)
    """
    return ProfileResponse(observation=[], model=[])

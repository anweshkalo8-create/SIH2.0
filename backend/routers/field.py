from datetime import datetime, timezone
from typing import List, Literal

from fastapi import APIRouter, Query

from models.schemas import (
    CurrentVector,
    GridPoint,
    ProfilePoint,
)


router = APIRouter(
    prefix="/field",
    tags=["field"],
)


# ── Grid ──────────────────────────────────────────────────────────────────────

@router.get(
    "/grid",
    response_model=List[GridPoint],
)
def get_field_grid(
    variable: Literal[
        "temperature",
        "salinity",
        "chlorophyll",
    ] = Query(default="temperature"),
    depth: float = Query(
        default=0.0,
        ge=0,
    ),
):
    """
    Return a small demonstration ocean field.

    This is placeholder data for the prototype.
    The implementation can later be replaced by
    NetCDF/xarray/INCOIS data without changing the
    API response structure.
    """

    points = [
        GridPoint(
            lat=10.0,
            lon=70.0,
            depth=depth,
            temperature=28.2,
            salinity=34.9,
            chlorophyll=0.42,
        ),
        GridPoint(
            lat=12.0,
            lon=72.0,
            depth=depth,
            temperature=27.8,
            salinity=35.1,
            chlorophyll=0.38,
        ),
        GridPoint(
            lat=14.0,
            lon=74.0,
            depth=depth,
            temperature=27.3,
            salinity=35.3,
            chlorophyll=0.31,
        ),
        GridPoint(
            lat=16.0,
            lon=76.0,
            depth=depth,
            temperature=26.9,
            salinity=35.5,
            chlorophyll=0.28,
        ),
    ]

    # The response contains all supported variables,
    # so the frontend can switch variables without
    # requesting a different response structure.
    _ = variable

    return points


# ── Currents ──────────────────────────────────────────────────────────────────

@router.get(
    "/currents",
    response_model=List[CurrentVector],
)
def get_currents(
    depth: float = Query(
        default=0.0,
        ge=0,
    ),
):
    """
    Return demonstration ocean current vectors.
    """

    timestamp = datetime.now(
        timezone.utc
    ).isoformat()

    return [
        CurrentVector(
            latitude=12.0,
            longitude=72.0,
            depth=depth,
            u=0.42,
            v=0.18,
            timestamp=timestamp,
        ),
        CurrentVector(
            latitude=14.0,
            longitude=74.0,
            depth=depth,
            u=0.35,
            v=0.22,
            timestamp=timestamp,
        ),
        CurrentVector(
            latitude=16.0,
            longitude=76.0,
            depth=depth,
            u=0.28,
            v=0.14,
            timestamp=timestamp,
        ),
    ]


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get(
    "/profile",
    response_model=List[ProfilePoint],
)
def get_profile(
    latitude: float = Query(
        ...,
        ge=-90,
        le=90,
    ),
    longitude: float = Query(
        ...,
        ge=-180,
        le=180,
    ),
):
    """
    Return a demonstration vertical ocean profile.

    Latitude and longitude are currently accepted
    for API compatibility. The demonstration data
    is not yet location-dependent.
    """

    _ = latitude
    _ = longitude

    return [
        ProfilePoint(
            depth=0,
            temperature=28.4,
            salinity=34.8,
            chlorophyll=0.50,
        ),
        ProfilePoint(
            depth=50,
            temperature=27.9,
            salinity=35.0,
            chlorophyll=0.44,
        ),
        ProfilePoint(
            depth=100,
            temperature=27.2,
            salinity=35.2,
            chlorophyll=0.35,
        ),
        ProfilePoint(
            depth=200,
            temperature=25.8,
            salinity=35.5,
            chlorophyll=0.24,
        ),
        ProfilePoint(
            depth=500,
            temperature=20.1,
            salinity=35.7,
            chlorophyll=0.10,
        ),
    ]

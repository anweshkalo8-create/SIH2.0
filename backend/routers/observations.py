from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from models.schemas import (
    Observation,
    ObservationType,
    ProfilePoint,
    StatsResponse,
)


router = APIRouter(
    prefix="/observations",
    tags=["observations"],
)


# ── Demo observation data ──────────────────────────────────────────────────────
# Temporary development data.
# This can later be replaced by a database or INCOIS/Argo data source.

NOW = datetime.now(timezone.utc)


OBSERVATIONS: List[Observation] = [
    Observation(
        id="ARGO-001",
        type=ObservationType.ARGO,
        latitude=15.20,
        longitude=72.80,
        timestamp=(
            NOW - timedelta(hours=2)
        ).isoformat(),
        depth=100.0,
        temperature=27.4,
        salinity=35.2,
        chlorophyll=0.42,
        maxDepth=2000.0,
    ),
    Observation(
        id="ARGO-002",
        type=ObservationType.ARGO,
        latitude=13.50,
        longitude=74.10,
        timestamp=(
            NOW - timedelta(hours=5)
        ).isoformat(),
        depth=150.0,
        temperature=26.8,
        salinity=35.5,
        chlorophyll=0.36,
        maxDepth=1800.0,
    ),
    Observation(
        id="GLIDER-001",
        type=ObservationType.GLIDER,
        latitude=17.10,
        longitude=71.60,
        timestamp=(
            NOW - timedelta(hours=8)
        ).isoformat(),
        depth=80.0,
        temperature=28.1,
        salinity=34.9,
        chlorophyll=0.51,
        maxDepth=1000.0,
    ),
]


# ── List observations ──────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[Observation],
)
def list_observations(
    observation_type: Optional[ObservationType] = Query(
        default=None,
        alias="type",
    ),
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
):
    """
    Return available ocean observations.

    Optional filtering:
    - type=argo
    - type=glider
    - type=buoy
    """

    if observation_type is None:
        results = OBSERVATIONS
    else:
        results = [
            observation
            for observation in OBSERVATIONS
            if observation.type == observation_type
        ]

    return results[:limit]


# ── Observation statistics ─────────────────────────────────────────────────────
# Keep this route before /{observation_id} so that
# "stats" is not interpreted as an observation ID.

@router.get(
    "/stats/summary",
    response_model=StatsResponse,
)
def observation_stats():
    """
    Return summary statistics for the available observations.

    These are demonstration statistics until the
    observation/model comparison pipeline is connected.
    """

    if not OBSERVATIONS:
        return StatsResponse(
            rmse=0.0,
            meanError=0.0,
            count=0,
        )

    return StatsResponse(
        rmse=0.38,
        meanError=0.12,
        count=len(OBSERVATIONS),
    )


# ── Vertical profile ───────────────────────────────────────────────────────────

@router.get(
    "/{observation_id}/profile",
    response_model=List[ProfilePoint],
)
def get_observation_profile(
    observation_id: str,
):
    """
    Return a demonstration vertical profile
    for a specific observation.
    """

    observation = next(
        (
            item
            for item in OBSERVATIONS
            if item.id == observation_id
        ),
        None,
    )

    if observation is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Observation "
                f"'{observation_id}' not found"
            ),
        )


    base_temperature = observation.temperature
    base_salinity = observation.salinity
    base_chlorophyll = observation.chlorophyll


    depths = [
        0.0,
        50.0,
        100.0,
        200.0,
        500.0,
    ]


    profile: List[ProfilePoint] = []

    for depth in depths:

        if depth > observation.maxDepth:
            continue

        temperature = max(
            0.0,
            base_temperature -
            depth * 0.008,
        )

        salinity = (
            base_salinity +
            depth * 0.0008
        )

        chlorophyll = max(
            0.02,
            base_chlorophyll -
            depth * 0.0005,
        )


        profile.append(
            ProfilePoint(
                depth=depth,
                temperature=round(
                    temperature,
                    2,
                ),
                salinity=round(
                    salinity,
                    2,
                ),
                chlorophyll=round(
                    chlorophyll,
                    3,
                ),
            )
        )


    return profile


# ── Single observation ─────────────────────────────────────────────────────────

@router.get(
    "/{observation_id}",
    response_model=Observation,
)
def get_observation(
    observation_id: str,
):
    """
    Return one observation by ID.
    """

    observation = next(
        (
            item
            for item in OBSERVATIONS
            if item.id == observation_id
        ),
        None,
    )

    if observation is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Observation "
                f"'{observation_id}' not found"
            ),
        )

    return observation

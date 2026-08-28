from datetime import datetime, timezone
from typing import List, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from models.schemas import ModelName


router = APIRouter(
    prefix="/models",
    tags=["models"],
)


# ── Model run schemas ─────────────────────────────────────────────────────────

class ModelRun(BaseModel):
    run_id: str
    model: ModelName
    timestamp: datetime
    region: str
    status: Literal[
        "available",
        "processing",
        "failed",
    ]
    resolution_km: float = Field(
        ...,
        gt=0,
    )


class ModelRunList(BaseModel):
    runs: List[ModelRun]


# ── Demonstration model runs ──────────────────────────────────────────────────
# Temporary development data.
# This can later be replaced with real model metadata
# from the backend/database.

MODEL_RUNS: List[ModelRun] = [
    ModelRun(
        run_id="ROMS-2026-08-28-00",
        model=ModelName.ROMS,
        timestamp=datetime(
            2026,
            8,
            28,
            0,
            0,
            tzinfo=timezone.utc,
        ),
        region="indian-ocean",
        status="available",
        resolution_km=5.0,
    ),
    ModelRun(
        run_id="NEMO-2026-08-28-00",
        model=ModelName.NEMO,
        timestamp=datetime(
            2026,
            8,
            28,
            0,
            0,
            tzinfo=timezone.utc,
        ),
        region="indian-ocean",
        status="available",
        resolution_km=10.0,
    ),
]


# ── Latest model run ──────────────────────────────────────────────────────────
# Keep /runs/latest before /runs/{run_id} so that
# "latest" is not interpreted as a run ID.

@router.get(
    "/runs/latest",
    response_model=ModelRun,
)
def get_latest_run():
    """
    Return the most recent available model run.
    """

    if not MODEL_RUNS:
        raise HTTPException(
            status_code=404,
            detail="No model runs available",
        )

    available_runs = [
        run
        for run in MODEL_RUNS
        if run.status == "available"
    ]

    if not available_runs:
        raise HTTPException(
            status_code=404,
            detail="No available model runs",
        )

    return max(
        available_runs,
        key=lambda run: run.timestamp,
    )


# ── List model runs ───────────────────────────────────────────────────────────

@router.get(
    "/runs",
    response_model=ModelRunList,
)
def list_model_runs():
    """
    Return all available model runs.

    Runs are ordered from newest to oldest.
    """

    sorted_runs = sorted(
        MODEL_RUNS,
        key=lambda run: run.timestamp,
        reverse=True,
    )

    return ModelRunList(
        runs=sorted_runs,
    )


# ── Single model run ──────────────────────────────────────────────────────────

@router.get(
    "/runs/{run_id}",
    response_model=ModelRun,
)
def get_model_run(
    run_id: str,
):
    """
    Return a model run by ID.
    """

    run = next(
        (
            item
            for item in MODEL_RUNS
            if item.run_id == run_id
        ),
        None,
    )

    if run is None:
        raise HTTPException(
            status_code=404,
            detail=f"Model run '{run_id}' not found",
        )

    return run

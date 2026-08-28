from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from models.schemas import ModelName


router = APIRouter(prefix="/models", tags=["models"])


class ModelRun(BaseModel):
    run_id: str
    model: ModelName
    timestamp: datetime
    region: str
    status: str
    resolution_km: float = Field(..., gt=0)


class ModelRunList(BaseModel):
    runs: List[ModelRun]


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


# Keep /runs/latest BEFORE /runs/{run_id}
# so "latest" is not interpreted as a run ID.

@router.get("/runs/latest", response_model=ModelRun)
def get_latest_run():
    """
    Return the most recent available model run.
    """
    if not MODEL_RUNS:
        raise HTTPException(
            status_code=404,
            detail="No model runs available",
        )

    return max(
        MODEL_RUNS,
        key=lambda run: run.timestamp,
    )


@router.get("/runs", response_model=ModelRunList)
def list_model_runs():
    """
    Return all available model runs.
    """
    return ModelRunList(runs=MODEL_RUNS)


@router.get("/runs/{run_id}", response_model=ModelRun)
def get_model_run(run_id: str):
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

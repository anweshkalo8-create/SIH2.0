"""
/api/observations — In-situ ocean observation endpoints

Matches: getObservations(timeIndex) in mockOceanService.ts
Frontend expects: { id, type, latitude, longitude, timestamp,
                    depth, temperature, salinity, chlorophyll, maxDepth }
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from models.schemas import Observation, ObservationType

router = APIRouter()


@router.get("/", response_model=List[Observation])
def get_observations(
    time: int = Query(0, ge=0),
    type: Optional[ObservationType] = Query(None),
):
    """
    All active observation platforms at the requested time step.
    Frontend calls: getObservations(timeIndex)
    Maps to: GET /api/observations?time=0
             GET /api/observations?time=0&type=argo

    TODO: replace with real INCOIS / Argo data
        rows = db.query("SELECT * FROM observations WHERE time_index = %s", [time])
        if type:
            rows = [r for r in rows if r.type == type]
        return [Observation(**r) for r in rows]
    """
    return []


@router.get("/{observation_id}", response_model=Observation)
def get_observation(observation_id: str):
    """Full detail for one platform by its ID e.g. ARGO-2901"""
    raise HTTPException(status_code=404, detail="Observation not found")


@router.get("/stats/summary")
def observation_stats():
    """Count of platforms by type — used by the info panel."""
    return {
        "total": 0,
        "by_type": {t.value: 0 for t in ObservationType},
        "date_range": {"from": None, "to": None},
    }

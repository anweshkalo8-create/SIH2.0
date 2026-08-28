"""
/api/export — Download observation or model data in various formats.
Supported: csv, json, netcdf, geotiff
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import ExportRequest

router = APIRouter()


@router.post("/request")
def request_export(body: ExportRequest, background_tasks: BackgroundTasks):
    """
    Queue a data export job.
    Small requests (<5MB) → file streamed directly.
    Large requests → background job, poll via GET /export/status/{job_id}

    Supported formats:
      csv     → tabular (observations only)
      json    → GeoJSON FeatureCollection
      netcdf  → CF-compliant NetCDF4
      geotiff → raster (model slices only)

    TODO: estimate size, enqueue Celery task for large exports
    """
    if body.format not in ("csv", "json", "netcdf", "geotiff"):
        raise HTTPException(status_code=400, detail="Unsupported format")
    if body.format == "geotiff" and body.data_type != "model_slice":
        raise HTTPException(
            status_code=400,
            detail="GeoTIFF only supported for model slices"
        )

    job_id = "job_placeholder_id"
    background_tasks.add_task(_run_export, job_id, body)
    return {
        "job_id": job_id,
        "status": "queued",
        "poll_url": f"/api/export/status/{job_id}"
    }


@router.get("/status/{job_id}")
def export_status(job_id: str):
    """Poll the status of a queued export job."""
    return {
        "job_id": job_id,
        "status": "pending",
        "progress_pct": 0,
        "download_url": None
    }


@router.get("/download/{job_id}")
def download_export(job_id: str):
    """Stream the completed export file to the client."""
    raise HTTPException(status_code=404, detail="Export not ready or not found")


def _run_export(job_id: str, req: ExportRequest):
    """
    Background task — fetches data, converts to requested format,
    writes to /tmp/exports/{job_id}.{ext}, marks job complete in DB.
    TODO: implement per-format serialisation using xarray / pandas
    """
    pass

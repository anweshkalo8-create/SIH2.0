import csv
import io
import json
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ExportRequest, ExportStatus


router = APIRouter(prefix="/export", tags=["export"])


EXPORT_JOBS: Dict[str, dict] = {}


SUPPORTED_FORMATS = {
    "csv",
    "json",
}


@router.post(
    "",
    response_model=ExportStatus,
)
def create_export(payload: ExportRequest):
    """
    Create an export job.

    CSV and JSON are supported in this development implementation.
    """

    export_format = payload.format.lower()

    if export_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported export format '{payload.format}'. "
                f"Supported formats: {sorted(SUPPORTED_FORMATS)}"
            ),
        )

    job_id = str(uuid4())

    EXPORT_JOBS[job_id] = {
        "status": "completed",
        "progress_pct": 100,
        "request": payload.model_dump(mode="json"),
    }

    return ExportStatus(
        job_id=job_id,
        status="completed",
        progress_pct=100,
        download_url=f"/api/export/{job_id}/download",
    )


@router.get(
    "/{job_id}",
    response_model=ExportStatus,
)
def get_export_status(job_id: str):
    job = EXPORT_JOBS.get(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Export job not found",
        )

    return ExportStatus(
        job_id=job_id,
        status=job["status"],
        progress_pct=job["progress_pct"],
        download_url=f"/api/export/{job_id}/download",
    )


@router.get("/{job_id}/download")
def download_export(job_id: str):
    job = EXPORT_JOBS.get(job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Export job not found",
        )

    if job["status"] != "completed":
        raise HTTPException(
            status_code=409,
            detail="Export is not ready",
        )

    request_data = job["request"]
    export_format = request_data["format"].lower()

    rows = [
        {
            "id": item_id,
            "data_type": request_data["data_type"],
        }
        for item_id in request_data["ids"]
    ]

    if export_format == "json":
        content = json.dumps(
            rows,
            indent=2,
        )

        return StreamingResponse(
            io.BytesIO(content.encode("utf-8")),
            media_type="application/json",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{job_id}.json"'
                )
            },
        )

    output = io.StringIO()

    writer = csv.DictWriter(
        output,
        fieldnames=["id", "data_type"],
    )

    writer.writeheader()
    writer.writerows(rows)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{job_id}.csv"'
            )
        },
    )

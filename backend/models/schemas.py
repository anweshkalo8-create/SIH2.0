from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────────────

class ObservationType(str, Enum):
    ARGO = "argo"
    GLIDER = "glider"
    BUOY = "buoy"


class OceanVariable(str, Enum):
    TEMPERATURE = "temperature"
    SALINITY = "salinity"
    CHLOROPHYLL = "chlorophyll"
    CURRENT_U = "current_u"
    CURRENT_V = "current_v"


class ModelName(str, Enum):
    ROMS = "roms"
    NEMO = "nemo"
    HYCOM = "hycom"
    MOM6 = "mom6"


# ── Field / Grid Schemas ──────────────────────────────────────────────────────

class GridPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    depth: float = Field(..., ge=0)
    temperature: float
    salinity: float
    chlorophyll: float = Field(..., ge=0)


class GridSlice(BaseModel):
    nlats: int = Field(..., gt=0)
    nlons: int = Field(..., gt=0)
    points: List[GridPoint]


# ── Current Vectors ───────────────────────────────────────────────────────────

class CurrentVector(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    depth: float = Field(..., ge=0)
    u: float
    v: float
    timestamp: str


# ── Observations ──────────────────────────────────────────────────────────────

class Observation(BaseModel):
    id: str
    type: ObservationType
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: str
    depth: float = Field(..., ge=0)
    temperature: float
    salinity: float
    chlorophyll: float = Field(..., ge=0)
    maxDepth: float = Field(..., ge=0)


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfilePoint(BaseModel):
    depth: float = Field(..., ge=0)
    temperature: float
    salinity: float
    chlorophyll: float = Field(..., ge=0)


class ProfileResponse(BaseModel):
    observation: List[ProfilePoint]
    model: List[ProfilePoint]


# ── Statistics ────────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    rmse: float = Field(..., ge=0)
    meanError: float
    count: int = Field(..., ge=0)


# ── Map Layer Schemas ─────────────────────────────────────────────────────────

class MapLayer(BaseModel):
    layer_id: str
    name: str
    description: str
    type: str
    url: str
    attribution: str
    default_visible: bool = False
    z_index: int = 10


class LayerToggle(BaseModel):
    layer_ids: List[str]
    visible: bool


# ── User / Auth Schemas ───────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    name: str
    organization: Optional[str] = None
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    organization: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Saved Views ───────────────────────────────────────────────────────────────

class SavedView(BaseModel):
    view_id: Optional[str] = None
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    zoom: float = Field(..., ge=0)
    depth_m: float = Field(..., ge=0)
    variable: OceanVariable
    timestamp_filter: Optional[datetime] = None


# ── Export Schemas ────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    data_type: str
    ids: List[str]
    format: Literal[
        "csv",
        "json",
    ]
    variables: Optional[List[OceanVariable]] = None


class ExportStatus(BaseModel):
    job_id: str
    status: Literal[
        "queued",
        "processing",
        "completed",
        "failed",
    ]
    progress_pct: int = Field(
        ...,
        ge=0,
        le=100,
    )
    download_url: Optional[str] = None

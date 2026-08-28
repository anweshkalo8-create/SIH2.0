from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class ObservationType(str, Enum):
    ARGO   = "argo"
    GLIDER = "glider"
    BUOY   = "buoy"

class OceanVariable(str, Enum):
    TEMPERATURE = "temperature"
    SALINITY    = "salinity"
    CHLOROPHYLL = "chlorophyll"
    CURRENT_U   = "current_u"
    CURRENT_V   = "current_v"

class ModelName(str, Enum):
    ROMS = "roms"
    NEMO = "nemo"
    HYCOM = "hycom"
    MOM6  = "mom6"


# ── Field / Grid Schemas  (matches mockOceanService.ts exactly) ────────────────

class GridPoint(BaseModel):
    lat: float
    lon: float
    depth: float
    temperature: float
    salinity: float
    chlorophyll: float

class GridSlice(BaseModel):
    nlats: int
    nlons: int
    points: List[GridPoint]


# ── Current Vectors ────────────────────────────────────────────────────────────

class CurrentVector(BaseModel):
    latitude: float
    longitude: float
    depth: float
    u: float          # east-west  m/s
    v: float          # north-south m/s
    timestamp: str


# ── Observations  (matches Observation type in ocean.ts) ──────────────────────

class Observation(BaseModel):
    id: str
    type: ObservationType
    latitude: float
    longitude: float
    timestamp: str
    depth: float
    temperature: float
    salinity: float
    chlorophyll: float
    maxDepth: float


# ── Profile  (matches ProfilePoint type in ocean.ts) ──────────────────────────

class ProfilePoint(BaseModel):
    depth: float
    temperature: float
    salinity: float
    chlorophyll: float

class ProfileResponse(BaseModel):
    observation: List[ProfilePoint]
    model: List[ProfilePoint]


# ── Stats ──────────────────────────────────────────────────────────────────────

class StatsResponse(BaseModel):
    rmse: float
    meanError: float
    count: int


# ── Map Layer Schemas ──────────────────────────────────────────────────────────

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


# ── User / Auth Schemas ────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    name: str
    organization: Optional[str] = None
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SavedView(BaseModel):
    view_id: Optional[str] = None
    name: str
    lat: float
    lon: float
    zoom: float
    depth_m: float
    variable: OceanVariable
    timestamp_filter: Optional[datetime] = None


# ── Export Schemas ─────────────────────────────────────────────────────────────

class ExportRequest(BaseModel):
    data_type: str
    ids: List[str]
    format: str
    variables: Optional[List[OceanVariable]] = None

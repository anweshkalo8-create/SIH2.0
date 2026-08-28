"""
/api/layers — Static and dynamic map layer catalogue
Bathymetry, coastlines, EEZ boundaries, ocean currents, SST tiles etc.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from models.schemas import MapLayer, LayerToggle

router = APIRouter()

LAYER_CATALOGUE = [
    {
        "layer_id": "bathymetry_gebco",
        "name": "Bathymetry (GEBCO 2023)",
        "description": "Global seafloor topography at 15 arc-second resolution",
        "type": "raster",
        "url": "https://tiles.gebco.net/tiles/gebco_latest/{z}/{x}/{y}.png",
        "attribution": "GEBCO 2023",
        "default_visible": True,
        "z_index": 5,
    },
    {
        "layer_id": "eez_boundaries",
        "name": "EEZ Boundaries",
        "description": "Exclusive Economic Zones (Marine Regions v12)",
        "type": "vector",
        "url": "/api/layers/eez_boundaries/geojson",
        "attribution": "Flanders Marine Institute",
        "default_visible": False,
        "z_index": 20,
    },
    {
        "layer_id": "sst_ghrsst",
        "name": "SST (GHRSST L4)",
        "description": "Near real-time sea surface temperature composites",
        "type": "raster",
        "url": "https://opendap.earthdata.nasa.gov/",
        "attribution": "NASA GHRSST",
        "default_visible": False,
        "z_index": 15,
    },
    {
        "layer_id": "ocean_currents",
        "name": "Surface Currents (OSCAR)",
        "description": "Near-real-time ocean surface current vectors",
        "type": "vector",
        "url": "/api/layers/ocean_currents/geojson",
        "attribution": "OSCAR / NASA JPL",
        "default_visible": False,
        "z_index": 25,
    },
    {
        "layer_id": "argo_floats",
        "name": "Argo Float Positions",
        "description": "Live positions of active Argo profiling floats",
        "type": "vector",
        "url": "/api/observations/?type=argo",
        "attribution": "Argo / INCOIS",
        "default_visible": True,
        "z_index": 30,
    },
]


@router.get("/", response_model=List[MapLayer])
def list_layers():
    """Return the full layer catalogue."""
    return [MapLayer(**l) for l in LAYER_CATALOGUE]


@router.get("/{layer_id}", response_model=MapLayer)
def get_layer(layer_id: str):
    for l in LAYER_CATALOGUE:
        if l["layer_id"] == layer_id:
            return MapLayer(**l)
    raise HTTPException(status_code=404, detail="Layer not found")


@router.get("/{layer_id}/geojson")
def get_layer_geojson(layer_id: str):
    """
    Serve vector layers as GeoJSON.
    Proxied here to avoid CORS issues from the browser.
    TODO: fetch and cache from upstream source
    """
    if layer_id not in ("eez_boundaries", "ocean_currents"):
        raise HTTPException(status_code=400, detail="Layer is not a vector type")
    return {"type": "FeatureCollection", "features": []}


@router.post("/toggle")
def toggle_layers(body: LayerToggle):
    """Persist user layer visibility preferences per session."""
    return {"updated": body.layer_ids, "visible": body.visible}

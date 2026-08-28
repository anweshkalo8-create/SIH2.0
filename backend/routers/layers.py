from typing import List

from fastapi import APIRouter, HTTPException

from models.schemas import LayerToggle, MapLayer


router = APIRouter(
    prefix="/layers",
    tags=["layers"],
)


# ── Map layer definitions ─────────────────────────────────────────────────────

LAYERS: List[MapLayer] = [
    MapLayer(
        layer_id="bathymetry",
        name="Bathymetry",
        description="Ocean depth and seabed information.",
        type="raster",
        url="/api/layers/bathymetry",
        attribution="OceanVision",
        default_visible=True,
        z_index=10,
    ),
    MapLayer(
        layer_id="currents",
        name="Ocean Currents",
        description="Surface ocean current vectors.",
        type="vector",
        url="/api/field/currents",
        attribution="OceanVision",
        default_visible=True,
        z_index=20,
    ),
    MapLayer(
        layer_id="observations",
        name="Observations",
        description="Argo and glider observation locations.",
        type="points",
        url="/api/observations",
        attribution="OceanVision",
        default_visible=True,
        z_index=30,
    ),
]


# ── List layers ───────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=List[MapLayer],
)
def list_layers():
    """
    Return all available map layers.
    """

    return LAYERS


# ── EEZ boundaries ────────────────────────────────────────────────────────────

@router.get("/eez_boundaries/geojson")
def get_eez_boundaries():
    """
    Return a GeoJSON FeatureCollection for EEZ boundaries.

    Boundary geometry will be connected to the official
    geographic dataset in the production data layer.
    """

    return {
        "type": "FeatureCollection",
        "features": [],
    }


# ── Toggle layers ─────────────────────────────────────────────────────────────

@router.post("/toggle")
def toggle_layers(
    payload: LayerToggle,
):
    """
    Validate requested layer IDs and return
    the requested visibility state.

    Persistent user preferences can be added later.
    """

    known_ids = {
        layer.layer_id
        for layer in LAYERS
    }

    invalid_ids = [
        layer_id
        for layer_id in payload.layer_ids
        if layer_id not in known_ids
    ]

    if invalid_ids:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unknown layer ID(s)",
                "layer_ids": invalid_ids,
            },
        )

    return {
        "layer_ids": payload.layer_ids,
        "visible": payload.visible,
    }


# ── Single layer ──────────────────────────────────────────────────────────────
# Keep this dynamic route LAST so that paths such as
# /eez_boundaries/geojson are handled by their
# specific endpoint above.

@router.get(
    "/{layer_id}",
    response_model=MapLayer,
)
def get_layer(
    layer_id: str,
):
    """
    Return one layer by ID.
    """

    layer = next(
        (
            item
            for item in LAYERS
            if item.layer_id == layer_id
        ),
        None,
    )

    if layer is None:
        raise HTTPException(
            status_code=404,
            detail=f"Layer '{layer_id}' not found",
        )

    return layer

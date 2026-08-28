"""Cached access to Copernicus Marine NetCDF subsets.

Set COPERNICUS_DATA_FILE to a NetCDF file downloaded with the Copernicus
Marine Toolbox. Keeping refresh separate prevents browser requests from
triggering expensive remote downloads.
"""
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import xarray as xr
from fastapi import HTTPException


def _coord(data: xr.DataArray, *names: str) -> str:
    for name in names:
        if name in data.coords or name in data.dims:
            return name
    raise HTTPException(503, f"Copernicus data has none of: {', '.join(names)}")


@lru_cache(maxsize=1)
def dataset() -> xr.Dataset:
    path = Path(os.getenv("COPERNICUS_DATA_FILE", "data/copernicus.nc"))
    if not path.is_file():
        raise HTTPException(
            503,
            "Real ocean data is not configured. Download a Copernicus subset "
            "and set COPERNICUS_DATA_FILE, or use mock mode.",
        )
    return xr.open_dataset(path)


def _slice(variable: str, depth: float, time_value: str | None) -> xr.DataArray:
    ds = dataset()
    if variable not in ds:
        raise HTTPException(503, f"Variable '{variable}' is not in the cached Copernicus file")
    values = ds[variable]
    depth_name = _coord(values, "depth", "deptht", "lev")
    values = values.sel({depth_name: depth}, method="nearest")
    if time_value:
        time_name = _coord(values, "time", "time_counter")
        values = values.sel({time_name: time_value}, method="nearest")
    return values.squeeze()


def grid(depth: float, time_value: str | None) -> dict[str, Any]:
    fields = {name: _slice(name, depth, time_value) for name in ("thetao", "so", "chl")}
    latitude = _coord(fields["thetao"], "latitude", "lat")
    longitude = _coord(fields["thetao"], "longitude", "lon")
    lats, lons = fields["thetao"][latitude].values, fields["thetao"][longitude].values
    points = []
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            points.append({
                "lat": float(lat), "lon": float(lon), "depth": depth,
                "temperature": float(fields["thetao"].values[i, j]),
                "salinity": float(fields["so"].values[i, j]),
                "chlorophyll": max(0.0, float(fields["chl"].values[i, j])),
            })
    return {"nlats": len(lats), "nlons": len(lons), "points": points}


def currents(depth: float, time_value: str | None, stride: int) -> list[dict[str, Any]]:
    u, v = _slice("uo", depth, time_value), _slice("vo", depth, time_value)
    latitude, longitude = _coord(u, "latitude", "lat"), _coord(u, "longitude", "lon")
    timestamp = time_value or ""
    return [
        {"latitude": float(lat), "longitude": float(lon), "depth": depth,
         "u": float(u.values[i, j]), "v": float(v.values[i, j]), "timestamp": timestamp}
        for i, lat in enumerate(u[latitude].values[::stride])
        for j, lon in enumerate(u[longitude].values[::stride])
    ]

import type {
  CurrentVector,
  Observation,
  OceanVariable,
  ProfilePoint,
  Stats,
} from "../types/ocean";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000/api";


async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    let message =
      `API request failed: ${response.status}`;

    try {
      const body = await response.json();

      if (body?.detail) {
        message =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


// ── Observation filters ──────────────────────────────────────────────────────

export interface ObservationFilters {
  type?: "argo" | "glider" | "buoy";
  limit?: number;
}


// ── Field filters ────────────────────────────────────────────────────────────

export interface FieldFilters {
  variable?: OceanVariable;
  depth?: number;
}


// ── Profile filters ──────────────────────────────────────────────────────────

export interface ProfileFilters {
  latitude: number;
  longitude: number;
}


// ── Export types ──────────────────────────────────────────────────────────────

export interface ExportRequest {
  data_type: string;
  ids: string[];
  format: "csv" | "json";
  variables?: OceanVariable[];
}


export interface ExportStatus {
  job_id: string;
  status:
    | "queued"
    | "processing"
    | "completed"
    | "failed";
  progress_pct: number;
  download_url?: string | null;
}


// ── Model types ───────────────────────────────────────────────────────────────

export interface ModelRun {
  run_id: string;
  model:
    | "roms"
    | "nemo"
    | "hycom"
    | "mom6";
  timestamp: string;
  region: string;
  status: string;
  resolution_km: number;
}


export interface ModelRunList {
  runs: ModelRun[];
}


// ── Layer types ──────────────────────────────────────────────────────────────

export interface MapLayer {
  layer_id: string;
  name: string;
  description: string;
  type: string;
  url: string;
  attribution: string;
  default_visible: boolean;
  z_index: number;
}


export interface LayerToggle {
  layer_ids: string[];
  visible: boolean;
}


// ── User types ────────────────────────────────────────────────────────────────

export interface UserCreate {
  email: string;
  name: string;
  organization?: string;
  password: string;
}


export interface UserResponse {
  id: string;
  email: string;
  name: string;
  organization?: string | null;
}


export interface Token {
  access_token: string;
  token_type: string;
}


export interface SavedView {
  view_id?: string | null;
  name: string;
  lat: number;
  lon: number;
  zoom: number;
  depth_m: number;
  variable: OceanVariable;
  timestamp_filter?: string | null;
}


// ── API service ──────────────────────────────────────────────────────────────

export const apiOceanService = {

  // ── Observations ──────────────────────────────────────────────────────────

  async getObservations(
    filters: ObservationFilters = {},
  ): Promise<Observation[]> {

    const params = new URLSearchParams();

    if (filters.type) {
      params.set(
        "type",
        filters.type,
      );
    }

    if (filters.limit !== undefined) {
      params.set(
        "limit",
        String(filters.limit),
      );
    }

    const query = params.toString();

    return request<Observation[]>(
      `/observations${query ? `?${query}` : ""}`,
    );
  },


  async getObservation(
    observationId: string,
  ): Promise<Observation> {

    return request<Observation>(
      `/observations/${encodeURIComponent(
        observationId,
      )}`,
    );
  },


  async getObservationProfile(
    observationId: string,
  ): Promise<ProfilePoint[]> {

    return request<ProfilePoint[]>(
      `/observations/${encodeURIComponent(
        observationId,
      )}/profile`,
    );
  },


  async getObservationStats(): Promise<Stats> {

    return request<Stats>(
      "/observations/stats/summary",
    );
  },


  // ── Ocean field ───────────────────────────────────────────────────────────

  async getField(
    filters: FieldFilters = {},
  ) {

    const params = new URLSearchParams();

    if (filters.variable) {
      params.set(
        "variable",
        filters.variable,
      );
    }

    if (filters.depth !== undefined) {
      params.set(
        "depth",
        String(filters.depth),
      );
    }

    const query = params.toString();

    return request(
      `/field/grid${query ? `?${query}` : ""}`,
    );
  },


  async getCurrents(
    depth = 0,
  ): Promise<CurrentVector[]> {

    const params = new URLSearchParams({
      depth: String(depth),
    });

    return request<CurrentVector[]>(
      `/field/currents?${params.toString()}`,
    );
  },


  async getProfile(
    filters: ProfileFilters,
  ): Promise<ProfilePoint[]> {

    const params = new URLSearchParams({
      latitude: String(
        filters.latitude,
      ),
      longitude: String(
        filters.longitude,
      ),
    });

    return request<ProfilePoint[]>(
      `/field/profile?${params.toString()}`,
    );
  },


  // ── Models ────────────────────────────────────────────────────────────────

  async getModelRuns(): Promise<ModelRunList> {

    return request<ModelRunList>(
      "/models/runs",
    );
  },


  async getLatestModelRun(): Promise<ModelRun> {

    return request<ModelRun>(
      "/models/runs/latest",
    );
  },


  async getModelRun(
    runId: string,
  ): Promise<ModelRun> {

    return request<ModelRun>(
      `/models/runs/${encodeURIComponent(
        runId,
      )}`,
    );
  },


  // ── Layers ─────────────────────────────────────────────────────────────────

  async getLayers(): Promise<MapLayer[]> {

    return request<MapLayer[]>(
      "/layers",
    );
  },


  async getLayer(
    layerId: string,
  ): Promise<MapLayer> {

    return request<MapLayer>(
      `/layers/${encodeURIComponent(
        layerId,
      )}`,
    );
  },


  async toggleLayers(
    payload: LayerToggle,
  ): Promise<LayerToggle> {

    return request<LayerToggle>(
      "/layers/toggle",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },


  async getEEZBoundaries() {

    return request(
      "/layers/eez_boundaries/geojson",
    );
  },


  // ── Users / Authentication ───────────────────────────────────────────────

  async register(
    payload: UserCreate,
  ): Promise<UserResponse> {

    return request<UserResponse>(
      "/users/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },


  async login(
    payload: UserCreate,
  ): Promise<Token> {

    return request<Token>(
      "/users/login",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },


  async getCurrentUser(
    userId: string,
  ): Promise<UserResponse> {

    const params = new URLSearchParams({
      user_id: userId,
    });

    return request<UserResponse>(
      `/users/me?${params.toString()}`,
    );
  },


  // ── Saved views ───────────────────────────────────────────────────────────

  async getSavedViews(
    userId: string,
  ): Promise<SavedView[]> {

    return request<SavedView[]>(
      `/users/${encodeURIComponent(
        userId,
      )}/views`,
    );
  },


  async createSavedView(
    userId: string,
    payload: SavedView,
  ): Promise<SavedView> {

    return request<SavedView>(
      `/users/${encodeURIComponent(
        userId,
      )}/views`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },


  // ── Export ────────────────────────────────────────────────────────────────

  async createExport(
    payload: ExportRequest,
  ): Promise<ExportStatus> {

    return request<ExportStatus>(
      "/export",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },


  async getExportStatus(
    jobId: string,
  ): Promise<ExportStatus> {

    return request<ExportStatus>(
      `/export/${encodeURIComponent(
        jobId,
      )}`,
    );
  },


  getExportDownloadUrl(
    jobId: string,
  ): string {

    return (
      `${API_BASE_URL}/export/` +
      `${encodeURIComponent(jobId)}/download`
    );
  },
};

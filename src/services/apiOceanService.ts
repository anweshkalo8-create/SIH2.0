import type {
  CurrentVector,
  Observation,
  OceanVariable,
  ProfilePoint,
  Stats,
} from "../types/ocean";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";


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
    let message = `API request failed: ${response.status}`;

    try {
      const body = await response.json();

      if (body?.detail) {
        message = body.detail;
      }
    } catch {
      // Keep the default error message when the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


export interface ObservationFilters {
  type?: "argo" | "glider";
  limit?: number;
}


export interface FieldFilters {
  variable?: OceanVariable;
  depth?: number;
}


export interface ProfileFilters {
  latitude: number;
  longitude: number;
}


export const apiOceanService = {
  async getObservations(
    filters: ObservationFilters = {},
  ): Promise<Observation[]> {
    const params = new URLSearchParams();

    if (filters.type) {
      params.set("type", filters.type);
    }

    if (filters.limit !== undefined) {
      params.set("limit", String(filters.limit));
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
      `/observations/${encodeURIComponent(observationId)}`,
    );
  },


  async getObservationProfile(
    observationId: string,
  ): Promise<ProfilePoint[]> {
    return request<ProfilePoint[]>(
      `/observations/${encodeURIComponent(observationId)}/profile`,
    );
  },


  async getObservationStats(): Promise<Stats> {
    return request<Stats>(
      "/observations/stats/summary",
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
      latitude: String(filters.latitude),
      longitude: String(filters.longitude),
    });

    return request<ProfilePoint[]>(
      `/field/profile?${params.toString()}`,
    );
  },


  async getField(
    filters: FieldFilters = {},
  ) {
    const params = new URLSearchParams();

    if (filters.variable) {
      params.set("variable", filters.variable);
    }

    if (filters.depth !== undefined) {
      params.set("depth", String(filters.depth));
    }

    const query = params.toString();

    return request(
      `/field/grid${query ? `?${query}` : ""}`,
    );
  },
};

import type {
  CurrentVector,
  Observation,
  OceanVariable,
  ProfilePoint,
  Stats,
} from "../types/ocean";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

// ── API request helper ────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const body = await response.json();

      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (body?.detail) {
        message = JSON.stringify(body.detail);
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ── Request types ─────────────────────────────────────────────────────────────

export interface ObservationFilters {
  type?: "argo" | "glider" | "buoy";
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

export interface LoginRequest {
  email: string;
  password: string;
}

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

// ── Ocean API service ─────────────────────────────────────────────────────────

export const apiOceanService = {
  // ── Observations ────────────────────────────────────────────────────────────

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

  // ── Ocean field ─────────────────────────────────────────────────────────────

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

  // ── Authentication ─────────────────────────────────────────────────────────

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
    payload: LoginRequest,
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
};

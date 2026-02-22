import Constants from "expo-constants";

const resolveApiBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return "http://localhost:3000";
  }

  const host = hostUri.split(":")[0];
  if (!host) {
    return "http://localhost:3000";
  }

  return `http://${host}:3000`;
};

const API_BASE_URL = resolveApiBaseUrl();

export interface ApiErrorDetails {
  status: number;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiError";
    this.status = details.status;
  }
}

export interface NadaMessageRequest {
  sessionNumber: number;
  totalGoal: number;
  isRest: boolean;
  mode: "normal" | "hypocrite";
}

export interface NadaMessageResponse {
  text: string;
  usage: number;
}

export interface SubscriptionStatusResponse {
  userId: string;
  entitlementId: string;
  isPremium: boolean;
}

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.trim().length > 0) {
      return body.error;
    }
  } catch {
    // Ignore JSON parse errors and fallback to status text.
  }

  if (response.statusText) return response.statusText;
  return "Request failed";
};

export const fetchNadaMessage = async (
  payload: NadaMessageRequest,
  token: string
): Promise<NadaMessageResponse> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/ai/nada-message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError({
      status: 0,
      message:
        "Network request failed. Make sure backend is running and reachable.",
    });
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: await parseErrorMessage(response),
    });
  }

  return response.json() as Promise<NadaMessageResponse>;
};

export const fetchSubscriptionStatus = async (
  token: string
): Promise<SubscriptionStatusResponse> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/subscription/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ApiError({
      status: 0,
      message:
        "Network request failed. Make sure backend is running and reachable.",
    });
  }

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      message: await parseErrorMessage(response),
    });
  }

  return response.json() as Promise<SubscriptionStatusResponse>;
};

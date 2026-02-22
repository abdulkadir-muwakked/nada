import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import NetInfo from "@react-native-community/netinfo";
import type { NadaPersona } from "../context/TimerSettingsContext";
import { ApiError, fetchNadaMessage } from "../lib/apiClient";

interface UseNadaMessageOptions {
  sessionNumber: number;
  totalGoal: number;
  currentMode: "focus" | "break";
  persona: NadaPersona;
  autoFetch?: boolean;
  enabled?: boolean;
}

interface UseNadaMessageResult {
  message: string;
  loading: boolean;
  error: "offline" | "unauthorized" | "forbidden" | "unknown" | null;
  refresh: () => Promise<void>;
  usage: number | null;
}

const unauthorizedFallback: Record<NadaPersona, string> = {
  normal: "Sign in again so I can judge your progress properly.",
  hypocrite: "Identity crisis detected. Sign in again, superstar.",
};

const premiumFallback: Record<NadaPersona, string> = {
  normal: "Premium is required for AI coaching. Upgrade to continue.",
  hypocrite: "Premium ticket required for Hypocrite mode.",
};

const offlineFallback: Record<NadaPersona, string> = {
  normal: "Offline mode: remember, progress beats perfection.",
  hypocrite: "No internet? Even your excuses are offline.",
};

const unknownFallback: Record<NadaPersona, string> = {
  normal: "Nada is speechless. Try again in a moment.",
  hypocrite: "Even I run out of insults. Give me another shot later.",
};

export const useNadaMessage = (
  options: UseNadaMessageOptions
): UseNadaMessageResult => {
  const { getToken } = useAuth();
  const {
    sessionNumber,
    totalGoal,
    currentMode,
    persona,
    autoFetch = true,
    enabled = true,
  } = options;

  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<
    "offline" | "unauthorized" | "forbidden" | "unknown" | null
  >(null);
  const [usage, setUsage] = useState<number | null>(null);
  const inFlightRef = useRef(false);
  const lastAutoFetchKeyRef = useRef<string>("");
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const connection = await NetInfo.fetch();
      if (!connection.isConnected) {
        setMessage(offlineFallback[persona]);
        setError("offline");
        return;
      }

      const token = await getTokenRef.current();
      if (!token) {
        setMessage(unauthorizedFallback[persona]);
        setError("unauthorized");
        return;
      }

      const mode = persona;
      const result = await fetchNadaMessage(
        {
          sessionNumber,
          totalGoal,
          isRest: currentMode === "break",
          mode,
        },
        token
      );

      setMessage(result.text);
      setUsage(result.usage);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 0) {
          setMessage(offlineFallback[persona]);
          setError("offline");
          return;
        }
        if (err.status === 401) {
          setMessage(unauthorizedFallback[persona]);
          setError("unauthorized");
          return;
        }
        if (err.status === 403) {
          setMessage(premiumFallback[persona]);
          setError("forbidden");
          return;
        }
        if (
          err.status === 500 &&
          err.message.toLowerCase().includes("server auth is not configured")
        ) {
          setMessage(unauthorizedFallback[persona]);
          setError("unauthorized");
          return;
        }
      }

      setMessage(unknownFallback[persona]);
      setError("unknown");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [
    currentMode,
    enabled,
    persona,
    sessionNumber,
    totalGoal,
  ]);

  useEffect(() => {
    if (!autoFetch || !enabled) {
      lastAutoFetchKeyRef.current = "";
      return;
    }

    const fetchKey = [
      sessionNumber,
      totalGoal,
      currentMode,
      persona,
    ].join("|");

    if (lastAutoFetchKeyRef.current === fetchKey) {
      return;
    }
    lastAutoFetchKeyRef.current = fetchKey;
    void refresh();
  }, [autoFetch, currentMode, enabled, persona, refresh, sessionNumber, totalGoal]);

  const stableMessage = useMemo(() => message, [message]);

  return {
    message: stableMessage,
    loading,
    error,
    refresh,
    usage,
  };
};

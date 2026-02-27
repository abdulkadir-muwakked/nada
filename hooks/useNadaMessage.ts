import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import NetInfo from "@react-native-community/netinfo";
import type { NadaPersona } from "../context/TimerSettingsContext";
import { getBreakMessage, getSessionStartMessage } from "../constants/AuthMessages";
import {
  getHypocriteBreakMessage,
  getHypocriteStartMessage,
} from "../constants/HypocriteMessages";
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

const getCachedFallbackMessage = (
  persona: NadaPersona,
  currentMode: "focus" | "break",
  allowHypocrite = true
): string => {
  const effectivePersona: NadaPersona =
    !allowHypocrite && persona === "hypocrite" ? "normal" : persona;

  if (currentMode === "break") {
    return effectivePersona === "hypocrite"
      ? getHypocriteBreakMessage()
      : getBreakMessage();
  }

  return effectivePersona === "hypocrite"
    ? getHypocriteStartMessage()
    : getSessionStartMessage();
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
        setMessage(getCachedFallbackMessage(persona, currentMode));
        setError("offline");
        return;
      }

      const token = await getTokenRef.current();
      if (!token) {
        setMessage(getCachedFallbackMessage(persona, currentMode));
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
          setMessage(getCachedFallbackMessage(persona, currentMode));
          setError("offline");
          return;
        }
        if (err.status === 401) {
          setMessage(getCachedFallbackMessage(persona, currentMode));
          setError("unauthorized");
          return;
        }
        if (err.status === 403) {
          // If premium is missing, keep the app tone active with local normal-mode messages.
          setMessage(getCachedFallbackMessage(persona, currentMode, false));
          setError("forbidden");
          return;
        }
        if (
          err.status === 500 &&
          err.message.toLowerCase().includes("server auth is not configured")
        ) {
          setMessage(getCachedFallbackMessage(persona, currentMode));
          setError("unauthorized");
          return;
        }
      }

      setMessage(getCachedFallbackMessage(persona, currentMode));
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

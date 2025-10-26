import { useCallback, useEffect, useMemo, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  TokenLimitError,
  getNadaLine,
  getTokenUsageSnapshot,
  type TokenUsageSnapshot,
} from "../lib/aiResponse";
import type { NadaPersona } from "../context/TimerSettingsContext";

interface UseNadaMessageOptions {
  sessionNumber: number;
  totalGoal: number;
  currentMode: "focus" | "break";
  persona: NadaPersona;
  intensity?: 1 | 2 | 3;
  autoFetch?: boolean;
}

interface UseNadaMessageResult {
  message: string;
  loading: boolean;
  error: "offline" | "limit" | "unknown" | null;
  refresh: () => Promise<void>;
  usage: TokenUsageSnapshot | null;
}

const limitFallback: Record<NadaPersona, string> = {
  default: "Nada is taking a breather—token limit reached for today.",
  mean: "You tapped the motivation keg dry. Come back tomorrow.",
  sugarcoated: "I’d love to cheer more, but I’m all out of confetti today!",
  clown: "Token bucket’s empty. Honk back later for more nonsense.",
};

const offlineFallback: Record<NadaPersona, string> = {
  default: "Offline mode: remember, progress beats perfection.",
  mean: "No connection, huh? Guess we’re both slacking now.",
  sugarcoated: "Offline hugs! Keep shining until we reconnect.",
  clown: "No internet? Honk twice if you can still focus!",
};

const unknownFallback: Record<NadaPersona, string> = {
  default: "Nada is speechless. Try again in a moment.",
  mean: "Even I run out of insults. Give me another shot later.",
  sugarcoated: "Glitch in the matrix! I’ll have sweeter words soon.",
  clown: "Whoops! I tripped on my own punchline. Retry soon.",
};

export const useNadaMessage = (
  options: UseNadaMessageOptions
): UseNadaMessageResult => {
  const {
    sessionNumber,
    totalGoal,
    currentMode,
    persona,
    intensity = 2,
    autoFetch = true,
  } = options;

  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<"offline" | "limit" | "unknown" | null>(
    null
  );
  const [usage, setUsage] = useState<TokenUsageSnapshot | null>(null);

  const fetchUsage = useCallback(async () => {
    const snapshot = await getTokenUsageSnapshot();
    setUsage(snapshot);
    return snapshot;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const connection = await NetInfo.fetch();
      if (!connection.isConnected) {
        setMessage(offlineFallback[persona]);
        setError("offline");
        await fetchUsage();
        return;
      }

      const line = await getNadaLine(
        sessionNumber,
        totalGoal,
        currentMode,
        persona,
        intensity
      );
      setMessage(line);
      setError(null);
      await fetchUsage();
    } catch (err) {
      if (err instanceof TokenLimitError) {
        setMessage(limitFallback[persona]);
        setError("limit");
        await fetchUsage();
        return;
      }
      console.error("Failed to fetch Nada message:", err);
      setMessage(unknownFallback[persona]);
      setError("unknown");
      await fetchUsage();
    } finally {
      setLoading(false);
    }
  }, [
    currentMode,
    fetchUsage,
    intensity,
    persona,
    sessionNumber,
    totalGoal,
  ]);

  useEffect(() => {
    let active = true;
    if (autoFetch) {
      refresh().catch((error) => {
        if (active) {
          console.error("Failed to auto-fetch Nada message:", error);
        }
      });
    } else {
      fetchUsage().catch((error) =>
        console.error("Failed to load token usage snapshot:", error)
      );
    }
    return () => {
      active = false;
    };
  }, [autoFetch, fetchUsage, refresh]);

  const stableMessage = useMemo(() => message, [message]);

  return {
    message: stableMessage,
    loading,
    error,
    refresh,
    usage,
  };
};

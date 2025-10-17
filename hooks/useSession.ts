import { useCallback, useEffect, useState } from "react";
import { UseSessionProps, UseSessionReturn } from "../types/timer";
import {
  initializeSessions,
  recordCompletedFocusSession,
} from "../utils/sessionUtil";
import {
  initializeStreak,
  recordCompletedSession as recordCompletedSessionStreak,
} from "../utils/streakManager";

export const useSession = ({
  onSessionComplete,
}: UseSessionProps = {}): UseSessionReturn => {
  const [currentSession, setCurrentSession] = useState<number>(0);
  const [sessionGoal, setSessionGoal] = useState<number>(4);
  const [streak, setStreak] = useState<number>(0);

  const loadSessionData = useCallback(async () => {
    try {
      const currentStreak = await initializeStreak();
      setStreak(currentStreak);

      const { sessionsCount, sessionGoal: goal } = await initializeSessions();
      setCurrentSession(sessionsCount);
      setSessionGoal(goal);
    } catch (error) {
      console.error("Error loading session data:", error);
    }
  }, []);

  useEffect(() => {
    loadSessionData().catch((error) => {
      console.error("Failed to load session data:", error);
    });
  }, [loadSessionData]);

  // Record a completed session and update UI
  const recordCompletedSession = async (
    durationSeconds: number,
    completedAt?: Date
  ): Promise<number> => {
    try {
      // Update streak count
      const updatedStreak = await recordCompletedSessionStreak();
      setStreak(updatedStreak);

      // Update sessions count
      const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
      const updatedSessions = await recordCompletedFocusSession(
        durationMinutes,
        completedAt ?? new Date()
      );
      setCurrentSession(updatedSessions);

      // Call the callback if provided
      if (onSessionComplete) {
        onSessionComplete();
      }

      return updatedSessions;
    } catch (error) {
      console.error("Error recording completed session:", error);
      return currentSession;
    }
  };

  return {
    currentSession,
    sessionGoal,
    streak,
    recordCompletedSession,
    refreshSessions: loadSessionData,
  };
};

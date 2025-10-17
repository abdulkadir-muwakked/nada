import { useCallback, useEffect, useMemo, useState } from "react";
import {
  SessionHistoryMap,
  getSessionHistory,
  resetSessionData,
} from "../utils/sessionUtil";

export type HistoryRange = "7d" | "month";

export interface DailySummary {
  date: string;
  sessions: number;
  minutes: number;
}

export interface SessionStats {
  todaySessions: number;
  todayMinutes: number;
  weekSessions: number;
  weekMinutes: number;
  bestDay?: {
    date: string;
    sessions: number;
    minutes: number;
  };
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildRangeData = (
  history: SessionHistoryMap,
  range: HistoryRange
): DailySummary[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

  if (range === "7d") {
    endDate = new Date(today);
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
  } else {
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const days: DailySummary[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const key = formatDateKey(cursor);
    const entry = history[key];
    days.push({
      date: key,
      sessions: entry?.sessions ?? 0,
      minutes: entry?.minutes ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const computeStats = (history: SessionHistoryMap): SessionStats => {
  const todayKey = formatDateKey(new Date());
  const todayEntry = history[todayKey];

  const todaySessions = todayEntry?.sessions ?? 0;
  const todayMinutes = todayEntry?.minutes ?? 0;

  const weekSummaries = buildRangeData(history, "7d");
  const weekSessions = weekSummaries.reduce((sum, day) => sum + day.sessions, 0);
  const weekMinutes = weekSummaries.reduce((sum, day) => sum + day.minutes, 0);

  let bestDay: SessionStats["bestDay"];
  Object.entries(history).forEach(([key, value]) => {
    if (!value) return;
    if (!bestDay) {
      bestDay = { date: key, sessions: value.sessions, minutes: value.minutes };
      return;
    }
    if (
      value.sessions > bestDay.sessions ||
      (value.sessions === bestDay.sessions && value.minutes > bestDay.minutes)
    ) {
      bestDay = { date: key, sessions: value.sessions, minutes: value.minutes };
    }
  });

  return {
    todaySessions,
    todayMinutes,
    weekSessions,
    weekMinutes,
    bestDay,
  };
};

export const useSessionHistory = (initialRange: HistoryRange = "month") => {
  const [history, setHistory] = useState<SessionHistoryMap>({});
  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const map = await getSessionHistory();
      setHistory(map);
    } catch (error) {
      console.error("Error loading session history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((error) => {
      console.error("Failed to refresh session history:", error);
    });
  }, [refresh]);

  const data = useMemo(() => buildRangeData(history, range), [history, range]);
  const stats = useMemo(() => computeStats(history), [history]);

  const resetHistory = useCallback(async () => {
    await resetSessionData();
    await refresh();
  }, [refresh]);

  return {
    range,
    setRange,
    data,
    stats,
    loading,
    refresh,
    resetHistory,
  };
};

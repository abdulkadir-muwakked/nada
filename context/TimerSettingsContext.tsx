import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type NadaPersona = "normal" | "hypocrite";

export interface TimerSettings {
  focusSessionsPerCycle: number;
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  persona: NadaPersona;
}

interface TimerSettingsContextValue {
  settings: TimerSettings;
  updateSettings: (updates: Partial<TimerSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = "@nada_timer_settings_v1";

const defaultSettings: TimerSettings = {
  focusSessionsPerCycle: 4,
  focusDurationMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 25,
  persona: "normal",
};

const TimerSettingsContext = createContext<TimerSettingsContextValue | null>(
  null
);

const sanitizeNumber = (value: unknown, fallback: number, min = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback;
  }
  return Math.round(parsed);
};

const sanitizePersona = (value: unknown): NadaPersona => {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["normal", "hypocrite"].includes(lower)) {
      return lower as NadaPersona;
    }
  }
  return defaultSettings.persona;
};

const sanitizeSettings = (values: Partial<TimerSettings>): TimerSettings => ({
  focusSessionsPerCycle: sanitizeNumber(
    values.focusSessionsPerCycle,
    defaultSettings.focusSessionsPerCycle,
    1
  ),
  focusDurationMinutes: sanitizeNumber(
    values.focusDurationMinutes,
    defaultSettings.focusDurationMinutes,
    1
  ),
  shortBreakMinutes: sanitizeNumber(
    values.shortBreakMinutes,
    defaultSettings.shortBreakMinutes,
    1
  ),
  longBreakMinutes: sanitizeNumber(
    values.longBreakMinutes,
    defaultSettings.longBreakMinutes,
    1
  ),
  persona: sanitizePersona(values.persona),
});

export const TimerSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);

  const persistSettings = useCallback(async (next: TimerSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to persist timer settings:", error);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const sanitized = sanitizeSettings({ ...defaultSettings, ...parsed });
          setSettings(sanitized);
        }
      } catch (error) {
        console.error("Failed to load timer settings:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<TimerSettings>) => {
      let nextSettings = defaultSettings;
      setSettings((prev) => {
        nextSettings = sanitizeSettings({ ...prev, ...updates });
        return nextSettings;
      });
      await persistSettings(nextSettings);
    },
    [persistSettings]
  );

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    await persistSettings(defaultSettings);
  }, [persistSettings]);

  const value = useMemo<TimerSettingsContextValue>(
    () => ({ settings, updateSettings, resetSettings, loading }),
    [loading, resetSettings, settings, updateSettings]
  );

  return (
    <TimerSettingsContext.Provider value={value}>
      {children}
    </TimerSettingsContext.Provider>
  );
};

export const useTimerSettings = () => {
  const context = useContext(TimerSettingsContext);
  if (!context) {
    throw new Error(
      "useTimerSettings must be used within a TimerSettingsProvider"
    );
  }
  return context;
};

export { defaultSettings as defaultTimerSettings };

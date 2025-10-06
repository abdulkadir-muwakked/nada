import { TimerPreset } from "../types/timer";

// Timer duration presets
export const TIMER_PRESETS: TimerPreset[] = [
  { label: "15m", value: 15 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "45m", value: 45 * 60 },
];

// Rest duration presets
export const REST_PRESETS: TimerPreset[] = [
  { label: "5m", value: 5 * 60 },
  { label: "10m", value: 10 * 60 },
  { label: "15m", value: 15 * 60 },
];

// Default rest preset
export const DEFAULT_REST_PRESET: TimerPreset = {
  label: "Rest 5m",
  value: 5 * 60,
};

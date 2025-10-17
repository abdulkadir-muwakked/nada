export interface TimerState {
  isRunning: boolean;
  isRest: boolean;
  timerSeconds: number;
  focusDuration: number;
  breakDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  focusSessionsPerCycle: number;
  startTime: number | null;
  lastActiveTime: number;
  notificationId: string | null;
  completedFocusSessions: number;
}

export interface TimerPreset {
  label: string;
  value: number;
}

export interface FocusCompletionPayload {
  durationSeconds: number;
  completedAt: Date;
}

export interface UseTimerProps {
  initialFocusDuration?: number;
  initialBreakDuration?: number;
  onFocusComplete?: (payload: FocusCompletionPayload) => Promise<void> | void;
}

export interface UseTimerReturn {
  isRunning: boolean;
  isRest: boolean;
  timerSeconds: number;
  focusDuration: number;
  breakDuration: number;
  selectedPreset: number;
  notificationsPermission: boolean;
  taskCompleted: boolean;
  currentMessage: string;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  toggleTimerMode: () => Promise<void>;
  updateTimerDuration: (isRestMode: boolean, newDuration: number) => Promise<void>;
  formatTime: (seconds: number) => string;
}

export interface UseSessionProps {
  onSessionComplete?: () => void;
}

export interface UseSessionReturn {
  currentSession: number;
  sessionGoal: number;
  streak: number;
  recordCompletedSession: (
    durationSeconds: number,
    completedAt?: Date
  ) => Promise<number>;
  refreshSessions: () => Promise<void>;
}

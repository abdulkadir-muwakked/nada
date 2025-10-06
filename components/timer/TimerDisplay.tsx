import React from "react";
import { StyleSheet, Text, View } from "react-native";
import CircularProgress from "../../components/CircularProgress";
import { NadaTheme } from "../../constants/NadaTheme";
import {
  calculateTimerProgress,
  formatTime,
  getTimerLabel,
} from "../../utils/timer/timerUtils";

interface TimerDisplayProps {
  timerSeconds: number;
  focusDuration: number;
  breakDuration: number;
  isRest: boolean;
  isRunning: boolean;
  taskCompleted: boolean;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerSeconds,
  focusDuration,
  breakDuration,
  isRest,
  isRunning,
  taskCompleted,
}) => {
  // Calculate normalized progress based on timer mode
  const totalDuration = isRest ? breakDuration : focusDuration;
  const normalizedProgress = calculateTimerProgress(
    timerSeconds,
    totalDuration,
    isRest
  );

  // Determine the progress color based on task completion state
  const progressColor = taskCompleted ? NadaTheme.colors.primary : "#ff6b6b";

  return (
    <View style={styles.timerContainer}>
      <CircularProgress
        progress={normalizedProgress}
        mode={isRest ? "break" : "focus"}
        size={180}
        strokeWidth={6}
        backgroundColor="rgba(255, 255, 255, 0.1)"
        progressColor={progressColor}
        animated={isRunning}
      />
      <View style={styles.timerDisplay}>
        <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
        <Text
          style={[
            styles.timerLabel,
            taskCompleted && { color: NadaTheme.colors.primary },
          ]}
        >
          {getTimerLabel(isRest, isRunning, taskCompleted)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    position: "relative",
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  timerDisplay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  timerTime: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 5,
  },
  timerLabel: {
    fontSize: 14,
    color: "#a0a0a0",
    fontWeight: "500",
  },
});

export default TimerDisplay;

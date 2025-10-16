import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import CircularProgress from "../../components/CircularProgress";
import { useTheme } from "../../hooks/useTheme";
import type { NadaThemeColors } from "../../types/nada";
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const modeTransition = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(modeTransition, {
        toValue: 0.94,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(modeTransition, {
        toValue: 1,
        speed: 12,
        bounciness: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modeTransition, isRest, taskCompleted]);

  const totalDuration = isRest ? breakDuration : focusDuration;
  const normalizedProgress = calculateTimerProgress(
    timerSeconds,
    totalDuration,
    isRest
  );

  const progressColor = colors.primary;
  const trackColor = colors.highlight;

  return (
    <View style={styles.timerContainer}>
      <CircularProgress
        progress={normalizedProgress}
        mode={isRest ? "break" : "focus"}
        size={180}
        strokeWidth={6}
        backgroundColor={trackColor}
        progressColor={progressColor}
        animated={isRunning}
      />
      <Animated.View
        style={[styles.timerDisplay, { transform: [{ scale: modeTransition }] }]}
      >
        <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
        <Text
          style={[
            styles.timerLabel,
            taskCompleted && { color: colors.primary },
          ]}
        >
          {getTimerLabel(isRest, isRunning, taskCompleted)}
        </Text>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: NadaThemeColors) =>
  StyleSheet.create({
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
      color: colors.text,
      marginBottom: 5,
    },
    timerLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
  });

export default TimerDisplay;

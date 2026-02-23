import React, { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type CircularProgressProps = {
  progress: number;
  mode: "focus" | "break";
  size: number;
  strokeWidth: number;
  backgroundColor?: string;
  progressColor?: string;
  animated?: boolean;
};

const CircularProgress = ({
  progress,
  mode,
  size = 180,
  strokeWidth = 6,
  backgroundColor = "rgba(255, 255, 255, 0.1)",
  progressColor = "#ff6b6b",
  animated = true,
}: CircularProgressProps) => {
  const isMountedRef = useRef(true);
  const initialProgress = Math.max(0, Math.min(1, progress));
  const animatedProgressRef = useRef(
    new Animated.Value(initialProgress)
  ).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const adjustedProgress = progress;
  const prevModeRef = useRef(mode);
  const prevProgressRef = useRef(progress);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Stop any running animation on unmount
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (prevModeRef.current !== mode) {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      animatedProgressRef.setValue(progress);
      prevModeRef.current = mode;
      prevProgressRef.current = progress;
    }
  }, [mode, progress, animatedProgressRef]);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (animated) {
      const previousProgress = prevProgressRef.current;
      const clampedProgress = Math.max(0, Math.min(1, adjustedProgress));
      const delta = Math.abs(clampedProgress - previousProgress);
      const duration = Math.max(120, Math.min(650, delta * 900));

      // Stop previous animation before starting new one
      if (animationRef.current) {
        animationRef.current.stop();
      }

      animationRef.current = Animated.timing(animatedProgressRef, {
        toValue: clampedProgress,
        duration,
        // SVG stroke props are not supported by native driver.
        useNativeDriver: false,
        easing: (t) => t,
      });

      animationRef.current.start(({ finished }) => {
        if (finished && isMountedRef.current) {
          animationRef.current = null;
        }
      });

      prevProgressRef.current = clampedProgress;
    } else {
      if (!isMountedRef.current) return;
      animatedProgressRef.setValue(adjustedProgress);
      prevProgressRef.current = adjustedProgress;
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [adjustedProgress, animated, animatedProgressRef]);

  const strokeDashoffset = animatedProgressRef.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
    extrapolate: "clamp",
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
          fill="rgba(255, 255, 255, 0.05)"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={progressColor}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          strokeMiterlimit={10}
          strokeOpacity={1}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default memo(CircularProgress);

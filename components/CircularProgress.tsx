import React, { useEffect, useRef, memo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

/**
 * CircularProgress component props
 * This component displays a circular progress indicator that can show progress in two modes:
 * - focus mode: ring decreases from full to empty as timer counts down
 * - break mode: ring increases from empty to full as timer counts down
 * 
 * The parent component should provide the appropriate progress value based on mode:
 * - For focus mode: progress = remainingTime / totalTime (decreases 1→0)
 * - For break mode: progress = 1 - (remainingTime / totalTime) (increases 0→1)
 */
type CircularProgressProps = {
  progress: number;  // Value between 0 and 1, normalized based on mode (see above)
  mode: "focus" | "break";  // Indicates the timer mode - affects certain behaviors
  size: number;  // Size of the circle in pixels
  strokeWidth: number;  // Width of the progress stroke
  backgroundColor?: string;  // Color of the background circle
  progressColor?: string;  // Color of the progress indicator
  animated?: boolean;  // Whether transitions should be animated
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
  // Create an animated value that will drive the circular progress
  // Ensure initial value is within valid range (0-1)
  const initialProgress = Math.max(0, Math.min(1, progress));
  const animatedProgressRef = useRef(new Animated.Value(initialProgress)).current;

  // Calculate properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Use progress directly - the parent component already adjusts it based on mode:
  // - Focus mode: progress decreases from 1 to 0 (starts full, goes to empty)
  // - Break mode: progress increases from 0 to 1 (starts empty, goes to full)
  const adjustedProgress = progress;
  
  // Reset the animation when mode changes to avoid awkward transitions
  const prevModeRef = useRef(mode);
  const prevProgressRef = useRef(progress);
  
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      // Mode changed - the parent component already sends the correct progress value
      // for each mode, so we can just use it directly to ensure smooth transitions
      
      // Reset animation immediately to the new progress value
      animatedProgressRef.setValue(progress);
      
      // Update the refs
      prevModeRef.current = mode;
      prevProgressRef.current = progress;
    }
  }, [mode, progress, animatedProgressRef]);
  
  // Update animated value when progress changes
  useEffect(() => {
    // For smooth transitions, don't stop running animations when small progress updates occur
    // This prevents jerky movement especially during countdown
    
    if (animated) {
      // Use a shorter duration for smoother ticking during countdown
      // but still noticeable enough to see the progress
      Animated.timing(animatedProgressRef, {
        toValue: adjustedProgress,
        duration: 500, // Fast enough for smooth progress but still visible
        useNativeDriver: true, // Use native driver for better performance
        // Linear easing ensures consistent speed throughout the animation
        easing: (t) => t, // Linear easing function
      }).start();
    } else {
      // Immediately set the value without animation
      animatedProgressRef.setValue(adjustedProgress);
    }
  }, [adjustedProgress, animated, animatedProgressRef]);
  
  // Calculate stroke dash offset from progress
  const strokeDashoffset = animatedProgressRef.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0], // 0 = empty circle (start of break mode), circumference = full circle (start of focus mode)
    extrapolate: 'clamp', // Prevent values outside of 0-1 range
  });
  
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle - always visible as a track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={backgroundColor}
          fill="rgba(255, 255, 255, 0.05)" // Slightly visible fill to match app design
        />
        
        {/* Progress Circle - dynamic part that animates */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={progressColor}
          fill="transparent"
          strokeLinecap="round" // Rounded line ends for smoother appearance
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          // Rotate so the circle starts at the top (12 o'clock position)
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
          // Add these properties for smoother rendering
          strokeMiterlimit={10}
          strokeOpacity={1}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// Memoize the component to prevent unnecessary re-renders when parent re-renders
export default memo(CircularProgress);

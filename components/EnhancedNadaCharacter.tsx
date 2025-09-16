import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, ViewStyle } from "react-native";
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { NadaTheme } from "../constants/NadaTheme";

// Expression types that Nada can display
export type NadaExpression =
  | "neutral"
  | "taskStart"
  | "focusOngoing"
  | "breakTime"
  | "taskComplete";

interface NadaCharacterProps {
  size?: number;
  expression?: NadaExpression;
  style?: ViewStyle;
}

/**
 * EnhancedNadaCharacter component with various expressions and animations
 * - neutral: Default unbothered face
 * - taskStart: Raised eyebrow + smirk
 * - focusOngoing: Neutral/unimpressed face
 * - breakTime: Slight eye roll
 * - taskComplete: Sarcastic smile/eyebrow drop
 */
const EnhancedNadaCharacter: React.FC<NadaCharacterProps> = ({
  size = 1,
  expression = "neutral",
  style,
}) => {
  // RN Animated values for floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Reanimated shared values for facial expressions
  const leftEyebrowHeight = useSharedValue(0);
  const rightEyebrowHeight = useSharedValue(0);
  const leftEyePosition = useSharedValue(0);
  const rightEyePosition = useSharedValue(0);
  const mouthCurve = useSharedValue(0); // 0 is neutral, positive is smile, negative is frown
  const mouthWidth = useSharedValue(0); // 0 is normal, negative is thinner, positive is wider
  const blinkOpacity = useSharedValue(1);

  // Idle animation counter for random blinks
  const idleCounter = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Character size calculations
  const characterSize = 100 * size;
  const eyeSize = 12 * size;
  const eyebrowSize = 16 * size;
  const eyebrowThickness = 2.5 * size;
  const mouthSize = 20 * size;
  const mouthHeight = 10 * size;
  const eyeGap = 20 * size;

  // Set up floating animation
  useEffect(() => {
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5 * size,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatingAnimation.start();

    return () => {
      floatingAnimation.stop();
    };
  }, [floatAnim, size]);

  // Set up random idle animations (blinking, tiny shifts)
  useEffect(() => {
    const triggerRandomAnimation = () => {
      // Random blink animation
      const randomBlink = () => {
        blinkOpacity.value = withSequence(
          withTiming(0, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
      };

      // Random tiny head movements via eyebrow/eye adjustments
      const randomMicroMovement = () => {
        const tiny = (Math.random() - 0.5) * 2;
        leftEyePosition.value = withSequence(
          withTiming(tiny, { duration: 300 }),
          withTiming(0, { duration: 300 })
        );
        rightEyePosition.value = withSequence(
          withTiming(tiny, { duration: 300 }),
          withTiming(0, { duration: 300 })
        );
      };

      // Randomly decide which idle animation to do
      const rand = Math.random();
      if (rand < 0.7) {
        randomBlink();
      } else {
        randomMicroMovement();
      }

      // Set next random animation time (between 2-8 seconds)
      const nextAnimTime = 2000 + Math.random() * 6000;
      idleCounter.current = setTimeout(triggerRandomAnimation, nextAnimTime);
    };

    // Start the idle animation cycle
    idleCounter.current = setTimeout(triggerRandomAnimation, 3000);

    return () => {
      if (idleCounter.current) {
        clearTimeout(idleCounter.current);
      }
    };
  }, [blinkOpacity, leftEyePosition, rightEyePosition]);

  // Update facial expression based on the expression prop
  useEffect(() => {
    const animationConfig = {
      duration: 600,
      easing: ReanimatedEasing.bezier(0.25, 0.1, 0.25, 1),
    };

    switch (expression) {
      case "taskStart":
        // Raised eyebrow + smirk
        leftEyebrowHeight.value = withTiming(0, animationConfig);
        rightEyebrowHeight.value = withTiming(-4 * size, animationConfig);
        mouthCurve.value = withTiming(1 * size, animationConfig);
        mouthWidth.value = withTiming(2 * size, animationConfig);
        break;

      case "focusOngoing":
        // Neutral/unimpressed face
        leftEyebrowHeight.value = withTiming(0, animationConfig);
        rightEyebrowHeight.value = withTiming(0, animationConfig);
        mouthCurve.value = withTiming(0, animationConfig);
        mouthWidth.value = withTiming(0, animationConfig);
        break;

      case "breakTime":
        // Slight eye roll
        leftEyePosition.value = withTiming(-3 * size, animationConfig);
        rightEyePosition.value = withTiming(-3 * size, animationConfig);
        leftEyebrowHeight.value = withTiming(2 * size, animationConfig);
        rightEyebrowHeight.value = withTiming(2 * size, animationConfig);
        mouthCurve.value = withTiming(-1 * size, animationConfig);
        mouthWidth.value = withTiming(-1 * size, animationConfig);
        break;

      case "taskComplete":
        // Sarcastic smile or eyebrow drop
        leftEyebrowHeight.value = withTiming(3 * size, animationConfig);
        rightEyebrowHeight.value = withTiming(3 * size, animationConfig);
        mouthCurve.value = withTiming(3 * size, animationConfig);
        mouthWidth.value = withTiming(4 * size, animationConfig);
        break;

      case "neutral":
      default:
        // Reset to neutral expression
        leftEyebrowHeight.value = withTiming(0, animationConfig);
        rightEyebrowHeight.value = withTiming(0, animationConfig);
        leftEyePosition.value = withTiming(0, animationConfig);
        rightEyePosition.value = withTiming(0, animationConfig);
        mouthCurve.value = withTiming(0, animationConfig);
        mouthWidth.value = withTiming(0, animationConfig);
        break;
    }
  }, [
    expression,
    leftEyebrowHeight,
    rightEyebrowHeight,
    leftEyePosition,
    rightEyePosition,
    mouthCurve,
    mouthWidth,
    size,
  ]);

  // Create animated styles for facial features
  const leftEyebrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: leftEyebrowHeight.value }],
  }));

  const rightEyebrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rightEyebrowHeight.value }],
  }));

  const leftEyeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: leftEyePosition.value }],
    opacity: blinkOpacity.value,
  }));

  const rightEyeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rightEyePosition.value }],
    opacity: blinkOpacity.value,
  }));

  const mouthStyle = useAnimatedStyle(() => {
    // Dynamic mouth shape based on mouthCurve value
    return {
      width: mouthSize + mouthWidth.value,
      height: mouthHeight + mouthCurve.value,
      borderRadius:
        mouthCurve.value < 0
          ? (10 + Math.abs(mouthCurve.value) * 2) * size
          : (20 - mouthCurve.value * 2) * size,
    };
  });

  // Character face and container styles
  const characterFaceStyle: ViewStyle = {
    width: characterSize,
    height: characterSize,
    backgroundColor: NadaTheme.colors.primary,
    borderRadius: characterSize / 2,
    position: "relative",
    shadowColor: NadaTheme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  };

  const eyesContainerStyle: ViewStyle = {
    position: "absolute",
    top: 35 * size,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: eyeGap,
  };

  const baseEyeStyle: ViewStyle = {
    width: eyeSize,
    height: eyeSize,
    backgroundColor: NadaTheme.colors.background,
    borderRadius: eyeSize / 2,
  };

  const eyebrowStyle: ViewStyle = {
    position: "absolute",
    width: eyebrowSize,
    height: eyebrowThickness,
    backgroundColor: NadaTheme.colors.background,
    borderRadius: eyebrowThickness / 2,
    top: -10 * size,
    left: (eyeSize - eyebrowSize) / 2,
  };

  const baseMouthStyle: ViewStyle = {
    position: "absolute",
    bottom: 30 * size,
    left: "50%",
    marginLeft: -mouthSize / 2,
    borderWidth: 2 * size,
    borderColor: NadaTheme.colors.background,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20 * size,
    borderBottomRightRadius: 20 * size,
  };

  return (
    <Animated.View
      style={[
        {
          marginBottom: 10 * size,
          transform: [{ translateY: floatAnim }],
        },
        style,
      ]}
    >
      <View style={characterFaceStyle}>
        <View style={eyesContainerStyle}>
          {/* Left eye with eyebrow */}
          <View style={{ position: "relative" }}>
            <Reanimated.View style={[baseEyeStyle, leftEyeStyle]} />
            <Reanimated.View style={[eyebrowStyle, leftEyebrowStyle]} />
          </View>

          {/* Right eye with eyebrow */}
          <View style={{ position: "relative" }}>
            <Reanimated.View style={[baseEyeStyle, rightEyeStyle]} />
            <Reanimated.View style={[eyebrowStyle, rightEyebrowStyle]} />
          </View>
        </View>

        {/* Mouth that changes shape based on expression */}
        <Reanimated.View style={[baseMouthStyle, mouthStyle]} />
      </View>
    </Animated.View>
  );
};

export default EnhancedNadaCharacter;

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View, ViewStyle } from "react-native";
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
 * EnhancedNadaCharacter component with various expressions and animations.
 */
const EnhancedNadaCharacter: React.FC<NadaCharacterProps> = ({
  size = 1,
  expression = "neutral",
  style,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const leftEyebrowY = useRef(new Animated.Value(0)).current;
  const rightEyebrowY = useRef(new Animated.Value(0)).current;
  const leftEyeX = useRef(new Animated.Value(0)).current;
  const rightEyeX = useRef(new Animated.Value(0)).current;
  const blinkOpacity = useRef(new Animated.Value(1)).current;
  const idleCounter = useRef<ReturnType<typeof setTimeout> | null>(null);

  const characterSize = 100 * size;
  const eyeSize = 12 * size;
  const eyebrowSize = 16 * size;
  const eyebrowThickness = 2.5 * size;
  const mouthSize = 20 * size;
  const eyeGap = 20 * size;

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
    return () => floatingAnimation.stop();
  }, [floatAnim, size]);

  useEffect(() => {
    const triggerRandomAnimation = () => {
      const rand = Math.random();
      if (rand < 0.7) {
        Animated.sequence([
          Animated.timing(blinkOpacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(blinkOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        const tiny = (Math.random() - 0.5) * 2;
        Animated.parallel([
          Animated.sequence([
            Animated.timing(leftEyeX, {
              toValue: tiny,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(leftEyeX, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rightEyeX, {
              toValue: tiny,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(rightEyeX, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }

      const nextAnimTime = 2000 + Math.random() * 6000;
      idleCounter.current = setTimeout(triggerRandomAnimation, nextAnimTime);
    };

    idleCounter.current = setTimeout(triggerRandomAnimation, 3000);

    return () => {
      if (idleCounter.current) clearTimeout(idleCounter.current);
    };
  }, [blinkOpacity, leftEyeX, rightEyeX]);

  useEffect(() => {
    const config = {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true as const,
    };

    let nextLeftEyebrow = 0;
    let nextRightEyebrow = 0;
    let nextLeftEye = 0;
    let nextRightEye = 0;

    if (expression === "taskStart") {
      nextRightEyebrow = -4 * size;
    } else if (expression === "breakTime") {
      nextLeftEyebrow = 2 * size;
      nextRightEyebrow = 2 * size;
      nextLeftEye = -3 * size;
      nextRightEye = -3 * size;
    } else if (expression === "taskComplete") {
      nextLeftEyebrow = 3 * size;
      nextRightEyebrow = 3 * size;
    }

    Animated.parallel([
      Animated.timing(leftEyebrowY, { toValue: nextLeftEyebrow, ...config }),
      Animated.timing(rightEyebrowY, { toValue: nextRightEyebrow, ...config }),
      Animated.timing(leftEyeX, { toValue: nextLeftEye, ...config }),
      Animated.timing(rightEyeX, { toValue: nextRightEye, ...config }),
    ]).start();
  }, [expression, leftEyebrowY, rightEyebrowY, leftEyeX, rightEyeX, size]);

  const mouthMetrics = useMemo(() => {
    switch (expression) {
      case "taskStart":
        return { width: mouthSize + 2 * size, height: 10 * size + 1 * size, curve: 1 * size };
      case "breakTime":
        return { width: mouthSize - 1 * size, height: 10 * size - 1 * size, curve: -1 * size };
      case "taskComplete":
        return { width: mouthSize + 4 * size, height: 10 * size + 3 * size, curve: 3 * size };
      default:
        return { width: mouthSize, height: 10 * size, curve: 0 };
    }
  }, [expression, mouthSize, size]);

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

  const mouthStyle: ViewStyle = {
    position: "absolute",
    bottom: 30 * size,
    left: "50%",
    marginLeft: -mouthMetrics.width / 2,
    width: mouthMetrics.width,
    height: mouthMetrics.height,
    borderWidth: 2 * size,
    borderColor: NadaTheme.colors.background,
    borderTopWidth: 0,
    borderBottomLeftRadius:
      mouthMetrics.curve < 0
        ? (10 + Math.abs(mouthMetrics.curve) * 2) * size
        : (20 - mouthMetrics.curve * 2) * size,
    borderBottomRightRadius:
      mouthMetrics.curve < 0
        ? (10 + Math.abs(mouthMetrics.curve) * 2) * size
        : (20 - mouthMetrics.curve * 2) * size,
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
          <View style={{ position: "relative" }}>
            <Animated.View
              style={[baseEyeStyle, { transform: [{ translateX: leftEyeX }], opacity: blinkOpacity }]}
            />
            <Animated.View style={[eyebrowStyle, { transform: [{ translateY: leftEyebrowY }] }]} />
          </View>

          <View style={{ position: "relative" }}>
            <Animated.View
              style={[baseEyeStyle, { transform: [{ translateX: rightEyeX }], opacity: blinkOpacity }]}
            />
            <Animated.View style={[eyebrowStyle, { transform: [{ translateY: rightEyebrowY }] }]} />
          </View>
        </View>

        <View style={mouthStyle} />
      </View>
    </Animated.View>
  );
};

export default EnhancedNadaCharacter;

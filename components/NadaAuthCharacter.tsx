import React, { useEffect } from "react";
import { Animated, View, ViewStyle } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface NadaAuthCharacterProps {
  size?: number;
}

const NadaAuthCharacter: React.FC<NadaAuthCharacterProps> = ({
  size = 1.2,
}) => {
  // Animation setup
  const floatAnim = React.useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // Subtle floating animation
    const floatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    floatingAnimation();
  }, [floatAnim]);

  // Scale the character based on size prop
  const characterSize = 120 * size;
  const eyeSize = 14 * size;
  const mouthSize = 24 * size;
  const mouthHeight = 6 * size; // Flatter mouth for indifferent expression
  const eyeGap = 24 * size;

  // Create styles with proper type definitions
  const characterFaceStyle: ViewStyle = {
    width: characterSize,
    height: characterSize,
    borderRadius: characterSize / 2,
    backgroundColor: NadaTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  const eyeStyle: ViewStyle = {
    width: eyeSize,
    height: eyeSize * 0.65, // Narrower eyes for more indifference
    borderRadius: eyeSize / 2,
    backgroundColor: NadaTheme.colors.background,
    transform: [{ rotate: "-5deg" }], // Slightly rotated for "don't give a shit" look
  };

  const eyesStyle: ViewStyle = {
    flexDirection: "row",
    gap: eyeGap,
    marginTop: -characterSize * 0.1,
  };

  const mouthStyle: ViewStyle = {
    width: mouthSize,
    height: mouthHeight,
    backgroundColor: NadaTheme.colors.background,
    borderRadius: mouthHeight / 2,
    position: "absolute",
    bottom: characterSize * 0.3,
    // Flat straight line for mouth with a slight downward angle for more disdain
    transform: [{ rotate: "-10deg" }, { scaleX: 0.9 }],
  };

  return (
    <Animated.View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateY: floatAnim }],
        },
      ]}
    >
      <View style={characterFaceStyle}>
        <View style={eyesStyle}>
          <View style={eyeStyle} />
          <View style={eyeStyle} />
        </View>
        <View style={mouthStyle} />
      </View>
    </Animated.View>
  );
};

export default NadaAuthCharacter;

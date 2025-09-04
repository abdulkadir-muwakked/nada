import React, { useEffect } from "react";
import { Animated, View, ViewStyle } from "react-native";
import { nadaStyles } from "./NadaLogo";

interface NadaCharacterProps {
  size?: number; // Custom size multiplier
}

const NadaCharacter: React.FC<NadaCharacterProps> = ({ size = 1 }) => {
  // Animation setup
  const floatAnim = React.useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // Floating animation for Nada character
    const floatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    floatingAnimation();
  }, [floatAnim]);

  // Scale the character based on size prop
  const characterSize = 100 * size;
  const eyeSize = 12 * size;
  const mouthSize = 20 * size;
  const mouthHeight = 10 * size;
  const eyeGap = 20 * size;

  // Create styles with proper type definitions
  const characterFaceStyle: ViewStyle = {
    ...(nadaStyles.characterFace as ViewStyle),
    width: characterSize,
    height: characterSize,
    borderRadius: characterSize / 2,
  };

  const eyeStyle: ViewStyle = {
    ...(nadaStyles.eye as ViewStyle),
    width: eyeSize,
    height: eyeSize,
    borderRadius: eyeSize / 2,
  };

  const eyesStyle: ViewStyle = {
    ...(nadaStyles.eyes as ViewStyle),
    gap: eyeGap,
  };

  const mouthStyle: ViewStyle = {
    ...(nadaStyles.mouth as ViewStyle),
    width: mouthSize,
    height: mouthHeight,
    marginLeft: -mouthSize / 2,
  };

  return (
    <Animated.View
      style={[
        nadaStyles.nadaCharacter as ViewStyle,
        { transform: [{ translateY: floatAnim }] },
      ]}
    >
      <View style={characterFaceStyle}>
        <View style={eyesStyle}>
          <View style={[eyeStyle, nadaStyles.eyeRoll as ViewStyle]} />
          <View style={[eyeStyle, nadaStyles.eyeRoll as ViewStyle]} />
        </View>
        <View style={mouthStyle} />
      </View>
    </Animated.View>
  );
};

export default NadaCharacter;

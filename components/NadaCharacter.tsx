import React from "react";
import { ViewStyle } from "react-native";
import type { NadaExpression } from "./EnhancedNadaCharacter";
import EnhancedNadaCharacter from "./EnhancedNadaCharacter";

interface NadaCharacterProps {
  size?: number; // Custom size multiplier
  expression?: NadaExpression; // Optional expression state
  style?: ViewStyle; // Additional styling
}

/**
 * NadaCharacter - A sarcastic character with reactive facial expressions
 * This is a wrapper around EnhancedNadaCharacter for backward compatibility
 */
const NadaCharacter: React.FC<NadaCharacterProps> = ({
  size = 1,
  expression = "neutral",
  style,
}) => {
  return (
    <EnhancedNadaCharacter size={size} expression={expression} style={style} />
  );
};

export default NadaCharacter;

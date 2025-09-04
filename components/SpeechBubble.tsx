import React from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";
import { nadaStyles } from "./NadaLogo";

interface SpeechBubbleProps {
  message: string;
  width?: number;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  width = 280,
}) => {
  return (
    <View style={[nadaStyles.speechBubble as ViewStyle, { maxWidth: width }]}>
      <View style={nadaStyles.speechTriangle as ViewStyle} />
      <Text style={nadaStyles.nadaText as TextStyle}>{message}</Text>
    </View>
  );
};

export default SpeechBubble;

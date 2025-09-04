import React from "react";
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NadaTheme } from "../constants/NadaTheme";

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const SafeScreen: React.FC<SafeScreenProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 20), // Ensure enough padding at the bottom
          flex: 1,
          backgroundColor: NadaTheme.colors.background,
          width: "100%",
          height: "100%",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default SafeScreen;

import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NadaTheme } from "../constants/NadaTheme";

/**
 * SafeScreen component that provides proper insets
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.style]
 */
const SafeScreen = ({ children, style }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 20), // Ensure enough padding at bottom
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

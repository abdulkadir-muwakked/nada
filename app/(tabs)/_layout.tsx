import { Tabs } from "expo-router";
import { NadaTheme } from "../../constants/NadaTheme";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: "none",
          backgroundColor: NadaTheme.colors.background,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="home" />
    </Tabs>
  );
}

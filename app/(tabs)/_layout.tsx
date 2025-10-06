import { Tabs } from "expo-router";
import { NadaTheme } from "../../constants/NadaTheme";

export default function Layout() {
  const isDevelopment = process.env.NODE_ENV === "development" || __DEV__;

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
      <Tabs.Screen name="index" />
      <Tabs.Screen name="premium-messages" />
      <Tabs.Screen name="nada-expressions" />
      <Tabs.Screen name="test-crypto" />
      {isDevelopment && (
        <>
          <Tabs.Screen name="ad-test" />
          <Tabs.Screen name="screenshots" />
        </>
      )}
    </Tabs>
  );
}

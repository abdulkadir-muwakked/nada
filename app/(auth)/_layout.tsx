import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { NadaTheme } from "../../constants/NadaTheme";

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href={"/"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: NadaTheme.colors.background,
        },
        animation: "fade",
      }}
    />
  );
}

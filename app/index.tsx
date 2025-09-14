import { ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import React from "react";
import WelcomeScreen from "../components/WelcomeScreen";

export default function Page() {
  // Use ClerkLoaded component to ensure Clerk is ready before using useAuth
  return (
    <ClerkLoaded>
      <AuthenticatedRoute />
    </ClerkLoaded>
  );
}

// Separate component to handle authentication after Clerk is loaded
function AuthenticatedRoute() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return <WelcomeScreen />;
}

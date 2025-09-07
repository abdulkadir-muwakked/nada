import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Tabs } from "expo-router";
import { NadaTheme } from "../../constants/NadaTheme";
import { initializeAds } from "../../utils/adService";

export default function Layout() {
  // Initialize Google Mobile Ads on component mount
  useEffect(() => {
    const setupAds = async () => {
      try {
        // Initialize the Google Mobile Ads SDK
        await initializeAds();
        console.log('Google Mobile Ads initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google Mobile Ads:', error);
      }
    };

    setupAds();
  }, []);

  return (
    <>
      <StatusBar style="light" />
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
      </Tabs>
    </>
  );
}

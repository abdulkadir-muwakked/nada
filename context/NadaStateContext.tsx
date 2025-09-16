import React, { createContext, useContext, useEffect, useState } from "react";
import type { NadaExpression } from "../components/EnhancedNadaCharacter";

// Define possible states the app can be in
export type AppState =
  | "idle"
  | "taskStarted"
  | "focusing"
  | "onBreak"
  | "taskCompleted";

interface NadaStateContextType {
  appState: AppState;
  setAppState: (state: AppState) => void;
  nadaExpression: NadaExpression;
}

// Create context with default values
const NadaStateContext = createContext<NadaStateContextType>({
  appState: "idle",
  setAppState: () => {},
  nadaExpression: "neutral",
});

// Context provider component
export const NadaStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appState, setAppState] = useState<AppState>("idle");
  const [nadaExpression, setNadaExpression] =
    useState<NadaExpression>("neutral");

  // Map app state to Nada's expression
  useEffect(() => {
    switch (appState) {
      case "taskStarted":
        setNadaExpression("taskStart");
        break;
      case "focusing":
        setNadaExpression("focusOngoing");
        break;
      case "onBreak":
        setNadaExpression("breakTime");
        break;
      case "taskCompleted":
        setNadaExpression("taskComplete");
        break;
      case "idle":
      default:
        setNadaExpression("neutral");
        break;
    }
  }, [appState]);

  return (
    <NadaStateContext.Provider
      value={{ appState, setAppState, nadaExpression }}
    >
      {children}
    </NadaStateContext.Provider>
  );
};

// Custom hook to use the Nada state
export const useNadaState = () => useContext(NadaStateContext);

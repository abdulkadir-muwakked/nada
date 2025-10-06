// Global TypeScript declarations

// Define __DEV__ for TypeScript
// React Native types extension for GestureResponderEvent
import "react-native";

declare const __DEV__: boolean;

declare module "react-native" {
  export interface GestureResponderEvent {
    nativeEvent: {
      changedTouches: any[];
      identifier: string;
      locationX: number;
      locationY: number;
      pageX: number;
      pageY: number;
      target: number;
      timestamp: number;
      touches: any[];
    };
  }
}

// Add missing type definitions for hammerjs
declare module "hammerjs" {
  export default class Hammer {
    constructor(element: HTMLElement | SVGElement, options?: any);
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    destroy(): void;
  }
}

// Add missing type definitions for istanbul-lib-report
declare module "istanbul-lib-report" {
  export function createContext(options: any): any;
  export function createReport(context: any): any;
}

// Override the expo-env.d.ts file
/// <reference types="expo/types" />
/// <reference types="react" />
/// <reference types="react-native" />

// Define NadaExpression type
declare type NadaExpression =
  | "neutral"
  | "focus"
  | "focusOngoing"
  | "breakTime"
  | "taskStart"
  | "taskComplete"
  | "happy"
  | "sad"
  | "angry"
  | "confused"
  | "bored"
  | "excited"
  | "tired"
  | "annoyed"
  | "judgmental";

import AsyncStorage from "@react-native-async-storage/async-storage";
import OpenAI from "openai";

import type { NadaPersona } from "../context/TimerSettingsContext";

const TOKEN_STATE_KEY = "@nada_openai_usage_v1";
const DAILY_TOKEN_LIMIT = 200;
const MONTHLY_TOKEN_LIMIT = 2000;
const ESTIMATED_REQUEST_TOKENS = 120;

interface TokenUsageState {
  dayKey: string;
  monthKey: string;
  dailyTokens: number;
  monthlyTokens: number;
}

export interface TokenUsageSnapshot {
  dailyTokens: number;
  monthlyTokens: number;
  dailyLimit: number;
  monthlyLimit: number;
}

const getDayKey = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toLocaleDateString("en-CA");
};

const getMonthKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const readTokenState = async (): Promise<TokenUsageState | null> => {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TokenUsageState;
  } catch (error) {
    console.error("Failed to read token usage state:", error);
    return null;
  }
};

const writeTokenState = async (state: TokenUsageState) => {
  try {
    await AsyncStorage.setItem(TOKEN_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to persist token usage state:", error);
  }
};

const ensureTokenState = async (): Promise<TokenUsageState> => {
  const todayKey = getDayKey();
  const monthKey = getMonthKey();
  const stored = await readTokenState();

  if (!stored) {
    const fresh: TokenUsageState = {
      dayKey: todayKey,
      monthKey,
      dailyTokens: 0,
      monthlyTokens: 0,
    };
    await writeTokenState(fresh);
    return fresh;
  }

  const resetDaily = stored.dayKey !== todayKey;
  const resetMonthly = stored.monthKey !== monthKey;

  const next: TokenUsageState = {
    dayKey: todayKey,
    monthKey,
    dailyTokens: resetDaily ? 0 : stored.dailyTokens,
    monthlyTokens: resetMonthly ? 0 : stored.monthlyTokens,
  };

  if (resetDaily || resetMonthly) {
    await writeTokenState(next);
  }

  return next;
};

export class TokenLimitError extends Error {
  public readonly limit: "daily" | "monthly";

  constructor(limit: "daily" | "monthly") {
    super(`OpenAI token ${limit} limit reached`);
    this.name = "TokenLimitError";
    this.limit = limit;
  }
}

const personaPrompts: Record<NadaPersona, string> = {
  default:
    "You are Nada, a sardonic-yet-supportive productivity companion. Offer a concise line with dry humor and a hint of empathy.",
  mean:
    "You are Nada, brutally honest and unimpressed. Deliver a sharp, sarcastic line that roasts the user into action.",
  sugarcoated:
    "You are Nada, overly sweet and encouraging. Shower the user with praise and gentle motivation.",
  clown:
    "You are Nada, chaotic and playful. Respond with absurd humor that still nudges the user toward progress.",
};

const intensityModifiers: Record<1 | 2 | 3, string> = {
  1: "Keep the tone mild and relatively gentle.",
  2: "Dial the persona up a notch with noticeable personality.",
  3: "Go all-in on the persona with bold energy while staying concise.",
};

const modeContext: Record<"focus" | "break", string> = {
  focus: "The user is in a focus interval and needs motivation to keep working.",
  break:
    "The user is on a break. Encourage recharging while reminding them a focus block is next.",
};

const fallbackLines: Record<NadaPersona, string> = {
  default: "Back to it—progress doesn’t happen by itself.",
  mean: "Tick-tock. Your excuses are on overtime.",
  sugarcoated: "Look at you, showing up again. Sparkles and gold stars all around!",
  clown: "If procrastination were a circus, you’d be the headliner. Now dance back to work!",
};

const openaiKey = process.env.EXPO_PUBLIC_OPENAI_KEY;
const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

const assertClient = () => {
  if (!openaiClient) {
    throw new Error("OpenAI API key is not configured.");
  }
  return openaiClient;
};

const reserveAllowance = async (estimatedTokens: number) => {
  const state = await ensureTokenState();
  if (state.dailyTokens + estimatedTokens > DAILY_TOKEN_LIMIT) {
    throw new TokenLimitError("daily");
  }
  if (state.monthlyTokens + estimatedTokens > MONTHLY_TOKEN_LIMIT) {
    throw new TokenLimitError("monthly");
  }
  return state;
};

const commitTokenUsage = async (
  state: TokenUsageState,
  consumed: number
) => {
  const next: TokenUsageState = {
    dayKey: state.dayKey,
    monthKey: state.monthKey,
    dailyTokens: Math.min(DAILY_TOKEN_LIMIT, state.dailyTokens + consumed),
    monthlyTokens: Math.min(
      MONTHLY_TOKEN_LIMIT,
      state.monthlyTokens + consumed
    ),
  };
  await writeTokenState(next);
};

export const getTokenUsageSnapshot = async (): Promise<TokenUsageSnapshot> => {
  const state = await ensureTokenState();
  return {
    dailyTokens: state.dailyTokens,
    monthlyTokens: state.monthlyTokens,
    dailyLimit: DAILY_TOKEN_LIMIT,
    monthlyLimit: MONTHLY_TOKEN_LIMIT,
  };
};

export const getNadaLine = async (
  sessionNumber: number,
  totalGoal: number,
  currentMode: "focus" | "break",
  persona: NadaPersona,
  intensity: 1 | 2 | 3
): Promise<string> => {
  const client = assertClient();
  const usageState = await reserveAllowance(ESTIMATED_REQUEST_TOKENS);

  const systemPrompt = `${personaPrompts[persona]} ${intensityModifiers[intensity]} Keep responses under 40 words.`;

  const userPrompt = `Session ${sessionNumber} of ${totalGoal}.
Mode: ${currentMode}.
${modeContext[currentMode]}
Respond with a single punchy line.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.95,
      max_tokens: 120,
      presence_penalty: 0.3,
      frequency_penalty: 0.2,
    });

    const tokensUsed =
      completion.usage?.total_tokens ?? ESTIMATED_REQUEST_TOKENS;

    await commitTokenUsage(usageState, tokensUsed);

    const content = completion.choices[0]?.message?.content?.trim();
    if (content) {
      return content;
    }
    return fallbackLines[persona];
  } catch (error) {
    console.error("Failed to fetch Nada line:", error);
    if (error instanceof TokenLimitError) {
      throw error;
    }
    return fallbackLines[persona];
  }
};

export {
  DAILY_TOKEN_LIMIT,
  MONTHLY_TOKEN_LIMIT,
};

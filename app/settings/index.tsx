import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActivityHeatmap from "../../components/analytics/ActivityHeatmap";
import type {
  NadaPersona,
  TimerSettings,
} from "../../context/TimerSettingsContext";
import { useTimerSettings } from "../../context/TimerSettingsContext";
import { useSession } from "../../hooks/useSession";
import { ApiError, fetchSubscriptionStatus } from "../../lib/apiClient";
import {
  DailySummary,
  HistoryRange,
  useSessionHistory,
} from "../../hooks/useSessionHistory";
import { useTheme } from "../../hooks/useTheme";
import type { NadaThemeColors, NadaThemeType } from "../../types/nada";

const SettingsScreen = () => {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { colors, spacing } = useTheme();
  const { settings, updateSettings, loading } = useTimerSettings();
  const { refreshSessions } = useSession();
  const {
    range,
    setRange,
    data: historyData,
    stats,
    loading: historyLoading,
    resetHistory,
  } = useSessionHistory();

  const styles = useMemo(
    () => createStyles(colors, spacing),
    [colors, spacing]
  );

  type TimerSettingsField = keyof TimerSettings;
  type NumericTimerField = Exclude<TimerSettingsField, "persona">;

  const [formValues, setFormValues] = useState<
    Record<NumericTimerField, string>
  >({
    focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
    focusDurationMinutes: String(settings.focusDurationMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  });
  const [selectedPersona, setSelectedPersona] = useState<NadaPersona>(
    settings.persona
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isPremiumFromBackend, setIsPremiumFromBackend] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormValues({
      focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
      focusDurationMinutes: String(settings.focusDurationMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
    });
    setSelectedPersona(settings.persona);
  }, [settings]);

  const refreshSubscriptionStatus = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) {
      setIsPremiumFromBackend(false);
      return false;
    }

    const token = await getToken();
    if (!token) {
      setIsPremiumFromBackend(false);
      return false;
    }

    try {
      const status = await fetchSubscriptionStatus(token);
      setIsPremiumFromBackend(Boolean(status.isPremium));
      return Boolean(status.isPremium);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setIsPremiumFromBackend(false);
        return false;
      }
      setIsPremiumFromBackend(false);
      return false;
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    refreshSubscriptionStatus().catch(() => {
      setIsPremiumFromBackend(false);
    });
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    if (historyData.length === 0) {
      setSelectedDate(null);
      return;
    }

    const latest = historyData[historyData.length - 1].date;
    setSelectedDate((prev) => (prev ? prev : latest));
  }, [historyData]);

  const commitValue = useCallback(
    async (field: NumericTimerField) => {
      const raw = formValues[field];
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setFormValues((prev) => ({
          ...prev,
          [field]: String(settings[field]),
        }));
        return;
      }

      const rounded = Math.round(parsed);
      if (rounded === settings[field]) {
        return;
      }

      await updateSettings({ [field]: rounded } as Partial<TimerSettings>);
    },
    [formValues, settings, updateSettings]
  );

  const handleChange = useCallback(
    (field: NumericTimerField, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toneOptions: {
    value: NadaPersona;
    label: string;
    premiumOnly?: boolean;
  }[] = [
    { value: "normal", label: "Normal" },
    { value: "hypocrite", label: "Hypocrite", premiumOnly: true },
  ];

  const handlePersonaChange = useCallback(
    async (value: NadaPersona) => {
      if (value === "hypocrite") {
        setSubscriptionLoading(true);
        const hasAccess = await refreshSubscriptionStatus();
        setSubscriptionLoading(false);
        if (!hasAccess) {
          router.push("/(tabs)/premium-messages");
          return;
        }
      }
      setSelectedPersona(value);
      await updateSettings({ persona: value });
    },
    [refreshSubscriptionStatus, router, updateSettings]
  );

  const handleRangeChange = useCallback(
    (value: HistoryRange) => {
      setRange(value);
      setSelectedDate(null);
    },
    [setRange]
  );

  const handleSelectDay = useCallback((summary: DailySummary) => {
    setSelectedDate(summary.date);
  }, []);

  const handleResetHistory = useCallback(() => {
    Alert.alert(
      "Reset Progress",
      "This will clear all recorded sessions and analytics. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetHistory();
            await refreshSessions();
          },
        },
      ]
    );
  }, [refreshSessions, resetHistory]);

  const selectedSummary = useMemo(() => {
    if (!selectedDate) return undefined;
    return historyData.find((entry) => entry.date === selectedDate);
  }, [historyData, selectedDate]);

  const formattedSelectedLabel = useMemo(() => {
    if (!selectedSummary) return "Tap a day to inspect";
    return formatDateForLabel(selectedSummary.date);
  }, [selectedSummary]);

  const formatSessionsMinutes = useCallback(
    (sessions: number, minutes: number) => {
      const minutesLabel = `${minutes} minute${minutes === 1 ? "" : "s"}`;
      return `${sessions} session${
        sessions === 1 ? "" : "s"
      } – ${minutesLabel}`;
    },
    []
  );

  const settingFields: {
    key: NumericTimerField;
    label: string;
    description?: string;
    suggestion?: string;
  }[] = [
    {
      key: "focusSessionsPerCycle",
      label: "Focus sessions per cycle",
      description: "How many focus blocks before a long break.",
    },
    {
      key: "focusDurationMinutes",
      label: "Focus duration (minutes)",
      description: "Length of each deep work block.",
    },
    {
      key: "shortBreakMinutes",
      label: "Short break (minutes)",
      description: "Quick reset between focus sessions.",
    },
    {
      key: "longBreakMinutes",
      label: "Long break (minutes)",
      description: "Extended rest after a full cycle.",
      suggestion: "Tip: many guides recommend a 15 minute long break.",
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Tune your Pomodoro rhythm. Updates apply instantly to the current
          cycle.
        </Text>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Heatmap</Text>
            <View style={styles.rangeToggleRow}>
              {["7d", "month"].map((value) => {
                const castValue = value as HistoryRange;
                const isActive = range === castValue;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.rangeToggle,
                      isActive && styles.rangeToggleActive,
                    ]}
                    onPress={() => handleRangeChange(castValue)}
                  >
                    <Text
                      style={[
                        styles.rangeToggleText,
                        isActive && styles.rangeToggleTextActive,
                      ]}
                    >
                      {castValue === "7d" ? "Last 7 days" : "This month"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {historyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : historyData.length === 0 ? (
            <Text style={styles.emptyStateText}>
              No focus sessions logged yet. Complete a session to see your
              activity.
            </Text>
          ) : (
            <ActivityHeatmap
              data={historyData}
              range={range}
              selectedDate={selectedDate}
              onSelect={handleSelectDay}
            />
          )}

          <View style={styles.selectedSummaryContainer}>
            <Text style={styles.selectedSummaryTitle}>
              {formattedSelectedLabel}
            </Text>
            <Text style={styles.selectedSummaryBody}>
              {selectedSummary
                ? formatSessionsMinutes(
                    selectedSummary.sessions,
                    selectedSummary.minutes
                  )
                : "Tap a day to inspect"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statLine}>
              ✅ Today:{" "}
              {formatSessionsMinutes(stats.todaySessions, stats.todayMinutes)}
            </Text>
            <Text style={styles.statLine}>
              📆 This Week:{" "}
              {formatSessionsMinutes(stats.weekSessions, stats.weekMinutes)}
            </Text>
            {stats.bestDay ? (
              <Text style={styles.statLine}>
                🏆 Best Day: {formatDateForLabel(stats.bestDay.date)} –{" "}
                {formatSessionsMinutes(
                  stats.bestDay.sessions,
                  stats.bestDay.minutes
                )}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetHistory}
            accessibilityRole="button"
          >
            <Text style={styles.resetButtonText}>Reset Progress</Text>
          </TouchableOpacity>
          <Text style={styles.resetHint}>
            Clears all recorded sessions, today&apos;s count, and heatmap data.
          </Text>
        </View>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Timer Configuration</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.formContent}>
            <View style={styles.toneRow}>
              <Text style={styles.fieldLabel}>Tone mode</Text>
              <View style={styles.toneOptionsContainer}>
                {toneOptions.map((option) => {
                  const isActive = option.value === selectedPersona;
                  const showLock =
                    Boolean(option.premiumOnly) && !isPremiumFromBackend;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.toneOption,
                        isActive && styles.toneOptionActive,
                        ]}
                      onPress={() => handlePersonaChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.toneOptionText,
                          isActive && styles.toneOptionTextActive,
                        ]}
                      >
                        {option.label}
                        {showLock ? " 🔒" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {subscriptionLoading ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null}
            </View>
            {settingFields.map(({ key, label, description, suggestion }) => (
              <View key={key} style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>{label}</Text>
                {description ? (
                  <Text style={styles.fieldDescription}>{description}</Text>
                  ) : null}
                  <TextInput
                    value={formValues[key]}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onChangeText={(value) => handleChange(key, value)}
                    onEndEditing={() => commitValue(key)}
                    onSubmitEditing={() => commitValue(key)}
                    style={styles.input}
                    placeholder="Enter minutes"
                    placeholderTextColor={colors.textSecondary}
                  />
                  {suggestion ? (
                    <Text style={styles.fieldSuggestion}>{suggestion}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (
  colors: NadaThemeColors,
  spacing: NadaThemeType["spacing"]
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    container: {
      gap: spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    sectionCard: {
      width: "100%",
      backgroundColor: colors.overlay,
      borderRadius: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      gap: spacing.md,
    },
    sectionHeader: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    rangeToggleRow: {
      flexDirection: "row",
      gap: spacing.xs,
    },
    rangeToggle: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    rangeToggleActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rangeToggleText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    rangeToggleTextActive: {
      color: colors.background,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.lg,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
    selectedSummaryContainer: {
      gap: spacing.xs,
    },
    selectedSummaryTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    selectedSummaryBody: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    statsRow: {
      gap: spacing.xs,
    },
    statLine: {
      fontSize: 13,
      color: colors.text,
    },
    formContent: {
      gap: spacing.md,
    },
    fieldCard: {
      backgroundColor: colors.background,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    toneRow: {
      gap: spacing.sm,
    },
    inlineLoading: {
      alignItems: "flex-start",
      justifyContent: "center",
    },
    toneOptionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    toneOption: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      backgroundColor: colors.background,
    },
    toneOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toneOptionText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    toneOptionTextActive: {
      color: colors.background,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    fieldDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      borderRadius: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      color: colors.text,
      fontSize: 16,
      backgroundColor: colors.background,
    },
    fieldSuggestion: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    resetButton: {
      alignSelf: "flex-start",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: spacing.sm,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      backgroundColor: "transparent",
    },
    resetButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    resetHint: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

const formatDateForLabel = (date: string) =>
  new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

export default SettingsScreen;

export const screenOptions = {
  title: "Settings",
};

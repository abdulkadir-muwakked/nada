import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import type { TimerSettings } from "../../context/TimerSettingsContext";
import { useTimerSettings } from "../../context/TimerSettingsContext";
import type { NadaThemeColors, NadaThemeType } from "../../types/nada";

const SettingsScreen = () => {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { settings, updateSettings, loading } = useTimerSettings();

  const styles = useMemo(
    () => createStyles(colors, spacing),
    [colors, spacing]
  );

  type TimerSettingsField = keyof TimerSettings;

  const [formValues, setFormValues] = useState<Record<TimerSettingsField, string>>({
    focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
    focusDurationMinutes: String(settings.focusDurationMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  });

  useEffect(() => {
    setFormValues({
      focusSessionsPerCycle: String(settings.focusSessionsPerCycle),
      focusDurationMinutes: String(settings.focusDurationMinutes),
      shortBreakMinutes: String(settings.shortBreakMinutes),
      longBreakMinutes: String(settings.longBreakMinutes),
    });
  }, [settings]);

  const commitValue = useCallback(
    async (field: TimerSettingsField) => {
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
    (field: TimerSettingsField, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const settingFields: {
    key: TimerSettingsField;
    label: string;
    description?: string;
    suggestion?: string;
  }[] = [
    {
      key: "focusSessionsPerCycle",
      label: "Focus sessions per cycle",
      description: "How many focus blocks make up one full cycle before a long break.",
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
      description: "Extended recovery after a full cycle.",
      suggestion: "Tip: many Pomodoro guides recommend 15 minutes here.",
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>
        Tune your Pomodoro rhythm. Updates apply instantly to the current cycle.
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
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
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (
  colors: NadaThemeColors,
  spacing: NadaThemeType["spacing"]
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    backButton: {
      alignSelf: "flex-start",
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: spacing.sm,
    },
    backButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "600",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: spacing.lg,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    formScroll: {
      flex: 1,
    },
    formContent: {
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    fieldCard: {
      backgroundColor: colors.overlay,
      borderRadius: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      gap: spacing.sm,
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
  });

export default SettingsScreen;

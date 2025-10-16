import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { NadaThemeColors } from "../../types/nada";

interface DurationOption {
  label: string;
  value: number;
}

const FOCUS_OPTIONS: DurationOption[] = [
  { label: "15m", value: 15 * 60 },
  { label: "20m", value: 20 * 60 },
  { label: "25m", value: 25 * 60 },
  { label: "30m", value: 30 * 60 },
];

const REST_OPTIONS: DurationOption[] = [
  { label: "1m", value: 1 * 60 },
  { label: "3m", value: 3 * 60 },
  { label: "5m", value: 5 * 60 },
  { label: "10m", value: 10 * 60 },
];

interface TimerPresetsProps {
  focusDuration: number;
  breakDuration: number;
  isRest: boolean;
  updateTimerDuration: (isRestMode: boolean, newDuration: number) => Promise<void>;
}

const TimerPresets: React.FC<TimerPresetsProps> = ({
  focusDuration,
  breakDuration,
  isRest,
  updateTimerDuration,
}) => {
  const { colors, spacing, borderRadius } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, spacing, borderRadius),
    [colors, spacing, borderRadius]
  );

  const [activeModal, setActiveModal] = useState<null | "focus" | "rest">(null);
  const [customValue, setCustomValue] = useState<string>("");

  const handleOptionPress = (targetIsRest: boolean, value: number) => {
    void updateTimerDuration(targetIsRest, value);
  };

  const openCustomModal = (mode: "focus" | "rest") => {
    const baseline = mode === "focus" ? focusDuration : breakDuration;
    setCustomValue(String(Math.max(1, Math.round(baseline / 60))));
    setActiveModal(mode);
  };

  const closeModal = () => {
    setActiveModal(null);
    setCustomValue("");
  };

  const handleCustomSubmit = async () => {
    if (!activeModal) return;
    const minutes = parseInt(customValue, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    const seconds = minutes * 60;
    await updateTimerDuration(activeModal === "rest", seconds);
    closeModal();
  };

  const renderChipRow = (
    label: string,
    options: DurationOption[],
    selectedValue: number,
    targetIsRest: boolean
  ) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{label}</Text>
        {isRest === targetIsRest && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Now</Text>
          </View>
        )}
      </View>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.optionChip,
                isSelected && styles.optionChipSelected,
              ]}
              onPress={() => handleOptionPress(targetIsRest, option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.optionChip, styles.customChip]}
          onPress={() => openCustomModal(targetIsRest ? "rest" : "focus")}
        >
          <Text style={styles.customText}>Custom</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.heading}>Session Lengths</Text>
        {renderChipRow("Focus Session", FOCUS_OPTIONS, focusDuration, false)}
        {renderChipRow("Break Session", REST_OPTIONS, breakDuration, true)}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={activeModal !== null}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeModal} />
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.modalWrapper}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activeModal === "rest" ? "Custom break length" : "Custom focus length"}
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter minutes (minimum 1)
            </Text>
            <TextInput
              value={customValue}
              onChangeText={setCustomValue}
              keyboardType="number-pad"
              returnKeyType="done"
              style={styles.modalInput}
              placeholder="Minutes"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleCustomSubmit}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const createStyles = (
  colors: NadaThemeColors,
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number },
  radius: { small: number; medium: number; large: number; circle: number }
) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginTop: spacing.md,
      gap: spacing.md,
    },
    heading: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: spacing.xs,
    },
    card: {
      width: "100%",
      backgroundColor: colors.overlay,
      borderRadius: radius.large,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    activeBadge: {
      backgroundColor: colors.highlight,
      borderRadius: radius.circle,
      paddingHorizontal: spacing.sm,
      paddingVertical: Math.max(2, Math.floor(spacing.xs / 2)),
      borderWidth: 1,
      borderColor: colors.highlightBorder,
    },
    activeBadgeText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    optionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    optionChip: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm + spacing.xs / 2,
      borderRadius: radius.medium,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      backgroundColor: "transparent",
    },
    optionChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      color: colors.text,
      fontWeight: "600",
      fontSize: 14,
    },
    optionTextSelected: {
      color: colors.background,
    },
    customChip: {
      borderStyle: "dashed",
      borderColor: colors.textSecondary,
    },
    customText: {
      color: colors.textSecondary,
      fontWeight: "600",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    modalContent: {
      width: "100%",
      backgroundColor: colors.background,
      borderRadius: radius.large,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      gap: spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.overlayBorder,
      borderRadius: radius.medium,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      color: colors.text,
      fontSize: 16,
      backgroundColor: colors.overlay,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    modalButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.medium,
      borderWidth: 1,
      borderColor: colors.overlayBorder,
    },
    modalCancel: {
      backgroundColor: "transparent",
    },
    modalConfirm: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    modalConfirmText: {
      color: colors.background,
    },
  });

export default TimerPresets;

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NadaExpression } from "../components/EnhancedNadaCharacter";
import NadaCharacter from "../components/NadaCharacter";
import SpeechBubble from "../components/SpeechBubble";
import { NadaTheme } from "../constants/NadaTheme";

const expressions: {
  type: NadaExpression;
  label: string;
  description: string;
}[] = [
  {
    type: "neutral",
    label: "Neutral",
    description: "Default unbothered face",
  },
  {
    type: "taskStart",
    label: "Task Start",
    description: "Raised eyebrow + smirk",
  },
  {
    type: "focusOngoing",
    label: "Focus Mode",
    description: "Neutral/unimpressed face",
  },
  {
    type: "breakTime",
    label: "Break Time",
    description: "Slight eye roll",
  },
  {
    type: "taskComplete",
    label: "Task Complete",
    description: "Sarcastic smile",
  },
];

// Messages that match Nada's sarcastic personality for each expression
const expressionMessages: Record<NadaExpression, string> = {
  neutral: "Just another day of watching you pretend to be productive.",
  taskStart: "Oh look, you're starting something. How novel.",
  focusOngoing:
    "You call this focusing? I've seen goldfish with longer attention spans.",
  breakTime:
    "Sure, take *another* break. It's not like you have deadlines or anything.",
  taskComplete:
    "Wow, you finished something. Do you want a medal or just applause?",
};

const NadaExpressionDemo: React.FC = () => {
  const [currentExpression, setCurrentExpression] =
    React.useState<NadaExpression>("neutral");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{"Nada's Expressions"}</Text>

      {/* Character display area */}
      <View style={styles.characterArea}>
        <NadaCharacter size={1.5} expression={currentExpression} />
        <SpeechBubble message={expressionMessages[currentExpression]} />
      </View>

      {/* Expression selector buttons */}
      <View style={styles.expressionsContainer}>
        <Text style={styles.sectionTitle}>Select an Expression:</Text>

        <View style={styles.buttonGrid}>
          {expressions.map((exp) => (
            <TouchableOpacity
              key={exp.type}
              style={[
                styles.expressionButton,
                currentExpression === exp.type && styles.activeButton,
              ]}
              onPress={() => setCurrentExpression(exp.type)}
            >
              <Text
                style={[
                  styles.buttonLabel,
                  currentExpression === exp.type && styles.activeButtonLabel,
                ]}
              >
                {exp.label}
              </Text>
              <Text style={styles.expressionDescription}>
                {exp.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    padding: NadaTheme.spacing.lg,
  },
  title: {
    fontSize: NadaTheme.typography.title.fontSize,
    fontWeight: NadaTheme.typography.title.fontWeight as "700",
    color: NadaTheme.colors.primary,
    textAlign: "center",
    marginVertical: NadaTheme.spacing.lg,
  },
  characterArea: {
    alignItems: "center",
    marginBottom: NadaTheme.spacing.xl,
  },
  expressionsContainer: {
    marginTop: NadaTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: NadaTheme.typography.body.fontSize,
    fontWeight: "600",
    color: NadaTheme.colors.text,
    marginBottom: NadaTheme.spacing.md,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: NadaTheme.spacing.sm,
  },
  expressionButton: {
    backgroundColor: NadaTheme.colors.overlay,
    borderRadius: NadaTheme.borderRadius.medium,
    padding: NadaTheme.spacing.md,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
    width: "48%",
    marginBottom: NadaTheme.spacing.md,
  },
  activeButton: {
    backgroundColor: NadaTheme.colors.highlight,
    borderColor: NadaTheme.colors.highlightBorder,
  },
  buttonLabel: {
    fontSize: NadaTheme.typography.caption.fontSize,
    fontWeight: "600",
    color: NadaTheme.colors.text,
    marginBottom: 4,
  },
  activeButtonLabel: {
    color: NadaTheme.colors.primary,
  },
  expressionDescription: {
    fontSize: NadaTheme.typography.small.fontSize,
    color: NadaTheme.colors.textSecondary,
  },
});

export default NadaExpressionDemo;

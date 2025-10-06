import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ControlsProps {
  isRunning: boolean;
  isRest: boolean;
  scaleAnim: Animated.Value;
  onPlayPress: () => void;
  onToggleMode: () => void;
  onSkip?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isRunning,
  isRest,
  scaleAnim,
  onPlayPress,
  onToggleMode,
  onSkip,
}) => {
  return (
    <View style={styles.controls}>
      <View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.controlBtn,
              isRest && styles.restModeBtn,
              !isRest && styles.focusModeBtn,
            ]}
            onPress={onToggleMode}
            accessibilityLabel={
              isRest ? "Switch to focus mode" : "Switch to break mode"
            }
          >
            <Text style={styles.controlIcon}>{isRest ? "📚" : "☕️"}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.buttonLabel}>{isRest ? "Focus" : "Break"}</Text>
      </View>

      <View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.primaryBtn]}
            onPress={onPlayPress}
            accessibilityLabel={isRunning ? "Pause timer" : "Start timer"}
          >
            <Text style={styles.controlIcon}>{isRunning ? "⏸️" : "▶️"}</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.buttonLabel}>{isRunning ? "Pause" : "Start"}</Text>
      </View>

      <View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onSkip}
            disabled={!onSkip}
            accessibilityLabel="Skip to next"
          >
            <Text style={styles.controlIcon}>⏭️</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.buttonLabel}>Skip</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 30,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: "#ff6b6b",
    borderWidth: 0,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  controlIcon: {
    fontSize: 24,
  },
  focusModeBtn: {
    backgroundColor: "rgba(25, 118, 210, 0.4)",
    borderColor: "rgba(25, 118, 210, 0.6)",
  },
  restModeBtn: {
    backgroundColor: "rgba(76, 175, 80, 0.4)",
    borderColor: "rgba(76, 175, 80, 0.6)",
  },
  buttonLabel: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 4,
    textAlign: "center",
  },
});

export default Controls;

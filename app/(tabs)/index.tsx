import React, { useEffect, useState } from "react";
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import NadaCharacter from "../../components/NadaCharacter";
import NadaLogo from "../../components/NadaLogo";
import SpeechBubble from "../../components/SpeechBubble";

const NadaHomeScreen = () => {
  // Fix: useMemo for Animated.Value to avoid changing reference every render
  const scaleAnim = React.useMemo(() => new Animated.Value(1), []);

  // Timer presets
  const TIMER_PRESETS = [
    { label: "15m", value: 15 * 60 },
    { label: "25m", value: 25 * 60 },
    { label: "45m", value: 45 * 60 },
  ];
  const REST_PRESET = { label: "Rest 5m", value: 5 * 60 };

  const [selectedPreset, setSelectedPreset] = useState<number>(
    TIMER_PRESETS[1].value
  ); // Default 25m
  const [timerSeconds, setTimerSeconds] = useState<number>(selectedPreset);
  const [isRunning, setIsRunning] = useState(false);
  const [isRest, setIsRest] = useState(false);
  const [customTime, setCustomTime] = useState<string>("");

  const [currentSession] = useState<number>(2); // Remove setCurrentSession if not used
  const [sessionGoal] = useState(4);
  const [streak] = useState(3);

  // When preset changes, update timer
  useEffect(() => {
    setTimerSeconds(selectedPreset);
    setIsRest(false);
    setIsRunning(false);
  }, [selectedPreset]);

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    if (timerSeconds === 0 && isRunning) {
      if (!isRest) {
        setIsRest(true);
        setSelectedPreset(REST_PRESET.value);
      } else {
        setIsRunning(false);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerSeconds, isRest, REST_PRESET.value]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Manual custom time change
  const handleCustomTimeChange = (text: string) => {
    setCustomTime(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedPreset(num * 60);
    }
  };

  const handlePresetSelect = (value: number) => {
    setSelectedPreset(value);
    setCustomTime("");
  };

  const handlePlayPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsRunning(!isRunning);
  };

  const handleMotivatePress = () => {
    // Handle motivate button press
    console.log("Motivate me pressed!");
  };

  // Using the reusable SpeechBubble component

  // TimerDisplay with just the timer display
  const TimerDisplay = () => {
    const progress = ((selectedPreset - timerSeconds) / selectedPreset) * 360;

    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerCircle}>
          <View
            style={[
              styles.timerProgress,
              { transform: [{ rotate: `${progress - 90}deg` }] },
            ]}
          />
        </View>
        <View style={styles.timerDisplay}>
          <Text style={styles.timerTime}>{formatTime(timerSeconds)}</Text>
          <Text style={styles.timerLabel}>
            {isRest ? "REST" : "FOCUS TIME"}
          </Text>
        </View>
      </View>
    );
  };

  // Separate component for timer presets
  const TimerPresets = () => (
    <View style={styles.presetsContainer}>
      <Text style={styles.presetsTitle}>Choose Timer</Text>
      <View style={styles.presetsGrid}>
        {TIMER_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.label}
            style={[
              styles.presetCard,
              selectedPreset === preset.value && styles.presetCardActive,
            ]}
            onPress={() => handlePresetSelect(preset.value)}
          >
            <Text
              style={[
                styles.presetCardText,
                selectedPreset === preset.value && styles.presetCardTextActive,
              ]}
            >
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.presetCard, isRest && styles.presetCardActive]}
          onPress={() => handlePresetSelect(REST_PRESET.value)}
        >
          <Text
            style={[
              styles.presetCardText,
              isRest && styles.presetCardTextActive,
            ]}
          >
            {REST_PRESET.label}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.customTimeContainer}>
        <Text style={styles.customLabel}>Custom Time (minutes)</Text>
        <TextInput
          style={styles.customInput}
          value={customTime}
          onChangeText={handleCustomTimeChange}
          keyboardType="numeric"
          placeholder="e.g. 10"
          maxLength={3}
        />
      </View>
    </View>
  );

  const SessionInfo = () => (
    <View style={styles.sessionInfo}>
      <View style={styles.sessionItem}>
        <Text style={styles.sessionNumber}>{currentSession}</Text>
        <Text style={styles.sessionText}>sessions</Text>
      </View>
      <View style={styles.sessionItem}>
        <Text style={styles.sessionNumber}>{sessionGoal}</Text>
        <Text style={styles.sessionText}>goal</Text>
      </View>
    </View>
  );

  const Controls = () => (
    <View style={styles.controls}>
      <TouchableOpacity style={styles.controlBtn}>
        <Text style={styles.controlIcon}>⚙️</Text>
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.controlBtn, styles.primaryBtn]}
          onPress={handlePlayPress}
        >
          <Text style={styles.controlIcon}>{isRunning ? "⏸️" : "▶️"}</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.controlBtn}>
        <Text style={styles.controlIcon}>⏭️</Text>
      </TouchableOpacity>
    </View>
  );

  // Bottom navigation removed

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <NadaLogo size="medium" />
        <View style={styles.streakCounter}>
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
      </View>

      {/* Main Content - Now Scrollable */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <NadaCharacter />
        <SpeechBubble message="Ready to disappoint me again?" />
        <TimerDisplay />
        <TimerPresets />
        <SessionInfo />
        <Controls />

        <TouchableOpacity
          style={styles.motivateBtn}
          onPress={handleMotivatePress}
        >
          <Text style={styles.motivateText}>Actually motivate me 🙄</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  
  scrollContainer: {
    flex: 1,
    width: '100%',
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 10,
  },

  streakCounter: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },

  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff6b6b",
  },

  mainContent: {
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 15,
    paddingBottom: 30, // Reduced padding since the nav bar is removed
    minHeight: '100%', // Ensures content fills the ScrollView even if content is short
  },

  speechBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 30,
    maxWidth: 280,
    position: "relative",
  },

  speechTriangle: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },

  nadaText: {
    fontSize: 16,
    color: "#e0e0e0",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },

  timerContainer: {
    position: "relative",
    width: 180,
    height: 180,
    marginBottom: 10,
  },

  timerCircle: {
    width: 180,
    height: 180,
    borderWidth: 6,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },

  timerProgress: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 180,
    height: 180,
    borderWidth: 6,
    borderColor: "transparent",
    borderTopColor: "#ff6b6b",
    borderRadius: 90,
  },

  timerDisplay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  timerTime: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 5,
  },

  timerLabel: {
    fontSize: 14,
    color: "#a0a0a0",
    fontWeight: "500",
  },

  // New preset styles
  presetsContainer: {
    width: "100%",
    marginTop: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },

  presetsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 15,
    textAlign: "center",
  },

  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  presetCard: {
    width: "48%",
    padding: 15,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  presetCardActive: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },

  presetCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  presetCardTextActive: {
    color: "#1a1a2e",
  },

  customTimeContainer: {
    marginTop: 10,
    alignItems: "center",
  },

  customLabel: {
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 10,
    fontWeight: "500",
  },

  customInput: {
    width: "50%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  // Keep original styles for backward compatibility
  presetRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  presetBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 5,
  },

  presetBtnActive: {
    backgroundColor: "#ff6b6b",
  },

  presetText: {
    fontSize: 14,
    color: "#ffffff",
  },

  presetTextActive: {
    color: "#1a1a2e",
  },

  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 20,
  },

  sessionItem: {
    alignItems: "center",
  },

  sessionNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ff6b6b",
  },

  sessionText: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 2,
  },

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

  motivateBtn: {
    width: 280,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  motivateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Bottom navigation styles removed
});

export default NadaHomeScreen;

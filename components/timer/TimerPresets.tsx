import React, { useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { TIMER_PRESETS } from "../../constants/timerConstants";

// Rest presets
const REST_PRESETS = [
  { label: "5m", value: 5 * 60 },
  { label: "10m", value: 10 * 60 },
  { label: "15m", value: 15 * 60 },
];

interface TimerPresetsProps {
  focusDuration: number;
  breakDuration: number;
  isRest: boolean;
  updateTimerDuration: (isRestMode: boolean, newDuration: number) => void;
}

const TimerPresets: React.FC<TimerPresetsProps> = ({
  focusDuration,
  breakDuration,
  isRest,
  updateTimerDuration,
}) => {
  // State for dropdown visibility
  const [isFocusDropdownOpen, setIsFocusDropdownOpen] = useState(false);
  const [isRestDropdownOpen, setIsRestDropdownOpen] = useState(false);

  // State for custom time inputs
  const [customFocusTime, setCustomFocusTime] = useState("");
  const [customRestTime, setCustomRestTime] = useState("");

  // Animation values for smooth dropdown transitions
  const focusDropdownAnim = useRef(new Animated.Value(0)).current;
  const restDropdownAnim = useRef(new Animated.Value(0)).current;

  // Get the currently selected preset label for display
  const getSelectedFocusLabel = () => {
    // Always use focusDuration for the Focus label, regardless of current mode
    // Find the matching preset
    const matchingPreset = TIMER_PRESETS.find((p) => p.value === focusDuration);
    if (matchingPreset) return matchingPreset.label;

    // If no match, must be custom time
    const minutes = Math.floor(focusDuration / 60);
    return `${minutes}m`;
  };

  const getSelectedRestLabel = () => {
    // Always use breakDuration for the Rest label, regardless of current mode
    // Check against standard break durations
    if (breakDuration === 5 * 60) return "5m";
    if (breakDuration === 10 * 60) return "10m";
    if (breakDuration === 15 * 60) return "15m";

    // If custom time
    const minutes = Math.floor(breakDuration / 60);
    return `${minutes}m`;
  };

  // Handlers for custom time inputs
  const handleCustomFocusTimeChange = (text: string) => {
    setCustomFocusTime(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      const seconds = num * 60;
      // Use the safer update function to prevent flickering
      updateTimerDuration(false, seconds);
      setIsFocusDropdownOpen(false);
    }
  };

  const handleCustomRestTimeChange = (text: string) => {
    setCustomRestTime(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0) {
      const seconds = num * 60;
      // Use the safer update function to prevent flickering
      updateTimerDuration(true, seconds);
      setIsRestDropdownOpen(false);
    }
  };

  // Handle focus preset selection
  const handleFocusPresetSelect = (value: number) => {
    // Use the safer update function to prevent flickering
    updateTimerDuration(false, value);

    // Close the dropdown
    setIsFocusDropdownOpen(false);
  };

  // Handle rest preset selection
  const handleRestPresetSelect = (value: number) => {
    // Use the safer update function to prevent flickering
    updateTimerDuration(true, value);

    // Close the dropdown
    setIsRestDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setIsFocusDropdownOpen(false);
    setIsRestDropdownOpen(false);
  };

  // Animate dropdown opening/closing with spring animation for more natural feel
  React.useEffect(() => {
    Animated.spring(focusDropdownAnim, {
      toValue: isFocusDropdownOpen ? 1 : 0,
      friction: 8, // Higher friction = less oscillation
      tension: 40, // Lower tension = slower animation
      useNativeDriver: false,
    }).start();
  }, [isFocusDropdownOpen, focusDropdownAnim]);

  React.useEffect(() => {
    Animated.spring(restDropdownAnim, {
      toValue: isRestDropdownOpen ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [isRestDropdownOpen, restDropdownAnim]);

  // Calculate dropdown heights and opacity for animation
  const focusDropdownHeight = focusDropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // Approximate height of the dropdown content
  });

  const restDropdownHeight = restDropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180], // Approximate height of the dropdown content
  });

  const focusDropdownOpacity = focusDropdownAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1], // Fade in faster than the height animation
  });

  const restDropdownOpacity = restDropdownAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={closeDropdowns}
      style={styles.presetsContainer}
    >
      <Text style={styles.presetsTitle}>Timer Settings</Text>

      <View style={styles.dropdownsContainer}>
        {/* Focus Time Dropdown */}
        <View style={styles.dropdownWrapper}>
          <Text style={styles.dropdownLabel}>Focus</Text>
          <TouchableOpacity
            style={[
              styles.dropdownHeader,
              isFocusDropdownOpen && styles.dropdownHeaderActive,
              !isRest && styles.dropdownHeaderSelected,
            ]}
            onPress={(e: any) => {
              e.stopPropagation();
              setIsRestDropdownOpen(false);
              setIsFocusDropdownOpen(!isFocusDropdownOpen);
            }}
          >
            <Text style={styles.dropdownHeaderText}>
              {getSelectedFocusLabel()}
            </Text>
            <Text style={styles.dropdownArrow}>
              {isFocusDropdownOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.dropdownContent,
              {
                maxHeight: focusDropdownHeight,
                opacity: focusDropdownOpacity,
              },
            ]}
          >
            {TIMER_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.dropdownItem,
                  focusDuration === preset.value && styles.dropdownItemActive,
                ]}
                onPress={() => handleFocusPresetSelect(preset.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    focusDuration === preset.value &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.dropdownCustomInput}
                value={customFocusTime}
                onChangeText={setCustomFocusTime}
                placeholder="Custom (min)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                maxLength={3}
                onEndEditing={() =>
                  handleCustomFocusTimeChange(customFocusTime)
                }
              />
              <TouchableOpacity
                style={styles.customApplyButton}
                onPress={() => handleCustomFocusTimeChange(customFocusTime)}
              >
                <Text style={styles.customApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Rest Time Dropdown */}
        <View style={styles.dropdownWrapper}>
          <Text style={styles.dropdownLabel}>Rest</Text>
          <TouchableOpacity
            style={[
              styles.dropdownHeader,
              isRestDropdownOpen && styles.dropdownHeaderActive,
              isRest && styles.dropdownHeaderSelected,
            ]}
            onPress={(e: any) => {
              e.stopPropagation();
              setIsFocusDropdownOpen(false);
              setIsRestDropdownOpen(!isRestDropdownOpen);
            }}
          >
            <Text style={styles.dropdownHeaderText}>
              {getSelectedRestLabel()}
            </Text>
            <Text style={styles.dropdownArrow}>
              {isRestDropdownOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.dropdownContent,
              { maxHeight: restDropdownHeight, opacity: restDropdownOpacity },
            ]}
          >
            {REST_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.label}
                style={[
                  styles.dropdownItem,
                  breakDuration === preset.value && styles.dropdownItemActive,
                ]}
                onPress={() => handleRestPresetSelect(preset.value)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    breakDuration === preset.value &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.dropdownCustomInput}
                value={customRestTime}
                onChangeText={setCustomRestTime}
                placeholder="Custom (min)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="numeric"
                maxLength={3}
                onEndEditing={() => handleCustomRestTimeChange(customRestTime)}
              />
              <TouchableOpacity
                style={styles.customApplyButton}
                onPress={() => handleCustomRestTimeChange(customRestTime)}
              >
                <Text style={styles.customApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  dropdownsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  dropdownWrapper: {
    width: "48%",
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    paddingLeft: 4,
  },
  dropdownHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  dropdownHeaderActive: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dropdownHeaderSelected: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    borderColor: "rgba(255, 107, 107, 0.4)",
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },
  dropdownContent: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginTop: 5,
    overflow: "hidden",
    zIndex: 10,
    position: "absolute",
    top: 45, // Position below the header
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  dropdownItemActive: {
    backgroundColor: "rgba(255, 107, 107, 0.3)",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "500",
  },
  dropdownItemTextActive: {
    fontWeight: "600",
  },
  customInputContainer: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownCustomInput: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    color: "#ffffff",
    marginRight: 8,
    fontSize: 14,
  },
  customApplyButton: {
    backgroundColor: "rgba(255, 107, 107, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  customApplyText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default TimerPresets;

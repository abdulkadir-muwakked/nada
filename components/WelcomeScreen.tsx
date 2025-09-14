import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NadaTheme } from "../constants/NadaTheme";
import SpeechBubble from "./SpeechBubble";

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  // Animation setup for the button
  const scaleAnim = React.useMemo(() => new Animated.Value(1), []);

  // Handle button press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = () => {
    router.push("/sign-in");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={NadaTheme.colors.background}
      />

      <View style={styles.content}>
        {/* Character - Custom Nada face emoji */}
        <View style={styles.characterContainer}>
          <NadaEmoji />
        </View>

        {/* App Title */}
        <Text style={styles.title}>Nada</Text>

        {/* Tagline as Speech Bubble */}
        <View style={styles.speechContainer}>
          <SpeechBubble
            message="Nada Pomodoro: lost in an existential crisis, yet strangely open to hypocrisy… for $5."
            width={300}
          />
        </View>

        {/* Get Started Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: NadaTheme.spacing.xl,
    paddingBottom: 60, // Extra padding at the bottom for visual balance
  },
  speechContainer: {
    marginBottom: NadaTheme.spacing.xxl, // Add space between speech bubble and button
  },
  characterContainer: {
    marginBottom: NadaTheme.spacing.xl,
  },
  title: {
    fontSize: 46,
    fontWeight: "700",
    color: NadaTheme.colors.primary,
    marginBottom: NadaTheme.spacing.xl,
    letterSpacing: 0.5,
  },
  // SpeechBubble component handles the tagline styling
  button: {
    backgroundColor: NadaTheme.colors.primary,
    borderRadius: NadaTheme.borderRadius.large,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NadaTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 200,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Subtle border for better definition
  },
  buttonText: {
    color: "#1a1a2e", // Dark text on light button background
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5, // Subtle letter spacing for better readability
  },
});

// Custom Nada face component that matches the design style of the app
const NadaEmoji: React.FC = () => {
  // Animation setup
  const floatAnim = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    // Subtle floating animation
    const floatingAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    floatingAnimation();
  }, [floatAnim]);

  return (
    <View style={emojiStyles.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <View style={emojiStyles.characterFace}>
          <View style={emojiStyles.eyes}>
            <View style={emojiStyles.eye} />
            <View style={emojiStyles.eye} />
          </View>
          <View style={emojiStyles.mouth} />
        </View>
      </Animated.View>
    </View>
  );
};

const emojiStyles = StyleSheet.create({
  container: {
    marginBottom: NadaTheme.spacing.md,
    alignItems: "center",
  },
  characterFace: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: NadaTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: NadaTheme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  eyes: {
    flexDirection: "row",
    gap: 24,
    position: "absolute",
    top: 40,
  },
  eye: {
    width: 14,
    height: 9, // Narrower eyes for more indifference
    borderRadius: 7,
    backgroundColor: NadaTheme.colors.background,
    transform: [{ rotate: "-5deg" }], // Slightly rotated for the "don't give a shit" look
  },
  mouth: {
    width: 24,
    height: 6,
    backgroundColor: NadaTheme.colors.background,
    borderRadius: 3,
    position: "absolute",
    bottom: 40,
    // Flat straight line for mouth with a slight downward angle for more disdain
    transform: [{ rotate: "-10deg" }, { scaleX: 0.9 }],
  },
});

export default WelcomeScreen;

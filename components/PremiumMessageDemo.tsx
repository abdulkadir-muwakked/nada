import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";
import { User } from "../types/nada";
import {
  getAuthMessageByMode,
  getBreakMessageByMode,
  getResumeMessageByMode,
  getStartMessageByMode,
} from "../utils/messageSelector";
import NadaCharacter from "./NadaCharacter";
import SpeechBubble from "./SpeechBubble";

/**
 * A demo component to showcase the difference between regular and premium "Hypocrite Mode" messages
 */
const PremiumMessageDemo: React.FC = () => {
  const [user, setUser] = useState<User>({ isPremium: false });
  const [messageType, setMessageType] = useState<
    "auth" | "start" | "break" | "resume"
  >("start");

  const getMessage = () => {
    switch (messageType) {
      case "auth":
        return getAuthMessageByMode(user);
      case "start":
        return getStartMessageByMode(user);
      case "break":
        return getBreakMessageByMode(user);
      case "resume":
        return getResumeMessageByMode(user);
      default:
        return getStartMessageByMode(user);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nada Message Demo</Text>
        <View style={styles.premiumToggle}>
          <Text style={styles.label}>Premium Mode:</Text>
          <Switch
            value={user.isPremium}
            onValueChange={(value) => setUser({ ...user, isPremium: value })}
            trackColor={{ false: "#767577", true: NadaTheme.colors.primary }}
          />
        </View>
      </View>

      <View style={styles.characterContainer}>
        <NadaCharacter size={1.2} />
        <SpeechBubble message={getMessage()} />
      </View>

      <View style={styles.messageTypeSelector}>
        <Text style={styles.sectionTitle}>Message Type:</Text>
        <View style={styles.buttonContainer}>
          {(["auth", "start", "break", "resume"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.button,
                messageType === type && styles.activeButton,
              ]}
              onPress={() => setMessageType(type)}
            >
              <Text
                style={[
                  styles.buttonText,
                  messageType === type && styles.activeButtonText,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
    padding: 20,
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: NadaTheme.colors.text,
  },
  premiumToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    marginRight: 8,
    color: NadaTheme.colors.text,
  },
  characterContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  messageTypeSelector: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: NadaTheme.colors.text,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: NadaTheme.colors.background,
    borderWidth: 1,
    borderColor: NadaTheme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 5,
    width: "48%",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: NadaTheme.colors.primary,
  },
  buttonText: {
    color: NadaTheme.colors.primary,
  },
  activeButtonText: {
    color: NadaTheme.colors.background,
  },
});

export default PremiumMessageDemo;

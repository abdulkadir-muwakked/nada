import React from "react";
import { StyleSheet, Text } from "react-native";
import {
  getAuthMessageByMode,
  getBreakMessageByMode,
  getResumeMessageByMode,
  getStartMessageByMode,
} from "../utils/messageSelector";

type MessageType = "auth" | "start" | "break" | "resume";

interface NadaMessageProps {
  user: {
    isPremium: boolean;
  };
  type: MessageType;
}

/**
 * Component that displays the appropriate Nada message based on user's premium status
 * and the type of message needed (auth, start, break, resume)
 */
export const NadaMessage: React.FC<NadaMessageProps> = ({ user, type }) => {
  const getMessage = () => {
    switch (type) {
      case "auth":
        return getAuthMessageByMode(user);
      case "start":
        return getStartMessageByMode(user);
      case "break":
        return getBreakMessageByMode(user);
      case "resume":
        return getResumeMessageByMode(user);
      default:
        return getAuthMessageByMode(user);
    }
  };

  return <Text style={styles.message}>{getMessage()}</Text>;
};

const styles = StyleSheet.create({
  message: {
    fontSize: 16,
    fontStyle: "italic",
    marginVertical: 10,
    textAlign: "center",
    padding: 10,
  },
});

export default NadaMessage;

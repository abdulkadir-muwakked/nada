import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface SessionInfoProps {
  currentSession: number;
  sessionGoal: number;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  currentSession,
  sessionGoal,
}) => {
  return (
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
};

const styles = StyleSheet.create({
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
});

export default SessionInfo;

import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

interface SignOutButtonProps {
  style?: any;
  textStyle?: any;
}

export const SignOutButton = ({ style, textStyle }: SignOutButtonProps) => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk();
  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to your desired page
      Linking.openURL(Linking.createURL("/"));
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleSignOut}>
      <Text style={[styles.buttonText, textStyle]}>Sign Out</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
    color: NadaTheme.colors.primary,
  },
});

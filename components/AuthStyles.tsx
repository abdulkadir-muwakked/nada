import { StyleSheet } from "react-native";
import { NadaTheme } from "../constants/NadaTheme";

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  character: {
    marginBottom: 10,
  },
  title: {
    fontSize: NadaTheme.typography.title.fontSize,
    fontWeight: "700",
    color: NadaTheme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: NadaTheme.typography.body.fontSize,
    color: NadaTheme.colors.textSecondary,
    textAlign: "center",
    marginHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: NadaTheme.typography.caption.fontSize,
    color: NadaTheme.colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: NadaTheme.colors.overlay,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
    borderRadius: NadaTheme.borderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: NadaTheme.colors.text,
  },
  inputError: {
    borderColor: "rgba(255, 75, 75, 0.6)",
    backgroundColor: "rgba(255, 75, 75, 0.05)",
  },
  errorText: {
    color: "rgba(255, 107, 107, 0.9)",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: NadaTheme.colors.primary,
    borderRadius: NadaTheme.borderRadius.large,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    shadowColor: NadaTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#1a1a2e",
    fontSize: 18,
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: NadaTheme.colors.textSecondary,
    fontSize: NadaTheme.typography.body.fontSize,
  },
  footerLink: {
    color: NadaTheme.colors.primary,
    fontSize: NadaTheme.typography.body.fontSize,
    fontWeight: "500",
    marginLeft: 5,
  },
  verificationContainer: {
    flex: 1,
    backgroundColor: NadaTheme.colors.background,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: NadaTheme.colors.text,
    marginBottom: 15,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: NadaTheme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
  },
  verificationCode: {
    width: "100%",
    backgroundColor: NadaTheme.colors.overlay,
    borderWidth: 1,
    borderColor: NadaTheme.colors.overlayBorder,
    borderRadius: NadaTheme.borderRadius.medium,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    letterSpacing: 1,
    color: NadaTheme.colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
});

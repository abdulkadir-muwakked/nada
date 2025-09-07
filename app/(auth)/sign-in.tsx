import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AuthDivider from "../../components/AuthDivider";
import { authStyles } from "../../components/AuthStyles";
import ErrorMessage from "../../components/ErrorMessage";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import NadaAuthCharacter from "../../components/NadaAuthCharacter";
import NadaLogo from "../../components/NadaLogo";
import SpeechBubble from "../../components/SpeechBubble";
import {
  getRandomAuthMessage,
  getRandomGoogleAuthMessage,
  getValidationErrorMessage,
} from "../../constants/AuthMessages";
import { NadaTheme } from "../../constants/NadaTheme";
import { useGoogleAuth } from "../../utils/oauth";
import { validateEmail } from "../../utils/validation";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { handleGoogleSignIn } = useGoogleAuth();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [nadaMessage, setNadaMessage] = React.useState(getRandomAuthMessage());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  // Handle Google sign-in
  const onGoogleSignInPress = async () => {
    // Show a snarky Google-specific message
    setNadaMessage(getRandomGoogleAuthMessage());
    setErrorMessage(null); // Clear any previous errors

    setGoogleLoading(true);
    try {
      const success = await handleGoogleSignIn();
      if (success) {
        router.replace("/");
      } else {
        setErrorMessage(
          "Google sign-in failed. Even Google doesn't want you to be productive."
        );
        setNadaMessage(
          "Google rejected you. At least you're consistent at failing."
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage(
        "Failed to connect with Google. Your mediocrity is universal."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    setFieldErrors({}); // Clear field-specific errors

    console.log("Starting sign-in process with:", { email: emailAddress });

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Sign-in process timed out");
        setLoading(false);
        setErrorMessage("Request timed out. Please try again.");
        setNadaMessage(
          "Even my patience has limits. The request took too long."
        );
      }
    }, 15000); // 15 seconds timeout

    // Client-side validation for empty fields
    if (!emailAddress.trim()) {
      setFieldErrors({
        email: "Email is required.",
      });
      setErrorMessage("Please enter your email address.");
      setNadaMessage(getValidationErrorMessage("generic_error"));
      setLoading(false);
      return;
    }

    // Client-side validation for email format
    // Only check if email is not empty
    if (emailAddress.trim() && !validateEmail(emailAddress)) {
      // Check specifically for disallowed characters
      const [localPart] = emailAddress.trim().split("@");
      if (
        localPart &&
        (localPart.includes("+") ||
          localPart.includes("=") ||
          localPart.includes("#"))
      ) {
        setFieldErrors({
          email:
            "Email cannot contain '+', '=', or '#' characters before the @ symbol.",
        });
        setErrorMessage("Email address contains invalid characters.");
        setNadaMessage(getValidationErrorMessage("invalid_subaddress"));
      } else {
        setFieldErrors({
          email: "Email address must be a valid email address.",
        });
        setErrorMessage("Please enter a valid email address.");
        setNadaMessage(getValidationErrorMessage("email_invalid"));
      }
      setLoading(false);
      return;
    }

    // Validate password is not empty
    if (!password.trim()) {
      setFieldErrors({
        password: "Password is required.",
      });
      setErrorMessage("Did you forget something? Like your password?");
      setNadaMessage(getValidationErrorMessage("password_incorrect"));
      setLoading(false);
      return;
    }

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));

      // Extract error message to display to the user
      if (err.errors && err.errors.length > 0) {
        // Process all errors
        const newFieldErrors: { email?: string; password?: string } = {};
        let generalError = null;

        // Extract field-specific errors
        err.errors.forEach((error: any) => {
          if (
            error.meta?.paramName === "identifier" ||
            error.code === "form_identifier_not_found"
          ) {
            newFieldErrors.email = error.message;
          } else if (
            error.meta?.paramName === "password" ||
            error.code === "form_password_incorrect"
          ) {
            newFieldErrors.password = error.message;
          } else {
            generalError = error.message;
          }
        });

        // Update field errors
        setFieldErrors(newFieldErrors);

        const firstError = err.errors[0];
        setErrorMessage(
          generalError || firstError.message || "Sign in failed. Try again."
        );

        // Update the Nada character message to be snarky about the error
        if (firstError.code === "form_identifier_not_found") {
          setNadaMessage(getValidationErrorMessage("email_not_found"));
        } else if (firstError.code === "form_password_incorrect") {
          setNadaMessage(getValidationErrorMessage("password_incorrect"));
        } else if (firstError.code === "form_password_pwned") {
          // Specific message for compromised passwords
          setNadaMessage(getValidationErrorMessage("password_compromised"));
        } else if (firstError.code === "form_param_format_invalid") {
          // Check if this is related to the email format
          if (firstError.meta?.paramName === "identifier") {
            // Check if the error might be due to special characters in the email
            if (
              emailAddress.includes("+") ||
              emailAddress.includes("=") ||
              emailAddress.includes("#")
            ) {
              setNadaMessage(getValidationErrorMessage("invalid_subaddress"));
              setFieldErrors({
                email:
                  "Email cannot contain '+', '=', or '#' characters before the @ symbol.",
              });
            } else {
              setNadaMessage(getValidationErrorMessage("email_invalid"));
            }
          } else {
            setNadaMessage(getValidationErrorMessage("email_invalid"));
          }
        } else {
          setNadaMessage(getValidationErrorMessage("generic_error"));
        }
      } else {
        setErrorMessage(
          "Authentication failed. Just like all your other goals."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={NadaTheme.colors.background}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={authStyles.container}>
          <View style={authStyles.header}>
            <View style={authStyles.logoContainer}>
              <NadaLogo size="large" variant="auth" />
              <NadaAuthCharacter size={1} />
            </View>
            <SpeechBubble message={nadaMessage} />
          </View>

          {/* Google Sign In Button */}
          <GoogleSignInButton
            onPress={onGoogleSignInPress}
            loading={googleLoading}
            style={{ marginBottom: 5 }}
          />

          <AuthDivider text="or continue with email" />

          <View style={authStyles.form}>
            {errorMessage && <ErrorMessage message={errorMessage} />}

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  authStyles.input,
                  fieldErrors.email ? authStyles.inputError : null,
                ]}
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter your email"
                placeholderTextColor={NadaTheme.colors.textSecondary}
                onChangeText={(email) => {
                  setEmailAddress(email);
                  // Clear error message if user is fixing their input
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: undefined });
                    setErrorMessage(null);
                  }
                }}
                keyboardType="email-address"
              />
              {fieldErrors.email && (
                <Text style={authStyles.errorText}>{fieldErrors.email}</Text>
              )}
            </View>

            <View style={authStyles.inputContainer}>
              <Text style={authStyles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  authStyles.input,
                  fieldErrors.password ? authStyles.inputError : null,
                ]}
                value={password}
                placeholder="Enter your password"
                placeholderTextColor={NadaTheme.colors.textSecondary}
                secureTextEntry={true}
                onChangeText={(pass) => {
                  setPassword(pass);
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: undefined });
                  }
                }}
              />
              {fieldErrors.password && (
                <Text style={authStyles.errorText}>{fieldErrors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={authStyles.button}
              onPress={onSignInPress}
              disabled={loading}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={authStyles.footerContainer}>
            <Text style={authStyles.footerText}>
              Don&apos;t have an account?
            </Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text style={authStyles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

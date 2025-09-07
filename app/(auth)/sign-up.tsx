import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";
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
  getVerificationMessage,
} from "../../constants/AuthMessages";
import { NadaTheme } from "../../constants/NadaTheme";
import { useGoogleAuth } from "../../utils/oauth";
import {
  validateEmail,
  validatePasswordSecurity,
} from "../../utils/validation";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { handleGoogleSignIn } = useGoogleAuth();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [nadaMessage, setNadaMessage] = React.useState(getRandomAuthMessage());
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});

  // Handle Google sign-up
  const onGoogleSignUpPress = async () => {
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
          "Google sign-in failed. Maybe Google doesn't want to associate with you either."
        );
        setNadaMessage(
          "Even Google rejected you. That's a new level of failure."
        );
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage("Failed to connect with Google. Not that I'm surprised.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // Using imported validateEmail from utils/validation.ts

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    setFieldErrors({}); // Clear field-specific errors

    console.log("Starting sign-up process with:", { emailAddress });

    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Sign-up process timed out");
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

    // Client-side validation for email format using the utility function
    if (emailAddress.trim() && !validateEmail(emailAddress)) {
      setFieldErrors({
        email: "Email address must be a valid email address.",
      });
      setErrorMessage("Please enter a valid email address.");
      setNadaMessage(getValidationErrorMessage("email_invalid"));
      setLoading(false);
      return;
    }

    // Password validation using the utility function
    const passwordCheck = validatePasswordSecurity(password);
    if (!passwordCheck.isValid) {
      // Set appropriate error message based on the validation result
      switch (passwordCheck.reason) {
        case "too_short":
          setFieldErrors({
            password: "Password must be at least 8 characters.",
          });
          setErrorMessage("Your password is too short. Try harder.");
          setNadaMessage(getValidationErrorMessage("password_too_short"));
          break;
        case "too_common":
          setFieldErrors({
            password: "Password is too common or easily guessed.",
          });
          setErrorMessage(
            "Your password is too obvious. Try something more secure."
          );
          setNadaMessage(getValidationErrorMessage("password_compromised"));
          break;
        case "too_weak":
          setFieldErrors({
            password:
              "Password should contain letters, numbers, and special characters.",
          });
          setErrorMessage("Your password is too weak. Mix in some variety.");
          setNadaMessage(getValidationErrorMessage("password_too_weak"));
          break;
        default:
          setFieldErrors({
            password: "Password doesn't meet security requirements.",
          });
          setErrorMessage("Your password is inadequate. Fix it.");
          setNadaMessage(getValidationErrorMessage("password_too_weak"));
      }
      setLoading(false);
      return;
    }

    // Start sign-up process using email and password provided
    try {
      console.log("Calling Clerk signUp.create");
      await signUp.create({
        emailAddress,
        password,
      });

      console.log(
        "Clerk signUp.create successful, preparing email verification"
      );
      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      console.log(
        "Email verification prepared, setting pendingVerification to true"
      );
      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      console.error("Sign-up error details:", JSON.stringify(err, null, 2));

      // Extract error message to display to the user
      if (err.errors && err.errors.length > 0) {
        // Process all errors
        const newFieldErrors: { email?: string; password?: string } = {};
        let generalError = null;

        // Extract field-specific errors
        err.errors.forEach((error: any) => {
          console.log("Processing error:", error);

          if (
            error.meta?.paramName === "emailAddress" ||
            error.meta?.paramName === "identifier"
          ) {
            newFieldErrors.email = error.message;
          } else if (error.meta?.paramName === "password") {
            newFieldErrors.password = error.message;
          } else if (error.code === "form_param_format_invalid") {
            // Handle specific Clerk validation errors
            if (
              error.meta?.name === "email_address" ||
              error.meta?.name === "identifier"
            ) {
              newFieldErrors.email = "Email address format is invalid";
            } else {
              generalError = error.message || "Invalid format";
            }
          } else if (error.code === "not_allowed_access") {
            if (error.meta?.name === "email_address") {
              newFieldErrors.email =
                "Email contains invalid characters ('+', '=', '#' not allowed)";
            } else {
              generalError = error.message;
            }
          } else {
            generalError = error.message;
          }
        });

        // Update field errors
        setFieldErrors(newFieldErrors);

        // Set general error message (use first error if no specific field error)
        const firstError = err.errors[0];
        setErrorMessage(
          generalError ||
            firstError.message ||
            "Something went wrong. Try again."
        );

        // Update the Nada character message to be snarky about the error
        if (firstError.code === "form_password_length_too_short") {
          setNadaMessage(getValidationErrorMessage("password_too_short"));
        } else if (firstError.code === "form_identifier_exists") {
          setNadaMessage(getValidationErrorMessage("email_already_exists"));
        } else if (firstError.code === "form_password_pwned") {
          setNadaMessage(getValidationErrorMessage("password_compromised"));
        } else if (firstError.code === "form_param_format_invalid") {
          setNadaMessage(getValidationErrorMessage("email_invalid"));
        } else if (
          firstError.code === "not_allowed_access" &&
          firstError.meta?.name === "email_address"
        ) {
          setNadaMessage(getValidationErrorMessage("invalid_subaddress"));
        } else {
          setNadaMessage(getValidationErrorMessage("generic_error"));
        }
      } else {
        setErrorMessage(
          "Something went wrong. Try again or don't. I don't care."
        );
        setNadaMessage(getValidationErrorMessage("generic_error"));
      }
    } finally {
      clearTimeout(timeoutId);
      console.log("Sign-up process completed (success or error)");
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      setErrorMessage(
        "Verification failed. Did you type the code incorrectly? Typical."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
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
          <View style={authStyles.verificationContainer}>
            <NadaLogo size="medium" variant="auth" />
            <NadaAuthCharacter size={0.8} />
            <SpeechBubble message={getVerificationMessage(emailAddress)} />

            <View style={{ width: "100%", marginTop: 30 }}>
              <Text style={authStyles.verificationTitle}>
                Verify your email
              </Text>
              <Text style={authStyles.verificationSubtitle}>
                Enter the verification code we sent to {emailAddress}
              </Text>

              <TextInput
                style={authStyles.verificationCode}
                value={code}
                placeholder="Enter code"
                placeholderTextColor={NadaTheme.colors.textSecondary}
                onChangeText={(code) => setCode(code)}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity
                style={authStyles.button}
                onPress={onVerifyPress}
                disabled={loading}
              >
                <Text style={authStyles.buttonText}>
                  {loading ? "Verifying..." : "Verify and Continue"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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

          {/* Google Sign Up Button */}
          <GoogleSignInButton
            onPress={onGoogleSignUpPress}
            loading={googleLoading}
            label="Sign up with Google"
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
                placeholder="Create a password"
                placeholderTextColor={NadaTheme.colors.textSecondary}
                secureTextEntry={true}
                onChangeText={(pass) => {
                  setPassword(pass);
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: undefined });
                    setErrorMessage(null);
                  }
                }}
              />
              {fieldErrors.password && (
                <Text style={authStyles.errorText}>{fieldErrors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[authStyles.button, loading ? { opacity: 0.7 } : null]}
              onPress={onSignUpPress}
              disabled={loading}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={authStyles.footerContainer}>
            <Text style={authStyles.footerText}>Already have an account?</Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text style={authStyles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

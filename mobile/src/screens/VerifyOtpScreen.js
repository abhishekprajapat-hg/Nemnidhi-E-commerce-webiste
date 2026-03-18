import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FormField from "../components/FormField";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { finishAuthNavigation } from "../utils/navigation";

export default function VerifyOtpScreen({ navigation, route }) {
  const { verifyOtp, resendOtp, getErrorMessage } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState(route.params?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const redirectTo = route.params?.redirectTo || "";

  const handleVerify = async () => {
    if (!email.trim() || !otp.trim()) {
      showToast("Please enter your email and OTP.", "error");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        email: email.trim(),
        otp: otp.trim(),
      });
      showToast("Email verified successfully.", "success");
      finishAuthNavigation(navigation, redirectTo);
    } catch (error) {
      showToast(getErrorMessage(error, "OTP verification failed."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      showToast("Enter your email first.", "error");
      return;
    }

    setResending(true);
    try {
      await resendOtp(email.trim());
      showToast("A new OTP has been sent.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Could not resend OTP."), "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader showBack compact />

      <LinearGradient colors={["#FFFDF9", "#F7EADF", "#F3DDCF"]} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Verification</Text>
        <Text style={styles.title}>Confirm your email with the OTP.</Text>
        <Text style={styles.subtitle}>
          This keeps the same account flow across both web and mobile.
        </Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionEyebrow}>Secure Access</Text>
        <Text style={styles.sectionTitle}>Enter verification code</Text>

        <View style={styles.form}>
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter the 6 digit OTP"
            keyboardType="number-pad"
          />

          <PrimaryButton
            title="Verify OTP"
            onPress={handleVerify}
            loading={loading}
          />
          <PrimaryButton
            title="Resend OTP"
            variant="secondary"
            onPress={handleResend}
            loading={resending}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroCard: {
    ...shadow,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  formCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  sectionEyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
    marginTop: 4,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});

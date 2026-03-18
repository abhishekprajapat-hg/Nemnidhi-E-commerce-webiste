import React, { useMemo, useState } from "react";
import { StyleSheet, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import FormField from "../components/FormField";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";

function getPasswordStrength(password = "") {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[\W_]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", width: "25%", color: colors.danger };
  if (score === 2) return { label: "Fair", width: "50%", color: colors.warning };
  if (score === 3) return { label: "Good", width: "75%", color: colors.success };
  return { label: "Strong", width: "100%", color: colors.success };
}

export default function RegisterScreen({ navigation, route }) {
  const { register, getErrorMessage } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = route.params?.redirectTo || "";

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      showToast("Please fill all fields and use a stronger password.", "error");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      showToast("OTP sent to your email.", "success");
      navigation.navigate("VerifyOtp", {
        email: email.trim(),
        redirectTo,
      });
    } catch (error) {
      showToast(getErrorMessage(error, "Registration failed."), "error");
    } finally {
      setLoading(false);
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
        <Text style={styles.eyebrow}>Account</Text>
        <Text style={styles.title}>Create your Nemnidhi account.</Text>
        <Text style={styles.subtitle}>
          Registration mirrors the website, including OTP verification before the first sign-in.
        </Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionEyebrow}>New Profile</Text>
        <Text style={styles.sectionTitle}>Start your account</Text>

        <View style={styles.form}>
          <FormField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            autoCapitalize="none"
          />

          <View style={styles.strengthCard}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>Password strength</Text>
              <Text style={styles.strengthValue}>{strength.label}</Text>
            </View>
            <View style={styles.strengthTrack}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    backgroundColor: strength.color,
                    width: strength.width,
                  },
                ]}
              />
            </View>
          </View>

          <PrimaryButton
            title="Create Account"
            onPress={handleSubmit}
            loading={loading}
          />
          <PrimaryButton
            title="Already have an account?"
            variant="secondary"
            onPress={() =>
              navigation.navigate("Login", {
                redirectTo,
              })
            }
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
  strengthCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  strengthLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  strengthValue: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  strengthTrack: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    height: 8,
    overflow: "hidden",
  },
  strengthFill: {
    borderRadius: radius.pill,
    height: 8,
  },
});

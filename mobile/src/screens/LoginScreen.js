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

export default function LoginScreen({ navigation, route }) {
  const { login, getErrorMessage } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTo = route.params?.redirectTo || "";

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      showToast("Please enter email and password.", "error");
      return;
    }

    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      showToast("Welcome back.", "success");
      finishAuthNavigation(navigation, redirectTo);
    } catch (error) {
      showToast(getErrorMessage(error, "Login failed."), "error");
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
        <Text style={styles.title}>Sign in to continue shopping.</Text>
        <Text style={styles.subtitle}>
          Your cart, addresses, saved products, and orders stay in sync with the website account.
        </Text>
      </LinearGradient>

      <View style={styles.formCard}>
        <Text style={styles.sectionEyebrow}>Welcome Back</Text>
        <Text style={styles.sectionTitle}>Enter your details</Text>

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
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
          />

          <PrimaryButton
            title="Sign In"
            onPress={handleSubmit}
            loading={loading}
            style={styles.primary}
          />
          <PrimaryButton
            title="Create Account"
            variant="secondary"
            onPress={() =>
              navigation.navigate("Register", {
                redirectTo,
              })
            }
          />
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Mobile-first access</Text>
        <Text style={styles.noteText}>
          Google sign-in still lives on the website. This app currently starts with email and OTP
          support first.
        </Text>
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
  primary: {
    marginTop: 6,
  },
  noteCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  noteTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
  },
  noteText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
});

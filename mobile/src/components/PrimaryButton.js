import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, spacing } from "../theme/theme";

const VARIANTS = {
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    textColor: colors.white,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    textColor: colors.text,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: colors.accentStrong,
  },
};

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}) {
  const palette = VARIANTS[variant] || VARIANTS.primary;
  const isDisabled = disabled || loading;
  const content = loading ? (
    <ActivityIndicator color={palette.textColor} />
  ) : (
    <Text style={[styles.text, { color: palette.textColor }, textStyle]}>
      {title}
    </Text>
  );

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.55 : pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={[colors.accent, colors.accentStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={styles.flatFill}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    overflow: "hidden",
  },
  text: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  gradientFill: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  flatFill: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
});

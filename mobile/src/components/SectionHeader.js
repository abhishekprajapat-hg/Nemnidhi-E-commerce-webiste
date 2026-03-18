import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing, type } from "../theme/theme";

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
}) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.content}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  content: {
    flex: 1,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.muted,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  action: {
    color: colors.accentStrong,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

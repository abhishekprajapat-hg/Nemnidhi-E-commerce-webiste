import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow } from "../theme/theme";

const TYPE_COLORS = {
  success: colors.success,
  error: colors.danger,
  warning: colors.warning,
  info: colors.text,
};

export default function ToastHost({ toast }) {
  if (!toast?.message) return null;

  return (
    <View pointerEvents="none" style={styles.root}>
      <View
        style={[
          styles.toast,
          { backgroundColor: TYPE_COLORS[toast.type] || TYPE_COLORS.info },
        ]}
      >
        <Text style={styles.message}>{toast.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    bottom: 26,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 100,
  },
  toast: {
    ...shadow,
    borderRadius: radius.md,
    marginHorizontal: 16,
    maxWidth: 360,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});

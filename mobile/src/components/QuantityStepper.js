import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../theme/theme";

export default function QuantityStepper({
  value = 1,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  onChange,
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <Pressable
        disabled={!canDecrease}
        onPress={() => canDecrease && onChange?.(value - 1)}
        style={[styles.button, !canDecrease ? styles.buttonDisabled : null]}
      >
        <Text style={styles.symbol}>-</Text>
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        disabled={!canIncrease}
        onPress={() => canIncrease && onChange?.(value + 1)}
        style={[styles.button, !canIncrease ? styles.buttonDisabled : null]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  symbol: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    minWidth: 24,
    textAlign: "center",
  },
});

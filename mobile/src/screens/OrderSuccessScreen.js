import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";
import { formatCurrency } from "../utils/format";
import { openOrdersTab } from "../utils/navigation";

export default function OrderSuccessScreen({ navigation, route }) {
  const orderId = route.params?.orderId || route.params?.id || "";
  const totalPrice = route.params?.totalPrice || 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader compact />

      <LinearGradient colors={["#FFFDF9", "#F4E7D9", "#EFD9CC"]} style={styles.heroCard}>
        <Text style={styles.eyebrow}>Order Confirmed</Text>
        <Text style={styles.title}>Your order has been placed.</Text>
        <Text style={styles.subtitle}>
          The same backend flow used by the website has reserved your selected stock.
        </Text>
      </LinearGradient>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionEyebrow}>Receipt</Text>
        <Text style={styles.sectionTitle}>Order details</Text>

        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Order reference</Text>
          <Text style={styles.summaryValue}>{orderId || "Created successfully"}</Text>
          <Text style={[styles.summaryLabel, styles.summarySpacing]}>Total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalPrice)}</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="View My Orders" onPress={() => openOrdersTab(navigation)} />
          <PrimaryButton
            title="Continue Shopping"
            variant="secondary"
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "HomeTab",
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
    color: colors.success,
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
  summaryCard: {
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
  summaryPanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  summaryLabel: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: 6,
  },
  summarySpacing: {
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});

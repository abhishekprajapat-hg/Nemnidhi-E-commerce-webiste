import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, radius, shadow, spacing, type } from "../theme/theme";

const VALUES = [
  {
    title: "Artisan First",
    text: "We work directly with weaving families and independent ateliers to preserve craft and fair value.",
  },
  {
    title: "Authentic Textiles",
    text: "Every piece is selected for fabric integrity, drape quality, and finish consistency.",
  },
  {
    title: "Modern Heritage",
    text: "We blend traditional artistry with silhouettes designed for contemporary wardrobes.",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Discover",
    text: "We source across weaving clusters and boutique workshops to find standout creations.",
  },
  {
    step: "02",
    title: "Curate",
    text: "Each product is reviewed for weave, comfort, fit utility, and styling versatility.",
  },
  {
    step: "03",
    title: "Deliver",
    text: "Your selection is packed with care and shipped quickly with tracking and support.",
  },
];

export default function AboutScreen({ navigation }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader />

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>About Nemnidhi</Text>
        <Text style={styles.heroTitle}>
          Rooted in Indian craft, made for modern celebrations
        </Text>
        <Text style={styles.heroText}>
          Nemnidhi was built to celebrate handcrafted Indian textiles with a refined, wearable perspective.
          We focus on timeless pieces that feel special now and stay relevant for years.
        </Text>
      </View>

      <View style={styles.storyGrid}>
        <View style={styles.storyCard}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.storyText}>
            We started in 2025 with a simple goal: make authentic handcrafted clothing easier to discover, trust, and style.
          </Text>
          <Text style={styles.storyText}>
            By working closely with skilled makers, we curate collections that respect tradition while fitting real contemporary lifestyles.
          </Text>
          <Text style={styles.storyText}>
            Every drop is selected around quality, texture, and drape so your purchase feels meaningful from the first wear.
          </Text>
        </View>

        <LinearGradient colors={["#E8D7C6", "#F5EEE5"]} style={styles.storyVisual}>
          <Text style={styles.storyVisualText}>Craft, texture, and timeless drape.</Text>
        </LinearGradient>
      </View>

      <View style={styles.valuesList}>
        {VALUES.map((value) => (
          <View key={value.title} style={styles.valueCard}>
            <Text style={styles.valueTitle}>{value.title}</Text>
            <Text style={styles.valueText}>{value.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.processCard}>
        <Text style={styles.sectionTitle}>From Loom To You</Text>
        <View style={styles.processList}>
          {PROCESS.map((item) => (
            <View key={item.step} style={styles.processItem}>
              <Text style={styles.processStep}>{item.step}</Text>
              <Text style={styles.processTitle}>{item.title}</Text>
              <Text style={styles.processText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaCard}>
        <Text style={styles.sectionTitle}>Explore the Collection</Text>
        <Text style={styles.ctaText}>
          Discover curated drapes and elevated ethnic silhouettes crafted for festive moments and everyday grace.
        </Text>
        <PrimaryButton
          title="Shop Now"
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "ShopTab",
            })
          }
          style={styles.ctaButton}
        />
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.xl,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.muted,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    marginTop: 10,
  },
  heroText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 14,
  },
  storyGrid: {
    gap: spacing.md,
  },
  storyCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 38,
  },
  storyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
    marginTop: 12,
  },
  storyVisual: {
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 240,
    padding: spacing.xl,
    justifyContent: "flex-end",
  },
  storyVisualText: {
    color: colors.accentStrong,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  valuesList: {
    gap: spacing.md,
  },
  valueCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  valueTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  valueText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  processCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
  },
  processList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  processItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  processStep: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  processTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    marginTop: 8,
  },
  processText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  ctaCard: {
    ...shadow,
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
  },
  ctaText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  ctaButton: {
    marginTop: spacing.xl,
    minWidth: 170,
  },
});

import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MobileHeader from "../components/MobileHeader";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, radius, shadow, spacing } from "../theme/theme";

const POLICY_SECTIONS = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "We collect only the information required to process orders, deliver shipments, and provide customer support.",
      "Your data may be shared with payment, logistics, and analytics partners only for operational purposes.",
      "We do not sell or rent personal data. You may request correction or deletion by contacting support.",
    ],
  },
  terms: {
    id: "terms",
    title: "Terms and Conditions",
    lastUpdated: "January 2026",
    paragraphs: [
      "By using this website and placing orders, you agree to our terms.",
      "Product colors may vary slightly based on screen and lighting; this is not treated as a defect.",
      "Orders may be cancelled for payment mismatch, incorrect pricing, or fraud risk.",
    ],
  },
  shipping: {
    id: "shipping",
    title: "Shipping Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "Most orders are processed within 2-3 working days.",
      "Delivery timelines vary by location and courier serviceability.",
      "Tracking details are shared after dispatch through SMS, email, or WhatsApp.",
    ],
  },
  returns: {
    id: "returns",
    title: "Returns and Exchanges",
    lastUpdated: "January 2026",
    paragraphs: [
      "Exchange requests should be raised quickly after delivery with proof and intact tags.",
      "Refunds are issued only for valid cases such as damaged or incorrect items.",
      "Custom, altered, or final-sale products may not be eligible for return.",
    ],
  },
  cancellation: {
    id: "cancellation",
    title: "Cancellation Policy",
    lastUpdated: "January 2026",
    paragraphs: [
      "Orders can be cancelled before processing or dispatch.",
      "Prepaid cancellation refunds are made to the original payment method.",
      "Refund timing depends on payment provider processing cycles.",
    ],
  },
};

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Dispatch usually takes 2-3 working days, then transit time depends on your location.",
  },
  {
    q: "Can I exchange an item?",
    a: "Yes, eligible items can be exchanged if requested within the allowed window and condition requirements.",
  },
  {
    q: "When do I get refunds?",
    a: "After approval, refunds are processed to the original method. Banking timelines vary by provider.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach us via email at support@nemnidhiglam.com or WhatsApp at +91 82691 50205.",
  },
];

export default function PoliciesScreen({ navigation }) {
  const [active, setActive] = useState("privacy");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const sections = useMemo(() => Object.values(POLICY_SECTIONS), []);
  const selected = POLICY_SECTIONS[active];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MobileHeader showBack />

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Policies</Text>
        <Text style={styles.title}>Store Policies</Text>
        <Text style={styles.subtitle}>
          Every core store policy from the website is available here for quick reference.
        </Text>
      </View>

      <View style={styles.sectionNav}>
        {sections.map((section) => {
          const isActive = active === section.id;

          return (
            <Pressable
              key={section.id}
              onPress={() => setActive(section.id)}
              style={[styles.navChip, isActive ? styles.navChipActive : null]}
            >
              <Text style={[styles.navChipText, isActive ? styles.navChipTextActive : null]}>
                {section.title}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => setActive("faq")}
          style={[styles.navChip, active === "faq" ? styles.navChipActive : null]}
        >
          <Text style={[styles.navChipText, active === "faq" ? styles.navChipTextActive : null]}>
            FAQs
          </Text>
        </Pressable>
      </View>

      {active !== "faq" && selected ? (
        <View style={styles.contentCard}>
          <Text style={styles.contentTitle}>{selected.title}</Text>
          <Text style={styles.contentMeta}>Last updated: {selected.lastUpdated}</Text>
          <View style={styles.paragraphs}>
            {selected.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {active === "faq" ? (
        <View style={styles.contentCard}>
          <Text style={styles.contentTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <View key={faq.q} style={styles.faqCard}>
                  <Pressable
                    onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                    style={styles.faqTrigger}
                  >
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Text style={styles.faqToggle}>{isOpen ? "-" : "+"}</Text>
                  </Pressable>
                  {isOpen ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.supportCard}>
        <Text style={styles.contentTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          If you need support about shipping, refunds, or order issues, contact the same support team used by the website.
        </Text>
        <View style={styles.supportActions}>
          <PrimaryButton
            title="Contact Support"
            onPress={() =>
              navigation.navigate("MainTabs", {
                screen: "ContactTab",
              })
            }
          />
          <PrimaryButton
            title="WhatsApp"
            variant="secondary"
            onPress={() => Linking.openURL("https://wa.me/918269150205")}
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  heroCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    marginTop: 8,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  sectionNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  navChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  navChipText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  navChipTextActive: {
    color: colors.accentStrong,
  },
  contentCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  contentTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 34,
  },
  contentMeta: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 8,
    textTransform: "uppercase",
  },
  paragraphs: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  paragraph: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 24,
  },
  faqList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqTrigger: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  faqQuestion: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  faqToggle: {
    color: colors.accentStrong,
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 24,
  },
  faqAnswer: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  supportCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  supportText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  supportActions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});

import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import MobileHeader from "../components/MobileHeader";
import FormField from "../components/FormField";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, radius, shadow, spacing, type } from "../theme/theme";

const WHATSAPP_NUMBER = "+918269150205";
const SUPPORT_EMAIL = "support@nemnidhiglam.com";

function buildWhatsAppUrl({ name = "", email = "", message = "" } = {}) {
  const to = WHATSAPP_NUMBER.replace(/\D/g, "");
  const parts = [];
  if (name.trim()) parts.push(`Name: ${name.trim()}`);
  if (email.trim()) parts.push(`Email: ${email.trim()}`);
  if (message.trim()) parts.push(`Message: ${message.trim()}`);
  return `https://wa.me/${to}?text=${encodeURIComponent(parts.join("\n"))}`;
}

export default function ContactScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const quickWhatsAppUrl = useMemo(
    () => buildWhatsAppUrl({ message: "Hi! I need help with my order." }),
    []
  );

  const handleSend = async () => {
    if (!name.trim() || !message.trim()) return;

    setSending(true);
    try {
      await Linking.openURL(
        buildWhatsAppUrl({
          name,
          email,
          message,
        })
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stickyHeaderWrap}>
        <MobileHeader />
      </View>

      <View style={styles.titleCard}>
        <Text style={styles.eyebrow}>Contact</Text>
        <Text style={styles.heroTitle}>Let&apos;s talk</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Send a message</Text>
        <Text style={styles.helperText}>
          We typically respond within one business day.
        </Text>

        <View style={styles.formFields}>
          <FormField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          <FormField
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormField
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="How can we help?"
            multiline
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={sending ? "Opening..." : "Send via WhatsApp"}
            onPress={handleSend}
            loading={sending}
            disabled={!name.trim() || !message.trim()}
          />
          <PrimaryButton
            title="Clear"
            variant="secondary"
            onPress={() => {
              setName("");
              setEmail("");
              setMessage("");
            }}
          />
        </View>
      </View>

      <View style={styles.infoStack}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Contact Information</Text>
          <Text style={styles.infoText}>Indore, Madhya Pradesh, India</Text>
          <Text style={styles.infoText}>{WHATSAPP_NUMBER}</Text>
          <Text style={styles.infoText}>{SUPPORT_EMAIL}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <PrimaryButton
              title="Chat on WhatsApp"
              onPress={() => Linking.openURL(quickWhatsAppUrl)}
            />
            <PrimaryButton
              title="Call Us"
              variant="secondary"
              onPress={() => Linking.openURL(`tel:${WHATSAPP_NUMBER}`)}
            />
            <PrimaryButton
              title="Send Email"
              variant="secondary"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Support Hours</Text>
          <Text style={styles.infoText}>Mon-Sat: 10:00 to 19:00</Text>
          <Text style={styles.infoText}>Sunday: Closed</Text>
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
  stickyHeaderWrap: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xs,
    zIndex: 5,
  },
  titleCard: {
    marginBottom: 4,
  },
  eyebrow: {
    ...type.eyebrow,
    color: colors.muted,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 48,
    lineHeight: 48,
    marginTop: 8,
  },
  formCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 22,
  },
  helperText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 6,
  },
  formFields: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  infoStack: {
    gap: spacing.md,
  },
  infoCard: {
    ...shadow,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
  },
  infoTitle: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 18,
  },
  infoText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  quickActions: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});

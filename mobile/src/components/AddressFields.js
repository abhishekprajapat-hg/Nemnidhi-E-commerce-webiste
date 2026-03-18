import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ADDRESS_LABELS } from "../utils/address";
import { colors, fonts, radius, spacing } from "../theme/theme";
import FormField from "./FormField";

export default function AddressFields({ address, onChange, disabled = false }) {
  const update = (field, value) => {
    onChange?.({
      ...address,
      [field]: value,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Address Type</Text>
      <View style={styles.labelsRow}>
        {ADDRESS_LABELS.map((entry) => {
          const selected = address?.label === entry;

          return (
            <Pressable
              key={entry}
              disabled={disabled}
              onPress={() => update("label", entry)}
              style={[
                styles.labelChip,
                selected ? styles.labelChipSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.labelChipText,
                  selected ? styles.labelChipTextSelected : null,
                ]}
              >
                {entry}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FormField
        label="Full Name"
        value={address?.fullName || ""}
        onChangeText={(value) => update("fullName", value)}
        placeholder="Name for delivery"
        editable={!disabled}
      />
      <FormField
        label="Phone"
        value={address?.phone || ""}
        onChangeText={(value) => update("phone", value)}
        placeholder="Contact number"
        keyboardType="phone-pad"
        editable={!disabled}
      />
      <FormField
        label="Address"
        value={address?.address || ""}
        onChangeText={(value) => update("address", value)}
        placeholder="House number, street and area"
        multiline
        editable={!disabled}
      />
      <FormField
        label="Landmark"
        value={address?.landmark || ""}
        onChangeText={(value) => update("landmark", value)}
        placeholder="Nearby landmark"
        editable={!disabled}
      />
      <View style={styles.row}>
        <FormField
          label="City"
          value={address?.city || ""}
          onChangeText={(value) => update("city", value)}
          placeholder="City"
          style={styles.flex}
          editable={!disabled}
        />
        <FormField
          label="Postal Code"
          value={address?.postalCode || ""}
          onChangeText={(value) => update("postalCode", value)}
          placeholder="PIN code"
          keyboardType="number-pad"
          style={styles.flex}
          editable={!disabled}
        />
      </View>
      <FormField
        label="State / Country"
        value={address?.country || ""}
        onChangeText={(value) => update("country", value)}
        placeholder="State"
        editable={!disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  labelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  labelChip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  labelChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  labelChipText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  labelChipTextSelected: {
    color: colors.white,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
});

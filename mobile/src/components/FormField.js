import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing } from "../theme/theme";

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  editable = true,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  style,
  inputStyle,
  ...rest
}) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          !editable ? styles.disabled : null,
          inputStyle,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  disabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.muted,
  },
});

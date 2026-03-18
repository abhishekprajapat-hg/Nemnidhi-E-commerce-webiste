import { Platform } from "react-native";

export const colors = {
  background: "#F5EEE5",
  elevated: "#F1E7DB",
  surface: "#FFFAF4",
  surfaceMuted: "#F7EDE2",
  card: "#FFFDF9",
  accent: "#B85234",
  accentStrong: "#91361F",
  accentSoft: "#F2D2C4",
  text: "#1F1915",
  muted: "#6D6158",
  border: "rgba(95, 75, 55, 0.24)",
  success: "#1D7244",
  warning: "#C68125",
  danger: "#B84536",
  overlay: "rgba(35, 21, 13, 0.14)",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 12,
  md: 20,
  lg: 24,
  xl: 30,
  pill: 999,
};

export const fonts = {
  display: "CormorantGaramond_600SemiBold",
  displayBold: "CormorantGaramond_700Bold",
  body: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semiBold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extraBold: "Manrope_800ExtraBold",
};

export const type = {
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#3A1F12",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});

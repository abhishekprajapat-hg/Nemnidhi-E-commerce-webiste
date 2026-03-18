import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/theme";

export default function RemoteImage({
  uri,
  label = "Nemnidhi",
  style,
  imageStyle,
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (!uri || hasError) {
    return (
      <LinearGradient
        colors={["#F8E6D8", "#F2C9AE"]}
        style={[styles.placeholder, style]}
      >
        <Text style={styles.placeholderText}>
          {String(label || "N").trim().charAt(0).toUpperCase() || "N"}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, style, imageStyle]}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderText: {
    color: colors.accentStrong,
    fontSize: 28,
    fontWeight: "800",
  },
});

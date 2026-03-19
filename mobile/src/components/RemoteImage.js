import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/theme";

export default function RemoteImage({
  uri,
  label = "Nemnidhi",
  style,
  imageStyle,
}) {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(Boolean(uri));

  useEffect(() => {
    setHasError(false);
    setLoading(Boolean(uri));
  }, [uri]);

  const fallback = (
    <LinearGradient
      colors={["#F8E6D8", "#F2C9AE"]}
      style={styles.placeholder}
    >
      <Text style={styles.placeholderText}>
        {String(label || "N").trim().charAt(0).toUpperCase() || "N"}
      </Text>
      {loading && !hasError ? (
        <ActivityIndicator color={colors.accentStrong} style={styles.loader} />
      ) : null}
    </LinearGradient>
  );

  return (
    <View style={[styles.frame, style]}>
      {fallback}
      {uri && !hasError ? (
        <Image
          source={{ uri }}
          style={[
            styles.fillImage,
            loading ? styles.hiddenImage : null,
            imageStyle,
          ]}
          resizeMode="cover"
          onLoadStart={() => {
            setHasError(false);
            setLoading(true);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setHasError(true);
            setLoading(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  placeholder: {
    alignItems: "center",
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  fillImage: {
    ...StyleSheet.absoluteFillObject,
  },
  hiddenImage: {
    opacity: 0,
  },
  loader: {
    marginTop: 10,
  },
  placeholderText: {
    color: colors.accentStrong,
    fontSize: 28,
    fontWeight: "800",
  },
});

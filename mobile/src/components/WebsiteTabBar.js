import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { colors, fonts } from "../theme/theme";

const TAB_META = {
  HomeTab: { label: "Home", icon: "house" },
  ShopTab: { label: "Shop", icon: "bag-shopping" },
  AboutTab: { label: "About", icon: "circle-info" },
  ContactTab: { label: "Contact", icon: "phone" },
  ProfileTab: { label: "Profile", icon: "circle-user" },
};

export default function WebsiteTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] || {
            label: options.tabBarLabel || route.name,
            icon: "circle",
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.item}
            >
              <View
                style={[
                  styles.iconBubble,
                  meta.label === "Profile"
                    ? isFocused
                      ? styles.profileIconFocused
                      : styles.profileIcon
                    : null,
                ]}
              >
                <FontAwesome6
                  color={isFocused ? colors.text : colors.muted}
                  iconStyle="solid"
                  name={meta.icon}
                  size={18}
                />
              </View>
              <Text style={styles.srLikeText}>{meta.label}</Text>
              <View style={[styles.dot, isFocused ? styles.dotActive : null]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "rgba(255, 250, 244, 0.96)",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 6,
    paddingTop: 6,
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
  item: {
    alignItems: "center",
    flex: 1,
    minHeight: 54,
    justifyContent: "center",
  },
  iconBubble: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileIcon: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  profileIconFocused: {
    borderColor: colors.text,
    borderWidth: 2,
  },
  srLikeText: {
    color: "transparent",
    fontFamily: fonts.bold,
    fontSize: 1,
    height: 1,
    marginTop: 0,
  },
  dot: {
    backgroundColor: colors.text,
    borderRadius: 999,
    height: 4,
    marginTop: 2,
    opacity: 0,
    width: 4,
  },
  dotActive: {
    opacity: 1,
  },
});

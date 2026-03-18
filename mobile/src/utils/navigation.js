export const openOrdersTab = (navigation) => {
  navigation.navigate("MainTabs", {
    screen: "ProfileTab",
    params: { tab: "orders" },
  });
};

export const openShopTab = (navigation, category = "") => {
  navigation.navigate("MainTabs", {
    screen: "ShopTab",
    params: category ? { category } : undefined,
  });
};

export const finishAuthNavigation = (navigation, redirectTo = "") => {
  if (redirectTo === "Checkout") {
    navigation.replace("Checkout");
    return;
  }

  if (redirectTo === "Orders") {
    openOrdersTab(navigation);
    return;
  }

  if (redirectTo === "ProfileTab") {
    navigation.navigate("MainTabs", {
      screen: "ProfileTab",
    });
    return;
  }

  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate("MainTabs");
};

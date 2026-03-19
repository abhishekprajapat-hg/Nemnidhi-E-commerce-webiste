function navigateTab(navigation, screen, params) {
  navigation.navigate("MainTabs", {
    screen,
    params:
      params && Object.keys(params).some((key) => params[key] !== undefined && params[key] !== "")
        ? params
        : undefined,
  });
}

function normalizeShopParams(input = "") {
  if (!input) return undefined;

  if (typeof input === "string") {
    return {
      category: input,
    };
  }

  if (typeof input === "object") {
    const next = {
      category: String(input.category || "").trim(),
      sort: String(input.sort || "").trim(),
      query: String(input.query || "").trim(),
      minRating: String(input.minRating || "").trim(),
    };

    return Object.keys(next).some((key) => next[key]) ? next : undefined;
  }

  return undefined;
}

function parseHref(href = "") {
  const raw = String(href || "").trim();
  const sanitized = raw.replace(/^https?:\/\/[^/]+/i, "") || "/";
  const [pathname, queryString = ""] = sanitized.split("?");
  const search = {};

  queryString
    .split("&")
    .filter(Boolean)
    .forEach((entry) => {
      const [key, value = ""] = entry.split("=");
      if (!key) return;
      search[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
    });

  return {
    pathname: pathname || "/",
    search,
  };
}

export const openProfileTab = (navigation, tab = "profile") => {
  navigateTab(navigation, "ProfileTab", { tab });
};

export const openOrdersTab = (navigation) => {
  openProfileTab(navigation, "orders");
};

export const openShopTab = (navigation, next = "") => {
  navigateTab(navigation, "ShopTab", normalizeShopParams(next));
};

export const openWebsiteDestination = (navigation, href = "/") => {
  const { pathname, search } = parseHref(href);

  if (pathname === "/") {
    navigateTab(navigation, "HomeTab");
    return;
  }

  if (pathname === "/products") {
    openShopTab(navigation, {
      category: search.category || "",
      sort: search.sort || "",
      query: search.q || search.query || "",
      minRating: search.minRating || "",
    });
    return;
  }

  if (pathname === "/new-arrivals") {
    navigation.navigate("NewArrivals");
    return;
  }

  if (pathname === "/about") {
    navigateTab(navigation, "AboutTab");
    return;
  }

  if (pathname === "/contact") {
    navigateTab(navigation, "ContactTab");
    return;
  }

  if (pathname === "/policies") {
    navigation.navigate("Policies");
    return;
  }

  if (pathname === "/cart") {
    navigation.navigate("Cart");
    return;
  }

  if (pathname === "/checkout") {
    navigation.navigate("Checkout");
    return;
  }

  if (pathname === "/login") {
    navigation.navigate("Login");
    return;
  }

  if (pathname === "/register") {
    navigation.navigate("Register");
    return;
  }

  if (pathname === "/verify-otp") {
    navigation.navigate("VerifyOtp");
    return;
  }

  if (pathname === "/profile") {
    openProfileTab(navigation, search.tab || "profile");
    return;
  }

  if (pathname.startsWith("/product/")) {
    const productId = pathname.split("/").filter(Boolean).pop();
    if (productId) {
      navigation.navigate("ProductDetails", { productId });
      return;
    }
  }

  if (pathname.startsWith("/order/success/")) {
    const orderId = pathname.split("/").filter(Boolean).pop();
    navigation.navigate("OrderSuccess", {
      orderId,
      id: orderId,
    });
    return;
  }

  openShopTab(navigation);
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

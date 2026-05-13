// src/config/regionConfig.js

const REGION_CONFIGS = {
  IN: {
    region: "IN",
    currencySymbol: formatPrice(FINAL),
    currencyCode: "INR",

    instantPrice: 199,
    prebookPrice: 499,

    instantMrp: 2999,
    promoPct: 25,
  },

  US: {
    region: "US",
    currencySymbol: formatPrice(FINAL),
    currencyCode: "USD",

    instantPrice: 9,
    prebookPrice: 19,

    instantMrp: 49,
    promoPct: 0,
  },

  UK: {
    region: "UK",
    currencySymbol: formatPrice(FINAL),
    currencyCode: "GBP",

    instantPrice: 7,
    prebookPrice: 15,

    instantMrp: 39,
    promoPct: 0,
  },
};

export function getRegionConfig() {
  if (typeof window === "undefined") {
    return REGION_CONFIGS.IN;
  }

  const host = window.location.hostname.toLowerCase();

  // USA
  if (host.includes("rajanbusinessreports.com")) {
    return REGION_CONFIGS.US;
  }

  // UK
  if (host.includes("rajanbusinessreports.co.uk")) {
    return REGION_CONFIGS.UK;
  }

  // India default
  return REGION_CONFIGS.IN;
}

export function formatPrice(value) {
  const cfg = getRegionConfig();
  return `${cfg.currencySymbol}${value}`;
}

export default REGION_CONFIGS;

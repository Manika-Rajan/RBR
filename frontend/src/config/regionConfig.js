// src/config/regionConfig.js

const REGION_CONFIGS = {
  IN: {
    region: "IN",
    currencySymbol: "₹",
    currencyCode: "INR",
  
    instantPrice: 199,
    prebookPrice: 499,
    finalReportPrice: 2999,
  
    finalReportMrp: 3999,
    promoPct: 25,
  },
  US: {
    region: "US",
    currencySymbol: "$",
    currencyCode: "USD",
  
    instantPrice: 9,
    prebookPrice: 19,
    finalReportPrice: 49,
  
    finalReportMrp: 69,
    promoPct: 25,
  },
  UK: {
    region: "UK",
    currencySymbol: "£",
    currencyCode: "GBP",
  
    instantPrice: 7,
    prebookPrice: 15,
    finalReportPrice: 39,
  
    finalReportMrp: 55,
    promoPct: 25,
  },
};

export function getRegionConfig() {
  if (typeof window === "undefined") return REGION_CONFIGS.IN;

  const host = window.location.hostname.toLowerCase();

  if (host.includes("rajanbusinessreports.co.uk")) return REGION_CONFIGS.UK;
  if (host.includes("rajanbusinessreports.com")) return REGION_CONFIGS.US;

  return REGION_CONFIGS.IN;
}

export function formatPrice(value) {
  const cfg = getRegionConfig();
  return `${cfg.currencySymbol}${value}`;
}

export default REGION_CONFIGS;

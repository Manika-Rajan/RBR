import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { StoreProvider } from "./Store";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// configure(awsmobile);

/**
 * Google OAuth Branding Verification Helper
 *
 * Purpose:
 * Google verification needs the homepage to clearly mention the OAuth app name:
 * "Rajan Business Reports Traffic Intelligence"
 *
 * This keeps the text extremely subtle for normal visitors, but still visible
 * on the page for Google verification/review.
 */
function setupOAuthBrandingVerification() {
  const appName = "Rajan Business Reports Traffic Intelligence";
  const description =
    "Rajan Business Reports Traffic Intelligence is an internal analytics tool of Rajan Business Reports used to review Google Ads campaign performance, search terms, website searches, leads, and report sales.";

  // Page title
  document.title = `${appName} | Rajan Business Reports`;

  // Meta description
  let descriptionMeta = document.querySelector('meta[name="description"]');
  if (!descriptionMeta) {
    descriptionMeta = document.createElement("meta");
    descriptionMeta.setAttribute("name", "description");
    document.head.appendChild(descriptionMeta);
  }
  descriptionMeta.setAttribute("content", description);

  // Open Graph title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement("meta");
    ogTitle.setAttribute("property", "og:title");
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute("content", `${appName} | Rajan Business Reports`);

  // Open Graph description
  let ogDescription = document.querySelector('meta[property="og:description"]');
  if (!ogDescription) {
    ogDescription = document.createElement("meta");
    ogDescription.setAttribute("property", "og:description");
    document.head.appendChild(ogDescription);
  }
  ogDescription.setAttribute("content", description);

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", "https://www.rajanbusinessreports.in/");

  // Subtle visible footer line for Google OAuth branding verification
  const existingFooter = document.getElementById("rbr-oauth-branding-note");
  if (!existingFooter) {
    const footer = document.createElement("div");
    footer.id = "rbr-oauth-branding-note";
    footer.setAttribute("aria-label", "Rajan Business Reports Traffic Intelligence branding note");

    footer.style.fontSize = "9px";
    footer.style.lineHeight = "1.25";
    footer.style.color = "#d1d5db";
    footer.style.textAlign = "center";
    footer.style.padding = "4px 8px 6px";
    footer.style.marginTop = "4px";
    footer.style.background = "#ffffff";
    footer.style.fontWeight = "400";

    footer.innerHTML = `
      <div>
        Rajan Business Reports Traffic Intelligence is an internal analytics tool of Rajan Business Reports.
      </div>
      <div style="margin-top:2px;">
        <a href="/privacy-policy" style="color:#d1d5db;text-decoration:underline;text-underline-offset:2px;">
          Privacy Policy
        </a>
        <span style="color:#e5e7eb;margin:0 4px;">•</span>
        <a href="/terms" style="color:#d1d5db;text-decoration:underline;text-underline-offset:2px;">
          Terms of Service
        </a>
      </div>
    `;

    document.body.appendChild(footer);
  }
}

setupOAuthBrandingVerification();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id='root' was not found.");
}

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results, for example: reportWebVitals(console.log)
reportWebVitals();

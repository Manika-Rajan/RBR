// RBR/frontend/src/components/ReportsDisplayMobile.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";
import Login from "./Login";
import { getRegionConfig } from "../config/regionConfig";

// ====== Pricing ======
const REGION = getRegionConfig();

const DEFAULT_MRP = REGION.finalReportMrp;
const DEFAULT_PROMO_PCT = REGION.promoPct;
const DEFAULT_FINAL = REGION.finalReportPrice;

// ====== Lead API ======
const LEAD_API_URL =
  "https://k00o7isai2.execute-api.ap-south-1.amazonaws.com/wa-webhook";

const SUGGEST_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/suggest";

// ====== RBR first-party funnel tracking ======
// Uses the same sessionStorage keys and production endpoint as ReportsMobile,
// so a visitor's search journey continues into /report-display without creating
// a new funnel session. No name, phone, email, or other PII is sent here.
const RBR_FUNNEL_TRACK_URL =
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/google-ads-funnel-event";

const RBR_FUNNEL_ATTR_KEYS = [
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "campaignid",
  "adgroupid",
  "keyword",
  "matchtype",
  "device",
  "network",
  "creative",
];

function getRbrFunnelSessionId() {
  if (typeof window === "undefined") return "";

  try {
    const key = "rbr_funnel_session_id";
    let id = sessionStorage.getItem(key);

    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `rbr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      sessionStorage.setItem(key, id);
    }

    return id;
  } catch {
    return "";
  }
}

function getRbrFunnelAttribution() {
  if (typeof window === "undefined") return {};

  const storageKey = "rbr_funnel_attribution";

  try {
    const existing = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    const params = new URLSearchParams(window.location.search || "");
    const incoming = {};

    RBR_FUNNEL_ATTR_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) incoming[key] = value.slice(0, 250);
    });

    const merged = { ...existing, ...incoming };
    sessionStorage.setItem(storageKey, JSON.stringify(merged));
    return merged;
  } catch {
    return {};
  }
}

function trackExistingReportFunnelEvent({
  eventName,
  reportQuery = "",
  extra = {},
}) {
  if (!eventName || !RBR_FUNNEL_TRACK_URL) return;

  const eventId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const body = {
    event_id: eventId,
    session_id: getRbrFunnelSessionId(),
    event_name: eventName,
    event_ts: new Date().toISOString(),
    page_path:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "",
    report_query: String(reportQuery || "").trim().slice(0, 120),
    product_type: "existing_report",
    sample_seen: false,
    attribution: getRbrFunnelAttribution(),
    ...extra,
  };

  fetch(RBR_FUNNEL_TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch((trackingError) => {
    console.warn(
      "[RBR funnel] existing-report event failed:",
      eventName,
      trackingError
    );
  });
}

// 🔹 How many pages are fully free to read (0-based index)
//    1 => pages 0 and 1 (i.e. page 1 & page 2)
const UNLOCKED_MAX_PAGE = 3;

const ReportsDisplayMobile = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // From router state
  const reportSlugFromState = location.state?.reportSlug || "";

  // Direct links from generated PDFs use:
  // /report-display?slug=<catalogue-slug>
  const reportSlugFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get("slug") || "").trim();
  }, [location.search]);

  const needsCatalogueLookup =
    !!reportSlugFromQuery && !reportSlugFromState;

  const [catalogReport, setCatalogReport] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(needsCatalogueLookup);
  const [catalogError, setCatalogError] = useState("");

  const fileKeyLegacy = location.state?.fileKey || ""; // legacy fallback

  // Navigation state continues to take priority. Catalogue values are used
  // only for direct ?slug= links that do not have React router state.
  const reportId =
    location.state?.reportId ||
    catalogReport?.report_id ||
    catalogReport?.reportId ||
    "";

  const reportTitleFromState =
    location.state?.reportTitle ||
    catalogReport?.title ||
    "";

  const previewKeyFromState =
    location.state?.previewKey ||
    catalogReport?.preview_key ||
    catalogReport?.previewKey ||
    "";

  const fullKeyFromState =
    location.state?.fullKey ||
    catalogReport?.full_key ||
    catalogReport?.fullKey ||
    "";

  const currencyCode =
    location.state?.currency ||
    catalogReport?.currency ||
    REGION.currencyCode;

  const reportType =
    location.state?.reportType ||
    catalogReport?.report_type ||
    catalogReport?.reportType ||
    "catalogue";

  const incomingPrice = Number(
    location.state?.price ?? catalogReport?.price
  );
  const incomingMrp = Number(
    location.state?.mrp ?? catalogReport?.mrp
  );
  const incomingPromoPct = Number(
    location.state?.promoPct ??
      catalogReport?.promo_pct ??
      catalogReport?.promoPct
  );

  const FINAL =
    Number.isFinite(incomingPrice) && incomingPrice > 0
      ? incomingPrice
      : DEFAULT_FINAL;

  const MRP =
    Number.isFinite(incomingMrp) && incomingMrp > 0
      ? incomingMrp
      : DEFAULT_MRP;

  const PROMO_PCT =
    Number.isFinite(incomingPromoPct) && incomingPromoPct >= 0
      ? incomingPromoPct
      : DEFAULT_PROMO_PCT;

  // Use the actual MRP-to-selling-price difference for customer-facing discount
  // messaging. This prevents contradictory displays such as "0% OFF" while
  // showing a crossed-out MRP above a lower selling price.
  const CALCULATED_PROMO_PCT =
    MRP > FINAL && FINAL > 0
      ? Math.max(0, Math.round(((MRP - FINAL) / MRP) * 100))
      : 0;

  const EFFECTIVE_PROMO_PCT =
    CALCULATED_PROMO_PCT > 0
      ? CALCULATED_PROMO_PCT
      : MRP > FINAL && PROMO_PCT > 0
      ? PROMO_PCT
      : 0;

  const HAS_DISCOUNT = EFFECTIVE_PROMO_PCT > 0 && MRP > FINAL;

  const currencySymbol =
    currencyCode === "INR"
      ? "₹"
      : currencyCode === "USD"
      ? "$"
      : currencyCode === "GBP"
      ? "£"
      : REGION.currencySymbol;

  const { state, dispatch: cxtDispatch } = useStore();
  const { status = false, email = "", userInfo = {} } = state || {};
  const isLoggedIn = !!userInfo?.isLogin;

  // Purchases list: array of slugs, e.g., ["paper_industry", "fmcg"]
  const purchases = userInfo?.purchases || [];

  // Derive slug from legacy fileKey if needed
  const derivedSlugFromFileKey = useMemo(() => {
    if (!fileKeyLegacy) return "";
    const m = fileKeyLegacy.match(/([a-z0-9_]+)(?:_preview)?\.pdf$/i);
    return m ? m[1] : "";
  }, [fileKeyLegacy]);

  const reportSlug =
    reportSlugFromState ||
    catalogReport?.slug ||
    reportSlugFromQuery ||
    derivedSlugFromFileKey ||
    "paper_industry";

  // Purchased?
  const isPurchased = purchases.includes(reportSlug);

  // During a direct-link lookup, wait for the exact catalogue record before
  // deciding the S3 key. This prevents an incorrect fallback report loading.
  const desiredKey =
    needsCatalogueLookup && catalogLoading
      ? ""
      : isPurchased
      ? fullKeyFromState || `${reportSlug}.pdf`
      : previewKeyFromState ||
        fileKeyLegacy ||
        `${reportSlug}_preview.pdf`;

  // UI state
  const [openModel, setOpenModel] = useState(false); // login/payment modal
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  // Lead capture modal
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadMsg, setLeadMsg] = useState("");

  // NEW: country code for WhatsApp
  const [leadCountryCode, setLeadCountryCode] = useState("+91");

  // OTP / consent flow
  const [leadStep, setLeadStep] = useState("form"); // "form" | "otp" | "wa_wait"
  const [leadToken, setLeadToken] = useState("");
  const [leadChannel, setLeadChannel] = useState(""); // "email" or "whatsapp"
  const [leadOtp, setLeadOtp] = useState("");

  // 🔹 NEW: track current page in the PDF viewer
  const [currentPage, setCurrentPage] = useState(0);

  // ====== Resolve direct ?slug= links from the catalogue ======
  useEffect(() => {
    if (!needsCatalogueLookup) {
      setCatalogReport(null);
      setCatalogLoading(false);
      setCatalogError("");
      return;
    }

    const controller = new AbortController();

    const parsePayload = (raw) => {
      if (typeof raw?.body === "string") {
        try {
          return JSON.parse(raw.body);
        } catch {
          return {};
        }
      }

      if (raw?.body && typeof raw.body === "object") {
        return raw.body;
      }

      return raw || {};
    };

    const fetchExactCatalogueReport = async () => {
      setCatalogLoading(true);
      setCatalogError("");
      setError("");
      setPdfUrl("");

      try {
        // Try both the literal slug and its human-readable form. The result
        // is accepted only when the returned slug is an exact match.
        const lookupQueries = [
          reportSlugFromQuery,
          reportSlugFromQuery.replace(/_/g, " "),
        ];

        let exactMatch = null;

        for (const query of lookupQueries) {
          const response = await fetch(SUGGEST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ q: query, limit: 25 }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const responseText = await response.text();
            throw new Error(
              `Catalogue lookup failed (${response.status}): ${responseText}`
            );
          }

          const raw = await response.json();
          const payload = parsePayload(raw);
          const items = Array.isArray(payload?.items) ? payload.items : [];

          exactMatch = items.find(
            (item) =>
              String(item?.slug || "").trim().toLowerCase() ===
              reportSlugFromQuery.toLowerCase()
          );

          if (exactMatch) break;
        }

        if (!exactMatch) {
          throw new Error(
            "This report could not be found in the catalogue."
          );
        }

        setCatalogReport(exactMatch);
      } catch (lookupError) {
        if (lookupError?.name === "AbortError") return;

        console.error("Direct report catalogue lookup error:", lookupError);
        const message =
          lookupError?.message ||
          "This report could not be loaded from the catalogue.";

        setCatalogReport(null);
        setCatalogError(message);
        setError(message);
        setIsLoading(false);
      } finally {
        if (!controller.signal.aborted) {
          setCatalogLoading(false);
        }
      }
    };

    fetchExactCatalogueReport();

    return () => controller.abort();
  }, [needsCatalogueLookup, reportSlugFromQuery]);

  // Whether to lock pages beyond the free sample
  const shouldLock =
    !isPurchased &&
    typeof currentPage === "number" &&
    currentPage > UNLOCKED_MAX_PAGE;

  // ====== Fetch presigned URL ======
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (catalogLoading) return;

      if (catalogError) {
        setIsLoading(false);
        setPdfUrl("");
        setError(catalogError);
        return;
      }

      if (!desiredKey) {
        setIsLoading(false);
        setPdfUrl("");
        setError("No report key determined. Please try again.");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_key: desiredKey }),
          }
        );

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`HTTP ${response.status}: ${txt}`);
        }

        const data = await response.json();

        if (!data.presigned_url) {
          throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
        }

        setPdfUrl(data.presigned_url);
      } catch (err) {
        console.error("Error fetching presigned URL:", err);
        setPdfUrl("");
        setError("Failed to load report. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [desiredKey, catalogLoading, catalogError]);

  // ====== GA: report preview view ======
  useEffect(() => {
    if (pdfUrl) {
      window.gtag?.("event", "report_preview_view", {
        event_category: "engagement",
        report_slug: reportSlug,
        is_purchased: isPurchased ? "yes" : "no",
      });
    }
  }, [pdfUrl, reportSlug, isPurchased]);

  // ====== PAYMENT FLOW ======
  const goToPayment = () => {
    const paymentFileKey = fullKeyFromState || `${reportSlug}.pdf`;

    // First-party funnel event only. This does NOT fire a Google Ads conversion
    // and does not alter the existing GA4 buy_now_click event below.
    trackExistingReportFunnelEvent({
      eventName: "existing_report_checkout_started",
      reportQuery: title || reportSlug,
      extra: {
        product_type: "existing_report",
        selected_product: reportSlug,
        displayed_price: Number(FINAL || 0),
        currency: currencyCode,
        login_mode: isLoggedIn ? "already_logged_in" : "login_required",
      },
    });

    window.gtag?.("event", "buy_now_click", {
      event_category: "engagement",
      event_label: "mobile_reports_display",
      value: FINAL,
      currency: currencyCode,
      report_id: reportId,
      report_slug: reportSlug,
      price_mrp: MRP,
      price_final: FINAL,
      promo_pct: EFFECTIVE_PROMO_PCT,
    });

    cxtDispatch({
      type: "SET_FILE_REPORT",
      payload: {
        fileKey: paymentFileKey,
        reportId,
        reportSlug,
        reportTitle: title,
        price: FINAL,
        mrp: MRP,
        promoPct: EFFECTIVE_PROMO_PCT,
        currency: currencyCode,
        reportType,
      },
    });

    // Persist payment context for refresh/login fallback safety.
    localStorage.setItem("amount", String(FINAL));
    localStorage.setItem("reportId", reportId || "");
    localStorage.setItem("fileKey", paymentFileKey);

    if (isLoggedIn) {
      navigate("/payment", {
        state: {
          fromReport: true,
          amount: FINAL,
          reportId,
          fileKey: paymentFileKey,
          reportSlug,
          reportTitle: title,
          mrp: MRP,
          promoPct: EFFECTIVE_PROMO_PCT,
          currency: currencyCode,
          reportType,
        },
      });
    } else {
      setOpenModel(true);
    }
  };

  const changeStatus = () => {
    setOpenModel(false);
    cxtDispatch({ type: "SET_REPORT_STATUS" });
  };

  const title =
    reportTitleFromState ||
    reportSlug
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());

  // If the catalogue title already contains a year (for example, 2024), show it
  // transparently instead of implying that an older report is current.
  // Report freshness metadata. Prefer explicit catalogue/router metadata, then
  // fall back to a year embedded in the visible title. The FMCG catalogue item
  // currently has an older PDF whose internal title says 2024, while the
  // catalogue title itself omits the year, so keep a temporary slug fallback
  // until Bulk Reports republishes the refreshed report with year metadata.
  const explicitReportYear =
    location.state?.reportYear ||
    location.state?.report_year ||
    location.state?.year ||
    catalogReport?.report_year ||
    catalogReport?.reportYear ||
    catalogReport?.year ||
    "";

  const reportYearMatch = String(title || "").match(/\b(?:19|20)\d{2}\b/);
  const normalizedReportIdentity = `${reportSlug || ""} ${title || ""}`.toLowerCase();
  const legacyReportYear = normalizedReportIdentity.includes("fmcg") ? "2024" : "";

  const reportYear = String(
    explicitReportYear ||
      (reportYearMatch ? reportYearMatch[0] : "") ||
      legacyReportYear ||
      ""
  ).trim();

  // ====== Lead capture ======
  const openLead = () => {
    setLeadMsg("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadOtp("");
    setLeadToken("");
    setLeadChannel("");
    setLeadStep("form");
    setLeadOpen(true);
    window.gtag?.("event", "lead_capture_open", {
      event_category: "engagement",
      report_slug: reportSlug,
    });
  };

  // Step 1: request OTP / WA consent
  const submitLead = async () => {
    if (!leadEmail && !leadPhone) {
      setLeadMsg("Please enter your email or WhatsApp number.");
      return;
    }

    // Normalise phone into +E.164 if provided
    let normalizedPhone = undefined;
    if (leadPhone) {
      const digitsOnly = leadPhone.replace(/\D/g, ""); // strip spaces, dashes, etc.
      if (!digitsOnly) {
        setLeadMsg("Please enter a valid WhatsApp number.");
        return;
      }
      normalizedPhone = `${leadCountryCode}${digitsOnly}`;
    }

    setLeadBusy(true);
    setLeadMsg("");
    try {
      const resp = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RBR-Action": "request",
        },
        body: JSON.stringify({
          email: leadEmail || undefined,
          phone: normalizedPhone,
          report_slug: reportSlug,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Request failed (${resp.status})`);
      }

      const channel = data.channel || (normalizedPhone ? "whatsapp" : "email");
      setLeadToken(data.token || "");
      setLeadChannel(channel);

      if (channel === "email") {
        setLeadStep("otp");
        setLeadMsg(
          "We’ve sent a 6-digit code to your email. Enter it below to receive your 2-page preview."
        );
      } else {
        setLeadStep("wa_wait");
        setLeadMsg(
          "We’ve sent you a WhatsApp message. Tap “Yes, I requested” in WhatsApp to receive your 2-page preview there."
        );
      }

      window.gtag?.("event", "lead_capture_submit", {
        event_category: "engagement",
        report_slug: reportSlug,
        channel,
        phase: channel === "email" ? "otp_sent" : "consent_sent",
      });
    } catch (e) {
      console.error(e);
      setLeadMsg("Something went wrong. Please try again.");
    } finally {
      setLeadBusy(false);
    }
  };

  // Step 2: verify OTP (EMAIL ONLY)
  const submitOtp = async () => {
    if (leadChannel === "whatsapp") {
      setLeadMsg(
        'For WhatsApp, no code is needed. Just tap “Yes, I requested” in WhatsApp.'
      );
      return;
    }

    if (!leadOtp.trim()) {
      setLeadMsg("Please enter the 6-digit code.");
      return;
    }
    if (!leadToken) {
      setLeadMsg("Session expired. Please start again.");
      setLeadStep("form");
      return;
    }

    setLeadBusy(true);
    setLeadMsg("");
    try {
      const resp = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RBR-Action": "verify-send",
        },
        body: JSON.stringify({
          token: leadToken,
          otp: leadOtp.trim(),
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Verification failed (${resp.status})`);
      }

      window.gtag?.("event", "lead_capture_submit", {
        event_category: "engagement",
        report_slug: reportSlug,
        channel: leadChannel || (leadPhone ? "whatsapp" : "email"),
        phase: "verified_and_sent",
      });

      setLeadMsg("✅ Verified! We’ve sent your 2-page preview.");
      setTimeout(() => setLeadOpen(false), 1500);
    } catch (e) {
      console.error(e);
      setLeadMsg("Incorrect or expired code. Please check and try again.");
    } finally {
      setLeadBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-slate-950 to-slate-900">
        {/* Sticky Header — sales-focused, transparent report metadata */}
        <header className="sticky top-0 z-30 bg-white text-slate-900 border-b border-slate-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-start gap-3">
              <Link to="/" className="shrink-0" aria-label="Rajan Business Reports home">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="RBR" className="h-8 w-8" />
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Rajan Business Reports
                </div>
                <h1 className="mt-0.5 text-[15px] font-bold leading-snug text-slate-950">
                  {title}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  {reportYear && (
                    <span className="font-medium text-slate-700">Report year: {reportYear}</span>
                  )}
                  <span>PDF report</span>
                  <span>Preview available</span>
                </div>
              </div>

              {isPurchased && (
                <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold border border-emerald-200">
                  Purchased
                </span>
              )}
            </div>

            {!isPurchased && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="shrink-0 leading-tight">
                  {HAS_DISCOUNT && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 line-through">
                        {currencySymbol}{MRP.toLocaleString("en-IN")}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        {EFFECTIVE_PROMO_PCT}% OFF
                      </span>
                    </div>
                  )}
                  <div className="mt-0.5 text-xl font-extrabold text-slate-950">
                    {currencySymbol}{FINAL.toLocaleString("en-IN")}
                  </div>
                </div>

                <button
                  onClick={goToPayment}
                  className="flex-1 rounded-xl bg-blue-700 text-white text-[13px] font-semibold px-4 py-2.5 active:scale-[0.98] shadow-sm"
                >
                  Buy Full Report — {currencySymbol}{FINAL.toLocaleString("en-IN")}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="relative flex-1 overflow-auto">
          {/* Loader */}
          {isLoading && (
            <div className="flex items-center justify-center h-[70vh]">
              <div className="text-center text-white/90">
                <svg
                  className="mx-auto animate-spin"
                  viewBox="0 0 100 100"
                  width="50"
                  height="50"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(148,163,184,0.5)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset="70"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium">Preparing your preview…</p>
                <p className="mt-1 text-[11px] text-slate-300">
                  Loading this report preview.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {!isLoading && error && (
            <div className="px-5 py-10 text-center text-white">
              <p className="text-sm text-amber-300 mb-3 font-semibold">
                {error}
              </p>
              <p className="text-xs text-slate-300 mb-5">
                You can go back and re-open the report, or try reloading this
                page.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-lg border border-slate-500 text-slate-100 text-sm bg-transparent active:scale-[0.98]"
                >
                  Go back
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold active:scale-[0.98]"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {!isLoading && !error && pdfUrl && (
            <div className="relative h-[calc(100vh-220px)] sm:h-[calc(100vh-205px)] bg-slate-900">
              <div className="h-full bg-white">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={pdfUrl}
                    defaultScale={SpecialZoomLevel.PageWidth}
                    onPageChange={(e) => {
                      // e.currentPage is 0-based index
                      setCurrentPage(e.currentPage);
                    }}
                  />
                </Worker>
              </div>

              {/* PREVIEW LOCK OVERLAY (blocks pages beyond free sample when not purchased) */}
              {shouldLock && (
                <>
                  {/* Interaction blocker */}
                  <div className="absolute inset-0 z-10 bg-transparent" />

                  {/* Blur / gradient */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-slate-950/95 backdrop-blur-[3px]" />
                  </div>

                  {/* Callout card with softer CTAs */}
                  <div className="absolute inset-x-0 bottom-4 z-30 px-4">
                    <div className="mx-auto max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-blue-500/40 shadow-[0_20px_45px_rgba(15,23,42,0.75)] px-4 py-4 text-white">
                      {/* Header + short pitch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-200 border border-blue-400/50">
                            You’ve reached the detailed section
                          </div>
                          <div className="text-sm font-semibold">
                            Unlock the full report to continue beyond the free
                            sample.
                          </div>
                        </div>
                        <div className="text-right text-[11px]">
                          {HAS_DISCOUNT && (
                            <div className="line-through text-slate-400">
                              {currencySymbol}{MRP.toLocaleString("en-IN")}
                            </div>
                          )}
                          <div className="text-base font-semibold text-amber-300 leading-tight">
                            {currencySymbol}{FINAL.toLocaleString("en-IN")}
                          </div>
                          {HAS_DISCOUNT && (
                            <div className="text-[10px] text-emerald-300">
                              {EFFECTIVE_PROMO_PCT}% off
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bullets */}
                      <ul className="mt-2 space-y-1.5 text-[11px] text-slate-200 list-disc list-inside">
                        <li>Complete report beyond the preview</li>
                        <li>All included analysis, tables and charts</li>
                        <li>Full PDF access in your RBR account</li>
                      </ul>

                      {/* CTA block */}
                      <div className="mt-3 space-y-2">
                        <button
                          onClick={goToPayment}
                          className="w-full rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 font-semibold active:scale-[0.98]"
                        >
                          Buy Full Report — {currencySymbol}{FINAL.toLocaleString("en-IN")}
                        </button>

                        <div className="text-center text-[10px] text-slate-300 uppercase tracking-[0.18em]">
                          or
                        </div>

                        <button
                          onClick={openLead}
                          className="w-full rounded-xl border border-slate-500 bg-slate-900/80 text-[13px] font-medium text-slate-50 py-2.5 active:scale-[0.98]"
                        >
                          Get a <span className="font-semibold">free 2-page preview</span>{" "}
                          first
                        </button>
                      </div>

                      {/* Trust note */}
                      <div className="mt-2 text-[10px] text-slate-300 text-center">
                        You can scroll back anytime to re-read the free sample
                        pages. Unlocking gives you the complete report.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Sticky Bottom Bar — one price, one action */}
        <div className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="px-4 py-3 flex items-center gap-3">
            {isPurchased ? (
              <div className="w-full text-center rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700 border border-emerald-200">
                Already purchased
              </div>
            ) : (
              <>
                <div className="shrink-0">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">Full report</div>
                  <div className="text-xl font-extrabold text-slate-950 leading-tight">
                    {currencySymbol}{FINAL.toLocaleString("en-IN")}
                  </div>
                </div>
                <button
                  onClick={goToPayment}
                  className="ml-auto flex-1 rounded-xl bg-blue-700 text-white text-sm px-4 py-3 font-semibold active:scale-[0.98] shadow-sm"
                >
                  Buy Full Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login / Payment Modal */}
      <Modal
        isOpen={openModel}
        toggle={() => setOpenModel(false)}
        style={{ maxWidth: "650px", width: "100%", marginTop: "15%" }}
        size="lg"
      >
        <ModalBody>
          <Login onClose={() => setOpenModel(false)} returnTo="/payment" />
          {status && (
            <div style={{ textAlign: "center" }}>
              <p className="success-head">The report has been successfully sent to</p>
              <p className="success-email">{email}</p>
              <button className="btn btn-primary" onClick={changeStatus}>
                Ok
              </button>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Lead Capture Modal (email OTP + WhatsApp consent) */}
      {leadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setLeadOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.85)] border border-slate-700 bg-slate-950 text-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold">Get a 2-page preview PDF</h3>
              <button
                onClick={() => setLeadOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-300">
              We’ll send a concise 2-page preview of this report to your email
              or WhatsApp after a quick verification.
            </p>

            {/* Step 1: capture contact */}
            {leadStep === "form" && (
              <>
                <div className="mt-3 space-y-2">
                  {/* Email input */}
                  <input
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                  />

                  {/* OR divider */}
                  <div className="flex items-center justify-center my-1">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="mx-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                      or
                    </span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>

                  {/* ROW: country code + phone, constrained to popup width */}
                  <div className="flex w-full gap-2">
                    {/* Country Code Dropdown */}
                    <select
                      value={leadCountryCode}
                      onChange={(e) => setLeadCountryCode(e.target.value)}
                      className="shrink-0 w-[80px] rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      {/* You can add more later */}
                    </select>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="WhatsApp number (optional)"
                      className="flex-1 min-w-0 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                    />
                  </div>

                  {/* Helper text: either is fine */}
                  <p className="text-[10px] text-slate-400">
                    You can fill either email or WhatsApp number. One is enough
                    to get your preview.
                  </p>
                </div>

                {leadMsg && (
                  <div className="mt-2 text-[11px] text-amber-200">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitLead}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-semibold"
                  >
                    {leadBusy ? "Sending…" : "Send preview"}
                  </button>
                  <button
                    onClick={goToPayment}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
                  >
                    Buy full report
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (email): OTP UI */}
            {leadStep === "otp" && leadChannel === "email" && (
              <>
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={leadOtp}
                    onChange={(e) => setLeadOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-center tracking-[0.3em] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/80"
                  />
                </div>
                {leadMsg && (
                  <div className="mt-2 text-[11px] text-amber-200">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={submitOtp}
                    disabled={leadBusy}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] disabled:opacity-60 font-semibold"
                  >
                    {leadBusy ? "Verifying…" : "Verify & send preview"}
                  </button>
                  <button
                    onClick={() => {
                      setLeadStep("form");
                      setLeadOtp("");
                      setLeadMsg("");
                      setLeadChannel("");
                      setLeadToken("");
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
                  >
                    Start again
                  </button>
                </div>
              </>
            )}

            {/* Step 2 (WhatsApp): Check WhatsApp screen */}
            {leadStep === "wa_wait" && leadChannel === "whatsapp" && (
              <>
                <div className="mt-4 space-y-2 text-sm text-slate-100">
                  <div className="text-lg font-semibold">📲 Check WhatsApp to confirm</div>
                  <p className="text-[11px] text-slate-300">
                    We’ve sent you a message on WhatsApp from{" "}
                    <strong>Rajan Business Ideas – Prod</strong>.
                  </p>
                  <ul className="mt-2 list-disc list-inside text-[11px] text-slate-200 space-y-1">
                    <li>Open WhatsApp on your phone.</li>
                    <li>
                      Find the message about “{title}”.
                    </li>
                    <li>
                      Tap <strong>“Yes, I requested”</strong>.
                    </li>
                    <li>You’ll immediately receive the 2-page preview.</li>
                  </ul>
                </div>
                {leadMsg && (
                  <div className="mt-3 text-[11px] text-amber-200">{leadMsg}</div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setLeadOpen(false)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-900 text-sm py-2.5 active:scale-[0.98] font-semibold"
                  >
                    Okay, I’ll check WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setLeadStep("form");
                      setLeadChannel("");
                      setLeadToken("");
                      setLeadMsg("");
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-100 bg-slate-900 active:scale-[0.98]"
                  >
                    Use email instead
                  </button>
                </div>
              </>
            )}

            <div className="mt-2 text-[10px] text-slate-400">
              🔒 We only use your contact to send the 2-page preview. No spam,
              no sharing with third parties.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsDisplayMobile;

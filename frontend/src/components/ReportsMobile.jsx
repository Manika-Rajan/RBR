// RBR/frontend/src/components/ReportsMobile.jsx
// Mobile landing — logs searches; navigates only if a known report's preview exists.
// If no exact match, calls /suggest (POST) and shows a classic “Did you mean…?” popup (ice-blue).
// If still nothing, offers an Instant vs Pre-Book choice (Razorpay prebook wired; instant placeholder).

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Store } from "../Store";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { getRegionConfig } from "../config/regionConfig";

const REGION = getRegionConfig();

const POPULAR_REPORTS = [
  "Restaurant Business in India",
  "Paper Industry in India",
  "FMCG Market Report",
  "IT Industry Analysis India",
];

const TRENDING_INDUSTRIES = [
  "EV Charging Business India",
  "Competitor Analysis Pharma",
];

const SUGGESTIONS = [
  "Import Export Data Provider India",
  "FMCG market report India",
  "IT services market size 2024",
  "Edtech growth forecast",
  "EV charging stations India",
  "D2C beauty market share",
  "Retail POS data India",
  "Consumer behavior FMCG",
  "Pharma competitor analysis",
];

// Router of known reports — navigate only if query clearly matches one of these.
const ROUTER = [
  { slug: "ev_charging", keywords: ["ev charging", "charging station"] },
  { slug: "fmcg", keywords: ["fmcg"] },
  { slug: "pharma", keywords: ["pharma", "pharmaceutical"] },
  // No plain "paper" (so "paper clip" doesn’t auto-resolve)
  { slug: "paper_industry", keywords: ["paper industry", "paper manufacturing"] },
];

// Endpoints
const SEARCH_LOG_URL =
  "https://ypoucxtxgh.execute-api.ap-south-1.amazonaws.com/default/search-log";
const PRESIGN_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL";
const SUGGEST_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/suggest";

// When no report exists, we can still log a “create this report” request
const REQUEST_REPORT_URL =
  "https://sicgpldzo8.execute-api.ap-south-1.amazonaws.com/report-request";

// ⭐ Pre-booking API base
const PREBOOK_API_BASE =
  process.env.REACT_APP_PREBOOK_API_BASE ||
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod";

// ⭐ Single Pre-booking API URL (same path for create + confirm)
const PREBOOK_API_URL = `${PREBOOK_API_BASE}/prebook/create-order`;
const PREBOOK_CONFIRM_URL = `${PREBOOK_API_BASE}/prebook/confirm`;

// ⭐ Instant Report APIs (customer flow)
// ✅ Env helper: supports both Vite (import.meta.env) and CRA/Webpack (process.env)
const getEnv = (key) => {
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key] != null) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== "undefined" && process?.env?.[key] != null) {
      return process.env[key];
    }
  } catch {}
  return "";
};

// Configure these in Amplify env vars.
// Recommended for Vite builds: VITE_INSTANT_CREATE_ORDER_URL / VITE_INSTANT_CONFIRM_GENERATE_URL / VITE_STATUS_API
// CRA fallback supported: REACT_APP_INSTANT_CREATE_ORDER_URL / REACT_APP_INSTANT_CONFIRM_GENERATE_URL / REACT_APP_INSTANT_STATUS_URL
const INSTANT_API_BASE =
  getEnv("VITE_INSTANT_API_BASE") || getEnv("REACT_APP_INSTANT_API_BASE") || "";

const INSTANT_CREATE_ORDER_URL =
  getEnv("VITE_INSTANT_CREATE_ORDER_URL") ||
  getEnv("REACT_APP_INSTANT_CREATE_ORDER_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/create-order` : "") ||
  // ✅ Safe prod default (from your test page)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/create-order";

const INSTANT_CONFIRM_GENERATE_URL =
  getEnv("VITE_INSTANT_CONFIRM_GENERATE_URL") ||
  getEnv("VITE_CONFIRM_API") ||
  getEnv("REACT_APP_INSTANT_CONFIRM_GENERATE_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/confirm` : "") ||
  // ✅ Safe prod default (from your test page)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/confirm";

const INSTANT_STATUS_URL =
  getEnv("VITE_INSTANT_STATUS_URL") ||
  getEnv("VITE_STATUS_API") ||
  getEnv("REACT_APP_INSTANT_STATUS_URL") ||
  (INSTANT_API_BASE ? `${INSTANT_API_BASE}/instant-report/status` : "") ||
  // ✅ Safe prod default (from employee lab env)
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/status";
const INSTANT_DEFAULT_QUESTIONS = [
  "What is the current market overview and market size, with recent trends?",
  "What are the key segments/sub-segments and how is demand distributed?",
  "What are the main growth drivers, constraints, risks, and challenges?",
  "Who are the key players and what is the competitive landscape?",
  "What is the 3–5 year outlook with opportunities and recommendations?",
];

// ✅ Google Ads conversion for PREBOOK
const PREBOOK_CONV_SEND_TO = "AW-824378442/X8klCKyRw9EbEMqIjIkD";
// ✅ Google Ads conversion for INSTANT
const INSTANT_CONV_SEND_TO = "AW-824378442/6TR6CLvQ1-kbEMqIjIkD";

// ✅ Search input max length
const MAX_QUERY_CHARS = 50;

// ✅ RBR funnel tracking
// - GA4 receives only low-risk funnel metadata (no name / phone / raw search query).
// - Optional RBR backend receives the exact funnel event + current report query,
//   but still never receives name / phone / email from this tracker.
const RBR_FUNNEL_TRACK_URL =
  getEnv("VITE_RBR_FUNNEL_TRACK_URL") ||
  getEnv("REACT_APP_RBR_FUNNEL_TRACK_URL") ||
  "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/google-ads-funnel-event";

// Upload one representative NEW pre-book output PDF to S3 and set its key here
// through Amplify env vars. The existing presign Lambda is reused.
const PREBOOK_SAMPLE_FILE_KEY =
  getEnv("VITE_PREBOOK_SAMPLE_FILE_KEY") ||
  getEnv("REACT_APP_PREBOOK_SAMPLE_FILE_KEY") ||
  "";

const FUNNEL_ATTR_KEYS = [
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

function getRbrAttribution() {
  if (typeof window === "undefined") return {};

  const storageKey = "rbr_funnel_attribution";

  try {
    const existing = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    const params = new URLSearchParams(window.location.search || "");
    const incoming = {};

    FUNNEL_ATTR_KEYS.forEach((key) => {
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

function hasSeenCustomPrebookSample() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("rbr_custom_prebook_sample_seen") === "1";
  } catch {
    return false;
  }
}

function markCustomPrebookSampleSeen() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("rbr_custom_prebook_sample_seen", "1");
  } catch {}
}

function sendGa4Event(eventName, params = {}) {
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.gtag === "function" &&
      eventName
    ) {
      window.gtag("event", eventName, params);
    }
  } catch (e) {
    console.warn("[RBR funnel] GA4 event failed:", eventName, e);
  }
}

function trackRbrFunnelEvent({
  eventName,
  query = "",
  extra = {},
  gaEventName = "",
  gaParams = {},
}) {
  if (!eventName) return;

  const attribution = getRbrAttribution();
  const sessionId = getRbrFunnelSessionId();
  const sampleSeen = hasSeenCustomPrebookSample();

  // GA4 layer: intentionally do NOT send the raw report query, phone, name,
  // email, gclid, or the high-cardinality internal session id.
  if (gaEventName) {
    sendGa4Event(gaEventName, {
      product_type: "custom_prebook_report",
      sample_seen: sampleSeen ? "yes" : "no",
      ...gaParams,
    });
  }

  // First-party RBR layer: exact funnel path for joining stages together.
  // This remains optional until the dedicated AWS endpoint is configured.
  if (!RBR_FUNNEL_TRACK_URL) return;

  const eventId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const body = {
    event_id: eventId,
    session_id: sessionId,
    event_name: eventName,
    event_ts: new Date().toISOString(),
    page_path:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "",
    report_query: String(query || "").trim().slice(0, MAX_QUERY_CHARS),
    product_type: "custom_prebook_report",
    displayed_price: Number(REGION.prebookPrice || 0),
    currency: REGION.currencyCode,
    sample_seen: sampleSeen,
    attribution,
    ...extra,
  };

  fetch(RBR_FUNNEL_TRACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch((e) => {
    console.warn("[RBR funnel] backend event failed:", eventName, e);
  });
}

// Fire Google Ads conversion safely (once per paymentId)
function fireGoogleAdsPrebookConversion({ paymentId, value }) {
  try {
    if (!paymentId) return;

    const guardKey = `ads_prebook_conv_fired_${paymentId}`;
    if (sessionStorage.getItem(guardKey)) {
      console.log("[Ads] Prebook conversion already fired for", paymentId);
      return;
    }

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion", {
        send_to: PREBOOK_CONV_SEND_TO,
        value: Number(value) || REGION.prebookPrice,
        currency: REGION.currencyCode,
        transaction_id: paymentId, // use Razorpay payment_id as transaction id
      });
      sessionStorage.setItem(guardKey, "1");
      console.log("[Ads] Prebook conversion fired:", { paymentId, value });
    } else {
      console.warn("[Ads] gtag not available; skip prebook conversion fire.");
    }
  } catch (e) {
    console.error("[Ads] Prebook conversion fire error:", e);
  }
}

// Fire Google Ads conversion safely (once per paymentId) — Instant
function fireGoogleAdsInstantConversion({ paymentId, value = REGION.instantPrice }) {
  try {
    // ✅ Prevent firing the same conversion multiple times per payment
    const key = `rbr_ads_conv_instant_${paymentId || "na"}`;
    if (paymentId && sessionStorage.getItem(key) === "1") return;

    const sendTo = "AW-824378442/6TR6CLvQ1-kbEMqIjIkD";
    const conversionValue = Number(value) || REGION.instantPrice;

    const attemptFire = () => {
      if (typeof window.gtag !== "function") return false;

      window.gtag("event", "conversion", {
        send_to: sendTo,
        value: conversionValue,
        currency: REGION.currencyCode,
        transaction_id: paymentId || undefined,
      });

      if (paymentId) sessionStorage.setItem(key, "1");
      return true;
    };

    // Try immediately
    if (attemptFire()) return;

    // Retry briefly in case the tag script is still loading
    const started = Date.now();
    const retry = () => {
      if (attemptFire()) return;
      if (Date.now() - started > 2000) {
        console.warn("[GoogleAds] gtag not ready; conversion not fired", {
          paymentId,
          sendTo,
        });
        return;
      }
      setTimeout(retry, 120);
    };
    retry();
  } catch (e) {
    console.warn("Google Ads conversion fire failed (instant)", e);
  }
}

// ⭐ Razorpay loader
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (document.getElementById(RAZORPAY_SCRIPT_ID)) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(
        new Error("Razorpay SDK failed to load. Please refresh and try again.")
      );
    document.body.appendChild(script);
  });

// Loader
const LoaderRing = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 animate-spin-slow">
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#e6e6e6"
      strokeWidth="8"
    />
    <circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#0263c7"
      strokeWidth="8"
      strokeLinecap="round"
      strokeDasharray="283"
      strokeDashoffset="75"
    />
    <style>{`.animate-spin-slow{animation:spin 1.4s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </svg>
);

// ✅ helper: bold known quoted parts in the generic-search hint
const renderGenericHint = (query) => (
  <span>
    Your search <strong>“{query}”</strong> is too generic and matches thousands
    of reports. Please try searching specific reports like{" "}
    <strong>“Paper industry”</strong> or <strong>“Restaurant industry”</strong>.
  </span>
);

const ReportsMobile = () => {
  const store = useContext(Store);
  const state = store?.state;
  const dispatch = store?.dispatch;
  const navigate = useNavigate();

  const [q, setQ] = useState("");


  // ⭐ Sample Reports modal
  const [samplesOpen, setSamplesOpen] = useState(false);

  // ⭐ Sample reports -> open preview in embedded PDF viewer
  const [samplePreviewMode, setSamplePreviewMode] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerTitle, setPdfViewerTitle] = useState("Sample Report Preview");

  // ✅ modal now supports rich JSX content
  const [openModal, setOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("📊 Rajan Business Reports");
  const [modalMsgNode, setModalMsgNode] = useState(null);

  const [searchLoading, setSearchLoading] = useState(false);

  // ⭐ new: loading for pre-booking/payment flow
  const [prebookLoading, setPrebookLoading] = useState(false);

  // ✅ Retry modal state + context (same details used for retry)
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryCtx, setRetryCtx] = useState(null);

  // Suggestion modal (classic)
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState([]);
  const [lastQuery, setLastQuery] = useState("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownRect, setDropdownRect] = useState({
    left: 0,
    top: 0,
    width: 0,
  });

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const modalBtnRef = useRef(null);

  // ⭐ Choose report modal state (Instant vs Pre-book)
  const [prebookPromptOpen, setPrebookPromptOpen] = useState(false);
  const [prebookQuery, setPrebookQuery] = useState("");
  const [prebookName, setPrebookName] = useState("");
  const [prebookPhone, setPrebookPhone] = useState("");
  const [prebookError, setPrebookError] = useState("");
  const [instantChooserError, setInstantChooserError] = useState("");
  const [prebookHasKnownUser, setPrebookHasKnownUser] = useState(false);

  // ✅ Mobile chooser is deliberately staged:
  // offer = one-glance decision screen; details = name/mobile only after a product is chosen.
  const [chooserStep, setChooserStep] = useState("offer"); // offer | details
  const [chooserIntent, setChooserIntent] = useState("prebook"); // prebook | instant

  // ======================
  // ✅ OTP Modal (for Instant) — reuse same OTP system as Login.jsx
  // ======================
  const SEND_OTP_API =
    getEnv("VITE_SEND_OTP_API") ||
    getEnv("REACT_APP_SEND_OTP_API") ||
    "https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp";

  const VERIFY_OTP_API =
    getEnv("VITE_VERIFY_OTP_API") ||
    getEnv("REACT_APP_VERIFY_OTP_API") ||
    "https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp";

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState(""); // 10-digit
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const pendingInstantRef = useRef(null);
  const pendingPrebookRef = useRef(null);
  const pendingChooserSnapshotRef = useRef(null);

  // ✅ Inline OTP step (instead of a second big popup)
  const [instantOtpStep, setInstantOtpStep] = useState(false);
  const OTP_LEN = 6; // change to 4 later if your OTP becomes 4-digit
  const otpBoxesRef = useRef([]);

  // ======================
  // ✅ Instant Report UI State (customer flow)
  // ======================
  const [instantQuestionsOpen, setInstantQuestionsOpen] = useState(false);
  const [instantTopic, setInstantTopic] = useState("");
  const [instantQuestions, setInstantQuestions] = useState(
    INSTANT_DEFAULT_QUESTIONS
  );
  const [instantError, setInstantError] = useState("");
  const [instantPayCtx, setInstantPayCtx] = useState(null);

  // Loading modal (employee-portal style)
  const [instantModalOpen, setInstantModalOpen] = useState(false);
  const [instantModalTitle, setInstantModalTitle] =
    useState("Generating report…");
  const [instantModalSub, setInstantModalSub] = useState("Initializing…");
  const [instantProgressPct, setInstantProgressPct] = useState(5);
  const [instantBusy, setInstantBusy] = useState(false);

  const instantMountedRef = useRef(true);
  const instantAbortRef = useRef({ aborted: false });

  useEffect(() => {
    instantMountedRef.current = true;
    return () => {
      instantMountedRef.current = false;
      instantAbortRef.current.aborted = true;
    };
  }, []);

  // ✅ Funnel stage 1: landing / page entry.
  // Guarded because React StrictMode can run effects twice in development.
  useEffect(() => {
    try {
      const key = "rbr_funnel_landing_fired";
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {}

    trackRbrFunnelEvent({
      eventName: "landing_view",
      gaEventName: "rbr_funnel_landing",
      gaParams: {
        page_type: "reports_mobile",
      },
    });
  }, []);

  // ✅ When OTP inline step opens, focus the first empty box
  useEffect(() => {
    if (!instantOtpStep) return;
    const t = setTimeout(() => {
      const current = String(otpValue || "").replace(/\D/g, "");
      const idx = Math.min(current.length, OTP_LEN - 1);
      const el = otpBoxesRef.current?.[idx];
      if (el && typeof el.focus === "function") el.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [instantOtpStep, otpValue, OTP_LEN]);

  const updateInstantQuestion = (i, val) => {
    setInstantQuestions((prev) => prev.map((q, idx) => (idx === i ? val : q)));
  };

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { res, data };
  }

  function buildErrorMessage(res, data, fallback) {
    return (
      data?.error ||
      data?.message ||
      data?.details ||
      (typeof data?.raw === "string" && data.raw.slice(0, 300)) ||
      fallback ||
      `HTTP ${res?.status || "error"}`
    );
  }

  // ✅ show error if query too long
  const showTooLongError = () => {
    setModalTitle("Search word too long");
    setModalMsgNode(
      <span>
        Your search is too long. Please keep it within{" "}
        <strong>{MAX_QUERY_CHARS}</strong> characters.
      </span>
    );
    setOpenModal(true);
  };

  const matches = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (v.length < 2) return [];
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(v)).slice(0, 6);
  }, [q]);

  const computeDropdownPos = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownRect({
      left: rect.left + window.scrollX,
      top: rect.bottom + window.scrollY,
      width: rect.width,
    });
  }, []);

  const resolveSlug = (query) => {
    const ql = query.toLowerCase();
    for (const entry of ROUTER) {
      if (entry.keywords.some((kw) => ql.includes(kw))) return entry.slug;
    }
    return null;
  };

  const fetchSuggestions = async (query) => {
    try {
      const resp = await fetch(SUGGEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, limit: 3 }),
      });
      if (!resp.ok) return { items: [], exact_match: false, hint: "" };
      const data = await resp.json();
      const body = typeof data.body === "string" ? JSON.parse(data.body) : data;
      const items = (body.items || []).slice(0, 3);
      const hint = body.hint || "";
      return { items, exact_match: !!body.exact_match, hint };
    } catch (e) {
      console.error("suggest error:", e);
      return { items: [], exact_match: false, hint: "" };
    }
  };

  const requestNewReport = async (query) => {
    if (!REQUEST_REPORT_URL) return;
    try {
      const payload = {
        search_query: query,
        user: {
          name: state?.userInfo?.name || "Unknown",
          email: state?.userInfo?.email || "",
          phone: state?.userInfo?.phone || "",
          userId: state?.userInfo?.userId || state?.userInfo?.phone || "",
        },
      };
      const resp = await fetch(REQUEST_REPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("requestNewReport failed:", resp.status, txt);
      }
    } catch (e) {
      console.error("requestNewReport error:", e);
    }
  };

  // ✅ open Razorpay with an existing order (used for both first attempt and retry)
  const openRazorpayForPrebook = async ({
    prebookId,
    razorpayOrderId,
    amount,
    currency,
    razorpayKeyId,
    trimmed,
    userName,
    userPhone,
  }) => {
    try {
      await loadRazorpay();
      if (!window.Razorpay) {
        setModalTitle("Payment error");
        setModalMsgNode(
          <span>
            ⚠️ Payment SDK did not load properly. Please refresh and try again.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Custom Report ${REGION.currencySymbol}${REGION.prebookPrice}: ${trimmed} | Access in My Profile`,
        order_id: razorpayOrderId,
        prefill: { name: userName || "RBR User", contact: userPhone },
        notes: {
          type: "prebook",
          prebookId,
          reportTitle: trimmed,
          searchQuery: trimmed,
          region: REGION.region,
          currency: REGION.currencyCode,
        },

        handler: async (response) => {
          // ✅ PRE-BOOK payment success:
          // confirm the paid pre-book immediately, then ask the same 5 research questions.
          // Do NOT divert this payment into the Instant report flow.
          const payId = response?.razorpay_payment_id;
          const sig = response?.razorpay_signature;

          if (!payId || !sig) {
            setModalTitle("Payment confirmation error");
            setModalMsgNode(
              <span>
                ⚠️ Payment was completed, but the payment confirmation details
                were incomplete. Please contact us with your payment reference.
              </span>
            );
            setOpenModal(true);
            return;
          }

          setPrebookLoading(true);

          try {
            const { res, data } = await fetchJson(PREBOOK_CONFIRM_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userPhone: (userPhone || "").replace(/\D/g, ""),
                prebookId,
                razorpayOrderId,
                razorpayPaymentId: payId,
                razorpaySignature: sig,
              }),
            });

            if (!res.ok || data?.ok === false) {
              throw new Error(
                buildErrorMessage(
                  res,
                  data,
                  "Payment was received, but the pre-booking could not be confirmed."
                )
              );
            }

            // ✅ Funnel stage 9: confirmed successful Pre-book payment.
            const confirmedPaidValue =
              Number(amount || 0) / 100 || Number(REGION.prebookPrice || 0);

            const isTestPayment =
              confirmedPaidValue < Number(REGION.prebookPrice || 0);

            trackRbrFunnelEvent({
              eventName: "payment_success",
              query: trimmed,
              extra: {
                prebook_id: prebookId,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: payId,
                paid_value: confirmedPaidValue,
                is_test_payment: isTestPayment,
              },
              gaEventName: isTestPayment ? "" : "purchase",
              gaParams: isTestPayment
                ? {}
                : {
                    transaction_id: payId,
                    currency: currency || REGION.currencyCode,
                    value: confirmedPaidValue,
                    items: [
                      {
                        item_id: "rbr_custom_prebook_report",
                        item_name: "RBR Custom Business Intelligence Report",
                        price: confirmedPaidValue,
                        quantity: 1,
                      },
                    ],
                  },
            });

            // ✅ Google Ads conversion: PRE-BOOK purchase
            // Skip the protected ₹1 test payment so test purchases do not
            // distort live Google Ads conversion data.
            const paidValue = Number(amount || 0) / 100 || REGION.prebookPrice;
            if (paidValue >= Number(REGION.prebookPrice || 0)) {
              fireGoogleAdsPrebookConversion({
                paymentId: payId,
                value: paidValue,
              });
            } else {
              console.log("[Ads] Prebook test payment detected; conversion skipped.", {
                paymentId: payId,
                paidValue,
              });
            }

            // Reuse the existing 5-question UI, but mark this context as PRE-BOOK.
            setInstantError("");
            setInstantTopic(trimmed);
            setInstantQuestions(INSTANT_DEFAULT_QUESTIONS);
            setInstantPayCtx({
              flowType: "prebook",
              prebookId,
              paidAmount: amount,
              userPhone: (userPhone || "").replace(/\D/g, ""),
              userName: (userName || "").trim() || "RBR User",
              query: trimmed,
              razorpayOrderId,
              razorpayPaymentId: payId,
              razorpaySignature: sig,
            });
            setInstantQuestionsOpen(true);
          } catch (e) {
            console.error("Pre-book confirm failed:", e);
            setModalTitle("Pre-book payment received");
            setModalMsgNode(
              <span>
                ⚠️ Your payment was received, but we could not complete the
                pre-booking confirmation automatically. Please contact us with
                your payment reference so we can verify it.
              </span>
            );
            setOpenModal(true);
          } finally {
            setPrebookLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            trackRbrFunnelEvent({
              eventName: "payment_cancelled",
              query: trimmed,
              extra: {
                prebook_id: prebookId,
                razorpay_order_id: razorpayOrderId,
              },
              gaEventName: "rbr_payment_cancelled",
              gaParams: {
                product_type: "custom_prebook_report",
              },
            });

            setPrebookLoading(false);
            setRetryCtx({
              prebookId,
              razorpayOrderId,
              amount,
              currency,
              razorpayKeyId,
              trimmed,
              userName,
              userPhone,
            });
            setRetryOpen(true);
          },
        },

        theme: { color: "#0263c7" },
      };

      const rzp = new window.Razorpay(options);

      // ✅ Funnel stage 8: Razorpay window opened for Pre-book.
      trackRbrFunnelEvent({
        eventName: "razorpay_opened",
        query: trimmed,
        extra: {
          prebook_id: prebookId,
          razorpay_order_id: razorpayOrderId,
          amount_minor: Number(amount || 0),
        },
        gaEventName: "rbr_razorpay_opened",
        gaParams: {
          currency: currency || REGION.currencyCode,
          value: Number(amount || 0) / 100 || Number(REGION.prebookPrice || 0),
        },
      });

      rzp.open();
    } catch (e) {
      console.error("openRazorpayForPrebook error:", e);
      setModalTitle("Payment error");
      setModalMsgNode(
        <span>
          ⚠️ Could not open payment right now. Please try again in a few minutes.
        </span>
      );
      setOpenModal(true);
    }
  };

  const retryPrebookPayment = async () => {
    if (!retryCtx) return;
    setRetryOpen(false);
    setPrebookLoading(true);
    try {
      await openRazorpayForPrebook(retryCtx);
    } finally {
      setPrebookLoading(false);
    }
  };

  const startPrebookFlow = async (query, userName, userPhoneRaw) => {
    const trimmed = query.trim();
    const userPhone = (userPhoneRaw || "").trim();

    if (!trimmed || !userPhone) {
      setModalTitle("Missing details");
      setModalMsgNode(
        <span>
          ⚠️ Missing details for pre-booking. Please enter a valid name and
          phone.
        </span>
      );
      setOpenModal(true);
      return;
    }

    if (!PREBOOK_API_URL) {
      console.error("PREBOOK_API_URL is not configured");
      setModalTitle("Pre-booking unavailable");
      setModalMsgNode(
        <span>
          ⚠️ Pre-booking is temporarily unavailable. Please try again in a few
          minutes.
        </span>
      );
      setOpenModal(true);
      return;
    }

    setPrebookLoading(true);
    try {
      const resp = await fetch(PREBOOK_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone,
          userName: userName || "RBR User",
          reportTitle: trimmed,
          searchQuery: trimmed,
          notes: "",
          amount: REGION.prebookPrice,
          currency: REGION.currencyCode,
          region: REGION.region,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("prebook create-order failed", resp.status, text);
        setPrebookLoading(false);
        setModalTitle("Pre-booking error");
        setModalMsgNode(
          <span>
            ⚠️ Could not start the pre-booking right now. Please try again in a
            few minutes.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const data = await resp.json();
      const { prebookId, razorpayOrderId, amount, currency, razorpayKeyId } =
        data || {};

      if (!prebookId || !razorpayOrderId || !razorpayKeyId) {
        console.error("Invalid prebook response:", data);
        setPrebookLoading(false);
        setModalTitle("Pre-booking error");
        setModalMsgNode(
          <span>
            ⚠️ Something went wrong while preparing the payment. Please try
            again.
          </span>
        );
        setOpenModal(true);
        return;
      }

      // ✅ Checkout has now been prepared successfully.
      trackRbrFunnelEvent({
        eventName: "checkout_started",
        query: trimmed,
        extra: {
          prebook_id: prebookId,
          razorpay_order_id: razorpayOrderId,
          amount_minor: Number(amount || 0),
        },
        gaEventName: "begin_checkout",
        gaParams: {
          currency: currency || REGION.currencyCode,
          value: Number(amount || 0) / 100 || Number(REGION.prebookPrice || 0),
          items: [
            {
              item_id: "rbr_custom_prebook_report",
              item_name: "RBR Custom Business Intelligence Report",
              price:
                Number(amount || 0) / 100 || Number(REGION.prebookPrice || 0),
              quantity: 1,
            },
          ],
        },
      });

      setRetryCtx({
        prebookId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
        trimmed,
        userName: userName || "RBR User",
        userPhone,
      });

      setPrebookLoading(false);
      await openRazorpayForPrebook({
        prebookId,
        razorpayOrderId,
        amount,
        currency,
        razorpayKeyId,
        trimmed,
        userName: userName || "RBR User",
        userPhone,
      });
    } catch (e) {
      console.error("startPrebookFlow error:", e);
      setPrebookLoading(false);
      setModalTitle("Pre-booking error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while starting the pre-booking. Please try
          again later.
        </span>
      );
      setOpenModal(true);
    }
  };

  // ✅ Open the “Choose report type” modal
  const triggerPrebook = async (query) => {
    const trimmed = query.trim();
    const savedPhone = state?.userInfo?.phone || state?.userInfo?.userId || "";
    const savedName = state?.userInfo?.name || "";

    setPrebookQuery(trimmed);
    setPrebookName(savedName);
    setPrebookPhone(savedPhone);
    setPrebookHasKnownUser(!!savedPhone);
    setPrebookError("");
    setInstantChooserError("");
    setChooserStep("offer");
    setChooserIntent("prebook");

    // ✅ Funnel stage 3: premium/custom offer was actually shown.
    trackRbrFunnelEvent({
      eventName: "prebook_offer_shown",
      query: trimmed,
      gaEventName: "view_item",
      gaParams: {
        currency: REGION.currencyCode,
        value: Number(REGION.prebookPrice || 0),
        items: [
          {
            item_id: "rbr_custom_prebook_report",
            item_name: "RBR Custom Business Intelligence Report",
            price: Number(REGION.prebookPrice || 0),
            quantity: 1,
          },
        ],
      },
    });

    setPrebookPromptOpen(true);
  };

  // ✅ Instant report — Payment first, then ask 5 questions, then generate with loading modal
  // ✅ FORCE name/phone confirmation for NEW users: if no saved phone -> fields are shown in the chooser modal.
  const sendOtpForInstant = async (phone10) => {
    const digits = String(phone10 || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return false;
    }

    setOtpError("");
    setOtpSending(true);
    try {
      const phoneE164 = `+91${digits}`;

      // mirror Login.jsx payload
      const resp = await fetch(SEND_OTP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneE164 }),
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        throw new Error(data?.message || "Could not send OTP. Please try again.");
      }

      // Optional: keep Store phone in sync (same as Login.jsx)
      try {
        dispatch?.({ type: "SET_PHONE", payload: phoneE164 });
      } catch {}

      setOtpSent(true);
      return true;
    } catch (e) {
      setOtpError(e?.message || "Could not send OTP. Please try again.");
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtpForInstant = async () => {
    const digits = String(otpPhone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    const code = String(otpValue || "").trim();
    if (!code) {
      setOtpError("Please enter the OTP.");
      return false;
    }

    setOtpError("");
    setOtpVerifying(true);
    try {
      const phoneE164 = `+91${digits}`;

      // mirror Login.jsx payload
      const resp = await fetch(VERIFY_OTP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneE164, otp: code }),
      });

      const raw = await resp.text();
      let parsed = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = {};
      }

      // Some lambdas return { body: "{...}" }
      let body = parsed;
      if (typeof parsed?.body === "string") {
        try {
          body = JSON.parse(parsed.body);
        } catch {
          body = {};
        }
      }

      if (!resp.ok) {
        throw new Error(
          body?.message || parsed?.message || "Invalid OTP. Please try again."
        );
      }

      const token = body?.token || parsed?.token || "";

      // Match the normal Login.jsx flow: after OTP verification, restore the
      // existing UserProfiles identity before continuing to payment.
      let userProfile = {};

      try {
        const profileRes = await fetch(
          "https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              action: "get",
              phone_number: phoneE164,
            }),
          }
        );

        // Existing users should resolve here. For a genuinely new phone number,
        // keep an empty profile and let the purchase/profile flow create its
        // first record later instead of inventing a second identity.
        if (profileRes.ok) {
          const profileData = await profileRes.json().catch(() => ({}));
          userProfile = profileData;

          if (typeof profileData?.body === "string") {
            try {
              userProfile = JSON.parse(profileData.body);
            } catch {
              userProfile = {};
            }
          }
        } else if (profileRes.status !== 404) {
          throw new Error("Could not load your existing profile after OTP verification.");
        }
      } catch (profileErr) {
        console.error("Profile fetch after OTP failed:", profileErr);
        setOtpError(
          "OTP was verified, but we could not load your profile. Please try again."
        );
        return false;
      }

      const enrichedUser = {
        isLogin: true,
        userId: phoneE164,
        phone: phoneE164,
        token,
        name:
          userProfile?.name ||
          state?.userInfo?.name ||
          (prebookName || "").trim() ||
          "RBR User",
        email: userProfile?.email || state?.userInfo?.email || "",
        photo_url:
          userProfile?.photo_url ||
          state?.userInfo?.photo_url ||
          null,
        role: userProfile?.role || state?.userInfo?.role || "user",
      };

      try {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userInfo", JSON.stringify(enrichedUser));
      } catch {}

      try {
        dispatch?.({ type: "USER_LOGIN", payload: enrichedUser });
      } catch {}

      return enrichedUser;
    } catch (e) {
      setOtpError(e?.message || "Invalid OTP. Please try again.");
      return false;
    } finally {
      setOtpVerifying(false);
    }
  };

  // ======================
  // ✅ OTP boxes helpers (inline)
  // ======================
  const otpDigits = useMemo(() => {
    const raw = String(otpValue || "");
    const onlyNums = raw.replace(/\D/g, "");
    const padded = (onlyNums + "".padEnd(OTP_LEN, " ")).slice(0, OTP_LEN);
    return padded.split("").map((c) => (c === " " ? "" : c));
  }, [otpValue, OTP_LEN]);

  const setOtpAt = (idx, digit) => {
    const d = String(digit || "").replace(/\D/g, "").slice(0, 1);
    const arr = [...otpDigits];
    arr[idx] = d;
    setOtpValue(arr.join(""));
  };

  const focusOtp = (idx) => {
    const el = otpBoxesRef.current?.[idx];
    if (el && typeof el.focus === "function") el.focus();
  };

  const onOtpChange = (idx, e) => {
    const val = e.target.value;
    const digits = String(val || "").replace(/\D/g, "");
    if (!digits) {
      setOtpAt(idx, "");
      return;
    }

    // If user pasted multiple digits into one box
    if (digits.length > 1) {
      const take = digits.slice(0, OTP_LEN - idx).split("");
      const arr = [...otpDigits];
      take.forEach((ch, k) => {
        arr[idx + k] = ch;
      });
      setOtpValue(arr.join(""));
      const next = Math.min(idx + take.length, OTP_LEN - 1);
      focusOtp(next);
      return;
    }

    setOtpAt(idx, digits);
    if (idx < OTP_LEN - 1) focusOtp(idx + 1);
  };

  const onOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        setOtpAt(idx, "");
      } else if (idx > 0) {
        focusOtp(idx - 1);
        setOtpAt(idx - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) focusOtp(idx - 1);
    if (e.key === "ArrowRight" && idx < OTP_LEN - 1) focusOtp(idx + 1);
  };

  const onOtpPaste = (e) => {
    try {
      const txt = e.clipboardData?.getData("text") || "";
      const digits = txt.replace(/\D/g, "").slice(0, OTP_LEN);
      if (!digits) return;
      e.preventDefault();
      const arr = Array.from({ length: OTP_LEN }, (_, i) => digits[i] || "");
      setOtpValue(arr.join(""));
      const lastFilled = Math.min(digits.length - 1, OTP_LEN - 1);
      focusOtp(Math.max(0, lastFilled));
    } catch {}
  };

  const startInstantPayment = async ({ query, userName, phoneDigits }) => {
    const trimmed = (query || "").trim();
    const nm = (userName || "RBR User").trim() || "RBR User";

    // Ensure Instant endpoints exist
    if (
      !INSTANT_CREATE_ORDER_URL ||
      !INSTANT_CONFIRM_GENERATE_URL ||
      !INSTANT_STATUS_URL
    ) {
      setModalTitle("Instant setup incomplete");
      setModalMsgNode(
        <span>⚠️ Instant report setup is incomplete. Please try again later.</span>
      );
      setOpenModal(true);
      return;
    }

    try {
      setPrebookLoading(true);

      // 1) Create Razorpay order for Instant
      const { res, data } = await fetchJson(INSTANT_CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone: phoneDigits,
          userName: nm,
          query: trimmed,
          amount: REGION.instantPrice,
          currency: REGION.currencyCode,
          region: REGION.region,
          type: "instant",
        }),
      });

      if (!res.ok || data?.ok === false) {
        throw new Error(
          buildErrorMessage(res, data, "Could not start Instant payment")
        );
      }

      // Accept multiple response shapes
      const razorpayOrderId =
        data?.razorpayOrderId ||
        data?.razorpay_order_id ||
        data?.orderId ||
        data?.order_id;
      const razorpayKeyId =
        data?.razorpayKeyId ||
        data?.razorpay_key_id ||
        data?.keyId ||
        data?.key_id;
      const amount = data?.amount || Math.round(Number(REGION.instantPrice) * 100); // paise/cents/pence usually
      const currency = data?.currency || REGION.currencyCode;

      if (!razorpayOrderId || !razorpayKeyId) {
        console.error("Instant create-order response:", data);
        throw new Error(
          "Instant payment could not be prepared. Missing Razorpay order/key."
        );
      }

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment SDK did not load");

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: "Rajan Business Reports",
        description: `Instant ${REGION.currencySymbol}${REGION.instantPrice}: ${trimmed}`,
        order_id: razorpayOrderId,
        prefill: { name: nm, contact: phoneDigits },
        notes: {
          type: "instant",
          reportTitle: trimmed,
          searchQuery: trimmed,
          userPhone: phoneDigits,
          region: REGION.region,
          currency: REGION.currencyCode,
        },
        handler: async (response) => {
          // Payment success → now ask 5 questions
          const payId = response?.razorpay_payment_id;
          const sig = response?.razorpay_signature;

          // ✅ Google Ads conversion: Instant purchase
          fireGoogleAdsInstantConversion({
            paymentId: payId,
            value: REGION.instantPrice,
          });

          setInstantError("");
          setInstantTopic(trimmed);
          setInstantQuestions(INSTANT_DEFAULT_QUESTIONS);
          setInstantPayCtx({
            flowType: "instant",
            userPhone: phoneDigits,
            userName: nm,
            query: trimmed,
            razorpayOrderId,
            razorpayPaymentId: payId,
            razorpaySignature: sig,
          });
          setInstantQuestionsOpen(true);
        },
        modal: {
          ondismiss: () => {
            setPrebookLoading(false);
            setModalTitle("Payment cancelled");
            setModalMsgNode(
              <span>
                Your payment was cancelled. You can try again, or choose{" "}
                <strong>Custom Report</strong> instead.
              </span>
            );
            setOpenModal(true);
          },
        },
        theme: { color: "#0263c7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Instant trigger error:", e);
      setModalTitle("Payment error");
      setModalMsgNode(
        <span>
          ⚠️ Could not start Instant payment. Please try again in a few minutes.
        </span>
      );
      setOpenModal(true);
    } finally {
      setPrebookLoading(false);
    }
  };

  const triggerInstant = async (query) => {
    const trimmed = (query || "").trim();

    // If popup isn't open yet (rare path) ensure it opens with query filled
    if (!prebookPromptOpen) {
      const savedPhone = state?.userInfo?.phone || state?.userInfo?.userId || "";
      const savedName = state?.userInfo?.name || "";
      setPrebookQuery(trimmed);
      setPrebookName(savedName);
      setPrebookPhone(savedPhone);
      setPrebookHasKnownUser(!!savedPhone);
      setPrebookError("");
      setInstantChooserError("");
      setPrebookPromptOpen(true);
      return;
    }

    // Validate name/phone for BOTH known + new (known users may still have bad saved phone)
    let nm = (prebookName || "").trim();
    const phoneDigits = (prebookPhone || "").replace(/\D/g, "");

    if (!nm) nm = "RBR User";
    if (phoneDigits.length < 10) {
      setInstantChooserError(
        prebookHasKnownUser
          ? "Your saved phone number seems invalid. Please update your profile or contact us."
          : "Please enter a valid phone number (at least 10 digits)."
      );
      setPrebookError("");
      return;
    }

    if (!prebookHasKnownUser && !(prebookName || "").trim()) {
      setInstantChooserError("Please enter your name to continue.");
      setPrebookError("");
      return;
    }

    setPrebookError("");
    setInstantChooserError("");

    // If already logged in, go straight to payment.
    const alreadyLoggedIn = !!state?.userInfo?.isLogin;
    if (alreadyLoggedIn) {
      setPrebookPromptOpen(false);
      await startInstantPayment({ query: trimmed, userName: nm, phoneDigits });
      return;
    }

    // Otherwise: OTP before payment (Option A)
    pendingPrebookRef.current = null;
    pendingInstantRef.current = { query: trimmed, userName: nm, phoneDigits };
    pendingChooserSnapshotRef.current = {
      prebookQuery: trimmed,
      prebookName: nm,
      prebookPhone: phoneDigits,
      prebookHasKnownUser,
    };

    // ✅ NEW UX: keep the chooser modal open and show OTP inline (no second popup)
    setOtpPhone(phoneDigits.slice(-10));
    setOtpValue("");
    setOtpError("");
    setOtpSent(false);
    setInstantOtpStep(true);

    // Auto-send OTP on step open
    setTimeout(() => {
      sendOtpForInstant(phoneDigits);
    }, 0);
  };

  const cancelInstantOtp = () => {
    // Return to chooser inputs inside the same modal
    setInstantOtpStep(false);
    setOtpError("");
    setOtpValue("");
    setOtpSent(false);

    // Re-open chooser so the user can edit name/phone or pick Pre-book
    const snap = pendingChooserSnapshotRef.current;
    if (snap) {
      setPrebookQuery(snap.prebookQuery || "");
      setPrebookName(snap.prebookName || "");
      setPrebookPhone(snap.prebookPhone || "");
      setPrebookHasKnownUser(!!snap.prebookHasKnownUser);
    }
    setPrebookError("");
    setInstantChooserError("");
    if (pendingPrebookRef.current) setChooserIntent("prebook");
    else if (pendingInstantRef.current) setChooserIntent("instant");
    setChooserStep("details");
    setPrebookPromptOpen(true);
  };

  const verifyOtpAndProceedInstant = async () => {
    const verifiedUser = await verifyOtpForInstant();
    if (!verifiedUser) return;

    setInstantOtpStep(false);
    setPrebookPromptOpen(false);

    const pendingPrebook = pendingPrebookRef.current;
    const pendingInstant = pendingInstantRef.current;
    pendingPrebookRef.current = null;
    pendingInstantRef.current = null;

    if (pendingPrebook) {
      // ✅ Funnel stage 7: Pre-book OTP/login verified.
      trackRbrFunnelEvent({
        eventName: "otp_verified",
        query: pendingPrebook.query,
        gaEventName: "login",
        gaParams: {
          method: "phone_otp",
        },
      });

      trackRbrFunnelEvent({
        eventName: "identity_ready",
        query: pendingPrebook.query,
        extra: {
          login_mode: "phone_otp",
        },
      });

      // After OTP verification, use the canonical verified phone identity
      // (+91xxxxxxxxxx -> 91xxxxxxxxxx) for Pre-book. This keeps the
      // purchase tied to the existing UserProfiles identity and also lets
      // the protected test-price check recognise the configured test user.
      const verifiedPhoneDigits = String(
        verifiedUser?.phone ||
          verifiedUser?.userId ||
          pendingPrebook.phoneDigits ||
          ""
      ).replace(/\D/g, "");

      await startPrebookFlow(
        pendingPrebook.query,
        verifiedUser?.name || pendingPrebook.userName,
        verifiedPhoneDigits || pendingPrebook.phoneDigits
      );
      return;
    }

    if (pendingInstant) {
      await startInstantPayment({
        ...pendingInstant,
        userName: verifiedUser?.name || pendingInstant.userName,
      });
      return;
    }

    setModalTitle("Something went wrong");
    setModalMsgNode(
      <span>⚠️ We couldn’t continue the payment flow. Please try again.</span>
    );
    setOpenModal(true);
  };

  const goToReportBySlug = async (reportOrSlug) => {
    const reportMeta =
      typeof reportOrSlug === "string"
        ? { slug: reportOrSlug }
        : reportOrSlug || {};

    const reportSlug =
      reportMeta.slug || resolveSlug(reportMeta.title || "");

    if (!reportSlug) return;

    setSearchLoading(true);

    try {
      // Use the permanent catalogue report ID when one is available.
      // Older catalogue reports continue using the existing fallback ID.
      const reportId =
        reportMeta.report_id ||
        reportMeta.reportId ||
        `RBR1${Math.floor(Math.random() * 900 + 100)}`;

      const previewKey =
        reportMeta.preview_key ||
        reportMeta.previewKey ||
        `${reportSlug}_preview.pdf`;

      const fullKey =
        reportMeta.full_key ||
        reportMeta.fullKey ||
        `${reportSlug}.pdf`;

      const reportTitle =
        reportMeta.title ||
        reportSlug
          .replace(/_/g, " ")
          .replace(/\b\w/g, (character) => character.toUpperCase());

      const cataloguePrice = Number(reportMeta.price);
      const catalogueMrp = Number(reportMeta.mrp);
      const cataloguePromoPct = Number(reportMeta.promo_pct);

      // Reports with catalogue pricing use it. Older reports fall back
      // to the standard final-report pricing in regionConfig.js.
      const price =
        Number.isFinite(cataloguePrice) && cataloguePrice > 0
          ? cataloguePrice
          : REGION.finalReportPrice;

      const mrp =
        Number.isFinite(catalogueMrp) && catalogueMrp > 0
          ? catalogueMrp
          : REGION.finalReportMrp;

      const promoPct =
        Number.isFinite(cataloguePromoPct) && cataloguePromoPct >= 0
          ? cataloguePromoPct
          : REGION.promoPct;

      const currency = reportMeta.currency || REGION.currencyCode;
      const reportType =
        reportMeta.report_type || reportMeta.reportType || "catalogue";

      const presignResp = await fetch(PRESIGN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_key: previewKey }),
      });

      if (!presignResp.ok) {
        setModalTitle("Preview not ready");
        setModalMsgNode(
          <span>
            📢 This report preview isn’t ready yet. Our team is adding it
            shortly.
          </span>
        );
        setOpenModal(true);
        return;
      }

      const presignData = await presignResp.json();
      const url = presignData?.presigned_url;

      if (!url) {
        setModalTitle("Preview not ready");
        setModalMsgNode(
          <span>
            📢 This report preview isn’t ready yet. Please check back soon.
          </span>
        );
        setOpenModal(true);
        return;
      }

      try {
        const probe = await fetch(url, {
          method: "GET",
          headers: { Range: "bytes=0-1" },
        });
        const contentType = (
          probe.headers.get("content-type") || ""
        ).toLowerCase();

        if (
          !probe.ok ||
          !(probe.status === 200 || probe.status === 206) ||
          !contentType.includes("pdf")
        ) {
          setModalTitle("Preview not ready");
          setModalMsgNode(
            <span>
              📢 This report preview isn’t ready yet. Please check back soon.
            </span>
          );
          setOpenModal(true);
          return;
        }
      } catch {
        // Keep the existing behaviour: if the lightweight probe is blocked
        // by CORS, allow the report display page to try loading the PDF.
      }

      if (samplePreviewMode) {
        setPdfViewerTitle("Sample Report Preview");
        setPdfViewerUrl(url);
        setPdfViewerOpen(true);
        setSamplePreviewMode(false);
        return;
      }

      navigate("/report-display", {
        state: {
          reportSlug,
          reportId,
          reportTitle,
          price,
          mrp,
          promoPct,
          currency,
          previewKey,
          fullKey,
          reportType,
        },
      });
    } catch (error) {
      console.error("goToReportBySlug error:", error);
      setModalTitle("Error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while opening the report. Please try again.
        </span>
      );
      setOpenModal(true);
    } finally {
      setSearchLoading(false);
      setSamplePreviewMode(false);
    }
  };

  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // ✅ hard stop if query exceeds max chars
    if (trimmed.length > MAX_QUERY_CHARS) {
      showTooLongError();
      return;
    }

    setLastQuery(trimmed);
    setSearchLoading(true);
    setModalMsgNode(null);
    setSuggestOpen(false);

    try {
      // ✅ Funnel stage 2: website report search.
      // The raw query stays in RBR's own logs/tracker; it is not sent to GA4.
      trackRbrFunnelEvent({
        eventName: "report_search",
        query: trimmed,
        gaEventName: "report_search",
        gaParams: {
          event_category: "engagement",
          event_label: "mobile_reports_search",
          value: 1,
        },
      });

      const payload = {
        search_query: trimmed,
        user: {
          name: state?.userInfo?.name || "Unknown",
          email: state?.userInfo?.email || "",
          phone: state?.userInfo?.phone || "",
          userId: state?.userInfo?.userId || state?.userInfo?.phone || "",
        },
      };

      const logResp = await fetch(SEARCH_LOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!logResp.ok) {
        const t = await logResp.text();
        throw new Error(`Failed search-log ${logResp.status}, body: ${t}`);
      }
      await logResp.json();

      const { items, hint } = await fetchSuggestions(trimmed);

      if (items && items.length > 0) {
        const mapped = items
          .map((it) => ({
            title: it.title || it.slug,
            slug: it.slug,
            report_id: it.report_id || null,
            preview_key: it.preview_key || null,
            full_key: it.full_key || null,
            has_preview: it.has_preview !== false,
            has_full: it.has_full === true,
            price: it.price ?? null,
            mrp: it.mrp ?? null,
            promo_pct: it.promo_pct ?? null,
            currency: it.currency || null,
            report_type: it.report_type || null,
            pin_to_top: it.pin_to_top === true,
            suggestion_priority: Number(it.suggestion_priority || 0),
          }))
          // Frontend safety ordering. The Lambda already sorts this way,
          // but this keeps pinned reports first if its response order changes.
          .sort((a, b) => {
            const pinnedDifference =
              Number(b.pin_to_top) - Number(a.pin_to_top);

            if (pinnedDifference !== 0) return pinnedDifference;

            return b.suggestion_priority - a.suggestion_priority;
          });

        setSuggestItems(mapped.slice(0, 3));
        setSuggestOpen(true);
        return;
      }

      // ✅ if lambda returns hint for generic searches, show message
      if (hint) {
        setModalTitle("Search too generic");
        setModalMsgNode(renderGenericHint(trimmed));
        setOpenModal(true);
        return;
      }

      // fallback to hard router
      const reportSlug = resolveSlug(trimmed);
      if (reportSlug) {
        await goToReportBySlug(reportSlug);
        return;
      }

      await requestNewReport(trimmed);
      await triggerPrebook(trimmed);
      return;
    } catch (e) {
      console.error("Error during search flow:", e);
      setModalTitle("Error");
      setModalMsgNode(
        <span>
          ⚠️ Something went wrong while processing your request. Please try
          again later.
        </span>
      );
      setOpenModal(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (searchLoading) return;

    const query = q.trim();
    if (!query) return;

    // ✅ hard stop if query exceeds max chars
    if (query.length > MAX_QUERY_CHARS) {
      setShowSuggestions(false);
      showTooLongError();
      return;
    }

    setShowSuggestions(false);
    handleSearch(query);
  };

  const closeModal = () => {
    setOpenModal(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFocus = () => {
    computeDropdownPos();
    setShowSuggestions(true);
  };

  useEffect(() => {
    const handleClick = (e) => {
      const insideDropdown = dropdownRef.current?.contains(e.target);
      const insideInput = inputRef.current?.contains(e.target);
      if (!insideDropdown && !insideInput) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  useEffect(() => {
    const onResize = () => computeDropdownPos();
    const onScroll = () => setShowSuggestions(false);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [computeDropdownPos]);

  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        if (suggestOpen) setSuggestOpen(false);
        if (openModal) setOpenModal(false);
        if (prebookPromptOpen) setPrebookPromptOpen(false);
        if (retryOpen) setRetryOpen(false);
        if (otpOpen) setOtpOpen(false);
        if (instantQuestionsOpen) setInstantQuestionsOpen(false);
      }
    };
    if (
      openModal ||
      suggestOpen ||
      prebookPromptOpen ||
      retryOpen ||
      otpOpen ||
      instantQuestionsOpen
    ) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [openModal, suggestOpen, prebookPromptOpen, retryOpen, otpOpen, instantQuestionsOpen]);

  // ✅ Safety: if chooser modal closes, also exit OTP inline step
  useEffect(() => {
    if (prebookPromptOpen) return;
    if (instantOtpStep) setInstantOtpStep(false);
    // keep otpPhone (it can help future tries), but clear code/error
    setOtpError("");
    setOtpValue("");
    setOtpSent(false);
    setChooserStep("offer");
    setChooserIntent("prebook");
  }, [prebookPromptOpen]);

  async function pollInstantUntilDone({ userPhone, instantId }) {
    const MAX_WAIT_MS = 120000; // 2 minutes
    const POLL_EVERY_MS = 2500; // 2.5s

    const startedAt = Date.now();
    instantAbortRef.current.aborted = false;

    if (!instantMountedRef.current) return null;

    setInstantModalOpen(true);
    setInstantModalTitle("Generating report…");
    setInstantModalSub("Queued. Starting worker…");
    setInstantProgressPct(8);

    // Smooth progress animation up to 92%
    const timer = setInterval(() => {
      if (!instantMountedRef.current) return;
      setInstantProgressPct((p) => {
        if (p >= 92) return p;
        return Math.min(92, p + 1);
      });
    }, 900);

    try {
      while (Date.now() - startedAt < MAX_WAIT_MS) {
        if (!instantMountedRef.current) throw new Error("Page closed");
        if (instantAbortRef.current.aborted) throw new Error("Polling aborted");

        const url = new URL(INSTANT_STATUS_URL);
        url.searchParams.set("userPhone", userPhone);
        url.searchParams.set("instantId", instantId);

        const { res, data } = await fetchJson(url.toString(), {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok || data?.ok === false) {
          throw new Error(buildErrorMessage(res, data, "Status check failed"));
        }

        const status = String(data?.status || "").toLowerCase();

        if (status === "done") {
          setInstantModalSub("Finalizing…");
          setInstantProgressPct(95);
          return data;
        }

        if (status === "failed") {
          throw new Error(
            data?.error || data?.details || "Report generation failed"
          );
        }

        setInstantModalSub(
          status === "running"
            ? "Generating content and charts…"
            : "Queued… waiting for worker"
        );

        await new Promise((r) => setTimeout(r, POLL_EVERY_MS));
      }

      throw new Error(
        `Still running after ${Math.round(
          MAX_WAIT_MS / 1000
        )}s. Please wait and check in My Profile.`
      );
    } finally {
      clearInterval(timer);
    }
  }

  async function savePrebookQuestionsNow(ctx, questions) {
    setInstantError("");
    setInstantBusy(true);

    try {
      const { res, data } = await fetchJson(PREBOOK_CONFIRM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhone: ctx.userPhone,
          prebookId: ctx.prebookId,
          razorpayOrderId: ctx.razorpayOrderId,
          razorpayPaymentId: ctx.razorpayPaymentId,
          razorpaySignature: ctx.razorpaySignature,
          questions,
          saveQuestions: true,
        }),
      });

      if (!res.ok || data?.ok === false || data?.questionsSaved !== true) {
        throw new Error(
          buildErrorMessage(
            res,
            data,
            "Could not save your pre-book research questions"
          )
        );
      }

      trackRbrFunnelEvent({
        eventName: "research_questions_saved",
        query: ctx?.query || "",
        extra: {
          prebook_id: ctx?.prebookId || "",
          question_count: Array.isArray(questions) ? questions.length : 0,
        },
        gaEventName: "rbr_prebook_questions_saved",
        gaParams: {
          question_count: Array.isArray(questions) ? questions.length : 0,
        },
      });

      setInstantQuestionsOpen(false);
      setInstantPayCtx(null);

      setModalTitle("Custom report order confirmed ✅");
      setModalMsgNode(
        <span>
          Your custom report order is confirmed and your 5 research questions have been
          saved. We’ll use them while preparing your detailed report and keep
          you updated on WhatsApp.
        </span>
      );
      setOpenModal(true);
    } catch (e) {
      console.error("savePrebookQuestionsNow error:", e);
      setInstantError(
        e?.message ||
          "Could not save your research questions. Please try again."
      );
    } finally {
      setInstantBusy(false);
    }
  }

  async function generateInstantNow() {
    if (instantBusy) return;

    const ctx = instantPayCtx;
    const t = (instantTopic || "").trim();
    const qs = (instantQuestions || []).map((x) => (x || "").trim());

    if (!ctx || !ctx.userPhone || !ctx.razorpayOrderId) {
      setInstantError("Missing payment context. Please try again.");
      return;
    }

    if (!t) {
      setInstantError("Topic missing. Please close and try again.");
      return;
    }

    if (qs.length !== 5 || qs.some((x) => !x)) {
      setInstantError("Please fill all 5 questions.");
      return;
    }

    // PRE-BOOK uses the same question UI, but must stay in the Pre-book flow.
    if (ctx?.flowType === "prebook") {
      await savePrebookQuestionsNow(ctx, qs);
      return;
    }

    if (!INSTANT_CONFIRM_GENERATE_URL || !INSTANT_STATUS_URL) {
      setInstantError("Instant APIs are not configured in production env vars.");
      return;
    }

    setInstantError("");
    setInstantBusy(true);

    try {
      // Close questions modal and begin loading modal
      setInstantQuestionsOpen(false);

      setInstantModalOpen(true);
      setInstantModalTitle("Generating report…");
      setInstantModalSub("Submitting request…");
      setInstantProgressPct(10);

      const payload = {
        userPhone: ctx.userPhone,
        userName: ctx.userName || "RBR User",
        query: ctx.query || t,
        questions: qs,

        razorpayOrderId: ctx.razorpayOrderId,
        razorpayPaymentId: ctx.razorpayPaymentId,
        razorpaySignature: ctx.razorpaySignature,

        type: "instant",
      };

      const { res, data } = await fetchJson(INSTANT_CONFIRM_GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || data?.ok === false) {
        throw new Error(buildErrorMessage(res, data, "Could not start generation"));
      }

      const userPhone = data?.userPhone || data?.user_phone || ctx.userPhone;
      const instantId =
        data?.instantId || data?.instant_id || data?.instant_id || data?.id;

      if (!userPhone || !instantId) {
        console.error("Confirm response:", data);
        throw new Error("Confirm API did not return userPhone + instantId");
      }

      const statusData = await pollInstantUntilDone({ userPhone, instantId });
      if (!statusData || !instantMountedRef.current) return;

      const finalKey =
        statusData?.s3Key ||
        statusData?.s3_key ||
        statusData?.finalS3Key ||
        statusData?.final_s3_key ||
        "";

      setInstantModalSub("Ready!");
      setInstantProgressPct(100);

      setTimeout(() => {
        if (!instantMountedRef.current) return;
        setInstantModalOpen(false);

        // Redirect to profile and highlight latest report (you said highlighting is already in place)
        navigate("/profile", {
          replace: true,
          state: {
            highlightType: "instant",
            highlightFileKey: finalKey,
            highlightQuery: t,
            highlightInstantId: instantId,
            highlightUserPhone: userPhone,
          },
        });
      }, 600);
    } catch (e) {
      console.error("generateInstantNow error:", e);
      setInstantModalOpen(false);

      setModalTitle("Instant report failed");
      setModalMsgNode(
        <span>
          ⚠️ {e?.message || "Something went wrong while generating the report."}
        </span>
      );
      setOpenModal(true);
    } finally {
      setInstantBusy(false);
    }
  }

  // ✅ Single-glance offer actions. The first screen contains NO form.
  // New/logged-out users see name + mobile only after choosing a product.
  const beginCustomOrderFromOffer = async () => {
    setPrebookError("");
    setInstantChooserError("");

    trackRbrFunnelEvent({
      eventName: "prebook_order_clicked",
      query: prebookQuery,
      gaEventName: "rbr_prebook_order_clicked",
      gaParams: {
        currency: REGION.currencyCode,
        value: Number(REGION.prebookPrice || 0),
      },
    });

    const phoneDigits = String(prebookPhone || "").replace(/\D/g, "");
    const nm = (prebookName || "").trim() || "RBR User";

    // Repeat/logged-in buyers should not be forced through another form.
    if (state?.userInfo?.isLogin && phoneDigits.length >= 10) {
      trackRbrFunnelEvent({
        eventName: "identity_ready",
        query: prebookQuery,
        extra: { login_mode: "existing_session" },
      });
      setPrebookPromptOpen(false);
      await startPrebookFlow(prebookQuery, nm, phoneDigits);
      return;
    }

    trackRbrFunnelEvent({
      eventName: "order_details_started",
      query: prebookQuery,
      extra: { selected_product: "custom_prebook" },
    });

    setChooserIntent("prebook");
    setChooserStep("details");
  };

  const beginInstantOrderFromOffer = async () => {
    setPrebookError("");
    setInstantChooserError("");

    trackRbrFunnelEvent({
      eventName: "instant_order_clicked",
      query: prebookQuery,
      gaEventName: "rbr_instant_order_clicked",
      gaParams: {
        currency: REGION.currencyCode,
        value: Number(REGION.instantPrice || 0),
      },
    });

    const phoneDigits = String(prebookPhone || "").replace(/\D/g, "");

    if (state?.userInfo?.isLogin && phoneDigits.length >= 10) {
      await triggerInstant(prebookQuery);
      return;
    }

    trackRbrFunnelEvent({
      eventName: "order_details_started",
      query: prebookQuery,
      extra: { selected_product: "instant" },
    });

    setChooserIntent("instant");
    setChooserStep("details");
  };

  const handlePrebookSubmit = async (e) => {
    e.preventDefault();
    setInstantChooserError("");

    trackRbrFunnelEvent({
      eventName: "order_details_submitted",
      query: prebookQuery,
      extra: { selected_product: "custom_prebook" },
    });

    const phoneDigits = (prebookPhone || "").replace(/\D/g, "");
    let nm = (prebookName || "").trim();

    if (!nm) nm = "RBR User";

    if (phoneDigits.length < 10) {
      setPrebookError(
        prebookHasKnownUser
          ? "Your saved phone number seems invalid. Please update your profile or contact us."
          : "Please enter a valid phone number (at least 10 digits)."
      );
      return;
    }

    if (!prebookHasKnownUser && !(prebookName || "").trim()) {
      setPrebookError("Please enter your name.");
      return;
    }

    setPrebookError("");
    setInstantChooserError("");

    // Logged-in users can proceed directly to Razorpay.
    const alreadyLoggedIn = !!state?.userInfo?.isLogin;
    if (alreadyLoggedIn) {
      trackRbrFunnelEvent({
        eventName: "identity_ready",
        query: prebookQuery,
        extra: {
          login_mode: "existing_session",
        },
      });

      pendingPrebookRef.current = null;
      setPrebookPromptOpen(false);
      await startPrebookFlow(prebookQuery, nm, phoneDigits);
      return;
    }

    // Logged-out users must verify the phone number before Razorpay opens.
    pendingInstantRef.current = null;
    pendingPrebookRef.current = {
      query: prebookQuery,
      userName: nm,
      phoneDigits,
    };
    pendingChooserSnapshotRef.current = {
      prebookQuery,
      prebookName: nm,
      prebookPhone: phoneDigits,
      prebookHasKnownUser,
    };

    // ✅ Funnel stage 6: OTP/login step started for Pre-book.
    trackRbrFunnelEvent({
      eventName: "otp_started",
      query: prebookQuery,
      gaEventName: "rbr_prebook_otp_started",
      gaParams: {
        login_method: "phone_otp",
      },
    });

    // Reuse the existing inline OTP UI and the same Login.jsx OTP APIs.
    setOtpPhone(phoneDigits.slice(-10));
    setOtpValue("");
    setOtpError("");
    setOtpSent(false);
    setInstantOtpStep(true);

    // Send OTP as soon as the verification step opens.
    setTimeout(() => {
      sendOtpForInstant(phoneDigits);
    }, 0);
  };



  const handleChooserDetailsSubmit = async (e) => {
    e.preventDefault();

    if (chooserIntent === "prebook") {
      await handlePrebookSubmit(e);
      return;
    }

    trackRbrFunnelEvent({
      eventName: "order_details_submitted",
      query: prebookQuery,
      extra: { selected_product: "instant" },
    });

    await triggerInstant(prebookQuery);
  };


// ⭐ Open one representative NEW pre-book/custom-report sample.
// This is intentionally separate from the generic "View Sample Reports" list
// so we can measure whether seeing a premium sample changes conversion.
const openCustomPrebookSample = async () => {
  const query = (prebookQuery || "").trim();

  trackRbrFunnelEvent({
    eventName: "custom_sample_clicked",
    query,
    gaEventName: "view_custom_report_sample",
    gaParams: {
      sample_type: "prebook_custom",
      sample_action: "click",
    },
  });

  if (!PREBOOK_SAMPLE_FILE_KEY) {
    setModalTitle("Sample report is being prepared");
    setModalMsgNode(
      <span>
        We’re preparing a representative sample of our new custom-report
        quality. Please check again shortly.
      </span>
    );
    setOpenModal(true);
    return;
  }

  try {
    setSearchLoading(true);

    const presignResp = await fetch(PRESIGN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_key: PREBOOK_SAMPLE_FILE_KEY }),
    });

    if (!presignResp.ok) {
      throw new Error("Could not open the custom-report sample.");
    }

    const presignData = await presignResp.json();
    const url = presignData?.presigned_url;

    if (!url) {
      throw new Error("Sample URL was not returned.");
    }

    markCustomPrebookSampleSeen();

    trackRbrFunnelEvent({
      eventName: "custom_sample_viewed",
      query,
      gaEventName: "view_custom_report_sample",
      gaParams: {
        sample_type: "prebook_custom",
        sample_action: "opened",
      },
    });

    setPdfViewerTitle("Sample Custom Report Preview");
    setPdfViewerUrl(url);
    setPdfViewerOpen(true);
  } catch (e) {
    console.error("openCustomPrebookSample error:", e);
    setModalTitle("Sample unavailable");
    setModalMsgNode(
      <span>
        ⚠️ We couldn’t open the custom-report sample right now. Please try
        again shortly.
      </span>
    );
    setOpenModal(true);
  } finally {
    setSearchLoading(false);
  }
};

// ⭐ Run a sample search using the same form submit flow
const runSampleSearch = (query) => {
  const safe = (query || "").slice(0, MAX_QUERY_CHARS);
  setSamplesOpen(false);
  setShowSuggestions(false);
  setSamplePreviewMode(true);
  setQ(safe);

  // wait for state to apply, then submit the form (triggers existing onSubmit)
  setTimeout(() => {
    try {
      inputRef.current?.focus();
      const form = inputRef.current?.closest("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    } catch (e) {
      // no-op
    }
  }, 60);
};

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 pt-24 pb-10 relative">
{/* Sample Reports */}
<div className="absolute top-1 right-0 sm:right-1">
  <button
    type="button"
    onClick={() => setSamplesOpen(true)}
    className="rounded-full bg-slate-100 text-slate-500 px-4 py-2 text-sm font-medium border border-slate-200 opacity-60 hover:opacity-100 transition"
  >
    View Sample Reports
  </button>
</div>

{/* Hero */}
      <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-3 px-1">
        Get Instant Market &amp; Business Reports
      </h1>
      <p className="text-gray-600 text-center mb-6 text-sm sm:text-base px-2">
        Search 1000+ industry reports. Accurate. Reliable. Ready for your business.
      </p>

      {/* Search */}
      <form onSubmit={onSubmit} className="w-full mb-3">
        <label htmlFor="mobile-search" className="sr-only">
          Search reports
        </label>
        <div className="w-full flex">
          <input
            ref={inputRef}
            id="mobile-search"
            type="text"
            value={q}
            maxLength={MAX_QUERY_CHARS}
            onChange={(e) => {
              const v = e.target.value || "";
              if (v.length <= MAX_QUERY_CHARS) setQ(v);
              else setQ(v.slice(0, MAX_QUERY_CHARS));
            }}
            onFocus={handleFocus}
            placeholder="e.g., paper industry, FMCG, pharma…"
            inputMode="search"
            enterKeyHint="search"
            className="flex-grow px-3 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="bg-blue-600 text-white px-4 py-3 rounded-r-xl font-semibold text-sm sm:text-base active:scale-[0.98] disabled:opacity-60"
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>

        </div>
        
{samplesOpen &&
    createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSamplesOpen(false)}
        />

        {/* modal */}
        <div className="relative w-full max-w-[560px] rounded-3xl border border-white/10 bg-[#0b1220]/95 shadow-2xl">
          {/* glow */}
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-400/15 via-blue-400/10 to-fuchsia-400/15 blur-xl" />

          {/* header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <div className="text-white text-lg font-semibold">Sample Reports</div>
              <div className="text-white/60 text-xs mt-1">
                Click one to open preview
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSamplesOpen(false)}
              className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* body */}
          <div className="relative p-4 max-h-[70vh] overflow-auto">
            <div className="mb-4">
              <div className="text-white/70 text-xs font-semibold mb-2">POPULAR REPORTS</div>
              <div className="grid gap-2">
                {POPULAR_REPORTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => runSampleSearch(t)}
                    className="group w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white">{t}</div>
                      <div className="text-white/60 group-hover:text-white">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white/70 text-xs font-semibold mb-2">TRENDING INDUSTRIES</div>
              <div className="grid gap-2">
                {TRENDING_INDUSTRIES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => runSampleSearch(t)}
                    className="group w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-white">{t}</div>
                      <div className="text-white/60 group-hover:text-white">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="relative px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-white/50 text-xs">
              Tip: You can edit these samples in the frontend anytime.
            </div>
            <button
              type="button"
              onClick={() => setSamplesOpen(false)}
              className="rounded-full px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )}

{/* Inline autocomplete suggestions via PORTAL */}
      {showSuggestions &&
        matches.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto rounded-b-xl"
            style={{
              position: "fixed",
              left: dropdownRect.left,
              top: dropdownRect.top,
              width: dropdownRect.width,
            }}
          >
            {matches.map((m) => (
              <button
                key={m}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ(m.slice(0, MAX_QUERY_CHARS));
                  setShowSuggestions(false);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {m}
              </button>
            ))}
          </div>,
          document.body
        )}

      </form>


      {/* Loader overlay for search */}
      {searchLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3">
              <LoaderRing />
            </div>
            <div className="text-gray-800 text-sm">Fetching your request…</div>
          </div>
        </div>
      )}

      {/* Loader overlay for pre-booking / payment confirm */}
      {prebookLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[90%] max-w-xs text-center">
            <div className="flex items-center justify-center mb-3">
              <LoaderRing />
            </div>
            <div className="text-gray-800 text-sm">
              Processing your payment and confirming your custom report order…
            </div>
          </div>
        </div>
      )}

      {/* ✅ Instant generation loading modal (employee-portal style) */}
      {instantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 bg-white rounded-2xl p-6 shadow-xl w-[92%] max-w-sm">
            <div className="text-base font-extrabold text-gray-900">
              {instantModalTitle}
            </div>
            <div className="text-xs text-gray-600 mt-1">{instantModalSub}</div>

            <div className="mt-4">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-blue-600"
                  style={{
                    width: `${Math.max(0, Math.min(100, instantProgressPct))}%`,
                  }}
                />
              </div>
              <div className="text-right text-[11px] text-gray-600 mt-1">
                {instantProgressPct}%
              </div>
            </div>

            <div className="text-[11px] text-gray-500 mt-3">
              This can take up to ~2 minutes because charts + PDF are generated
              in the worker.
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Retry payment modal (centered + different theme) */}
      {retryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setRetryOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-amber-200 bg-[#FFF7ED] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <span style={{ fontSize: 20 }}>⚠️</span>
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-amber-900">
                  Payment cancelled
                </div>
                <div className="text-xs text-amber-900/70 mt-0.5">
                  No money was taken (in most cases). You can retry immediately.
                </div>
              </div>
              <button
                onClick={() => setRetryOpen(false)}
                className="ml-auto h-8 w-8 rounded-full bg-white/70 hover:bg-white text-amber-800 flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-amber-900/80 mb-3 leading-relaxed">
              Your details are saved. Tap <strong>Retry payment</strong> to open
              the payment window again.
            </p>

            <div className="mb-4 rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="text-xs font-semibold text-amber-900 mb-1">
                After successful custom report order
              </div>
              <ul className="text-[11px] text-amber-900/80 space-y-1 ml-4 list-disc">
                <li>OTP login to your account</li>
                <li>
                  Report is unlocked in <strong>My Profile</strong> when ready
                </li>
                <li>
                  Delivery within <strong>48 hours</strong>
                </li>
                <li>Your custom report is prepared specifically for your requirement.</li>
              </ul>
            </div>

            <button
              onClick={retryPrebookPayment}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Retry payment
            </button>

            <button
              onClick={() => setRetryOpen(false)}
              className="w-full mt-2 border border-amber-200 hover:border-amber-300 bg-white text-amber-900 font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Generic info / success modal (CENTERED + CUSTOM TITLE + BOLD MESSAGE) */}
      {openModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[92%] sm:w-[420px] bg-white rounded-2xl p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold mb-2">
              {modalTitle || "Search too generic"}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {modalMsgNode || <span>Please try a more specific search.</span>}
            </p>
            <button
              ref={modalBtnRef}
              onClick={closeModal}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl active:scale-[0.98]"
            >
              Okay
            </button>
          </div>
        </div>
      )}


      {/* 📄 PDF Viewer (used for Sample Reports) */}
      {pdfViewerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onClick={() => setPdfViewerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[96%] sm:w-[820px] h-[82vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="text-slate-900 font-semibold text-sm">
                {pdfViewerTitle}
              </div>
              <button
                type="button"
                onClick={() => setPdfViewerOpen(false)}
                className="h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="Close PDF"
              >
                ✕
              </button>
            </div>

            <div className="h-[calc(82vh-52px)]">
              {pdfViewerUrl ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                  <Viewer fileUrl={pdfViewerUrl} />
                </Worker>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                  Loading preview…
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ✅ OTP Modal (shown BEFORE Instant payment) */}
      {otpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={cancelInstantOtp}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[420px] rounded-2xl shadow-2xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-white/90 text-xs font-semibold tracking-wide">
                    Verify mobile number
                  </div>
                  <h2 className="text-white text-lg font-extrabold leading-tight mt-1">
                    Enter OTP to continue
                  </h2>
                  <div className="mt-2 text-white/90 text-xs leading-snug">
                    We’ll send an OTP to the number below. After verification,
                    we’ll open the {REGION.currencySymbol}{REGION.instantPrice} payment gateway.
                  </div>
                </div>

                <button
                  onClick={cancelInstantOtp}
                  className="shrink-0 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="px-5 pt-4 pb-5">
              {otpError ? (
                <div className="mb-3 text-sm text-red-600 font-semibold">
                  {otpError}
                </div>
              ) : null}

              <label className="text-xs font-bold text-gray-800">
                Mobile number
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 text-gray-800 font-semibold">
                  +91
                </div>
                <input
                  value={otpPhone}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setOtpPhone(digits);
                    setOtpSent(false);
                  }}
                  inputMode="numeric"
                  placeholder="10-digit number"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sendOtpForInstant(otpPhone)}
                  disabled={otpSending}
                  className="w-full border border-blue-200 hover:border-blue-300 bg-white text-blue-700 font-extrabold py-2.5 rounded-xl disabled:opacity-60"
                >
                  {otpSending ? "Sending…" : otpSent ? "Resend OTP" : "Send OTP"}
                </button>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-gray-800">OTP</label>
                <input
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={verifyOtpAndProceedInstant}
                disabled={otpVerifying}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl active:scale-[0.98]"
              >
                {otpVerifying ? "Verifying…" : "Verify & Continue to Payment"}
              </button>

              <button
                type="button"
                onClick={cancelInstantOtp}
                className="w-full mt-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-800 font-semibold py-2.5 rounded-xl"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Shared 5-question modal (Instant or Pre-book, shown AFTER payment success) */}
      {instantQuestionsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6"
          onClick={() => setInstantQuestionsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full sm:w-[580px] rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-white/90 text-xs font-semibold tracking-wide">
                    {instantPayCtx?.flowType === "prebook"
                      ? "Custom report payment confirmed ✅"
                      : `Instant Report — ${REGION.currencySymbol}${REGION.instantPrice} Paid ✅`}
                  </div>
                  <h2 className="text-white text-lg font-extrabold leading-tight mt-1">
                    {instantTopic}
                  </h2>
                  <div className="mt-2 text-white/90 text-xs leading-snug">
                    {instantPayCtx?.flowType === "prebook"
                      ? "Tell us the 5 things you want to know. We’ll use these research questions while preparing your custom business intelligence report."
                      : "Tell us the 5 things you want to know. We’ll generate your report accordingly."}
                  </div>
                </div>

                <button
                  onClick={() => setInstantQuestionsOpen(false)}
                  className="shrink-0 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              className="px-4 pt-4 pb-4 overflow-y-auto"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {instantError ? (
                <div className="mb-3 text-sm text-red-600 font-semibold">
                  {instantError}
                </div>
              ) : null}

              {instantQuestions.map((qv, i) => (
                <div key={i} className="mb-3">
                  <div className="text-xs font-bold text-gray-800 mb-1">
                    Question {i + 1}
                  </div>
                  <textarea
                    value={qv}
                    onChange={(e) => updateInstantQuestion(i, e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={generateInstantNow}
                disabled={instantBusy}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3 rounded-xl active:scale-[0.98]"
              >
                {instantPayCtx?.flowType === "prebook"
                  ? instantBusy
                    ? "Saving…"
                    : "Save research questions"
                  : instantBusy
                    ? "Generating…"
                    : "Generate report"}
              </button>

              <div className="text-[11px] text-gray-500 text-center mt-2">
                {instantPayCtx?.flowType === "prebook" ? (
                  <>
                    Your custom report will be prepared for your requirement
                    and will appear in <strong>My Profile</strong> when ready.
                  </>
                ) : (
                  <>
                    After generation, the report will appear in{" "}
                    <strong>My Profile</strong>.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Mobile-first report-not-found chooser: ONE GLANCE first, details only after a product is chosen */}
      {prebookPromptOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center px-3 py-3"
          onClick={() => setPrebookPromptOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* OTP remains the existing inline verification step */}
            {instantOtpStep ? (
              <div className="max-h-[92vh] overflow-y-auto px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={cancelInstantOtp}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrebookPromptOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="px-1 pb-2 flex justify-center">
                  <div
                    style={{
                      transform: "scale(0.6)",
                      transformOrigin: "top center",
                      width: "100%",
                      marginBottom: "-120px",
                    }}
                  >
                    <div className="text-center text-3xl sm:text-4xl font-light text-gray-600 mt-1">
                      Loading Level
                    </div>

                    <div
                      className="mx-auto mt-4 mb-8"
                      style={{
                        width: "min(520px, 92%)",
                        background: "#ffffff",
                        borderRadius: "999px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          border: "2px solid #0b3bff",
                          borderRadius: "999px",
                          padding: "4px",
                        }}
                      >
                        <div
                          style={{
                            height: "14px",
                            borderRadius: "999px",
                            background: "#d5dcff",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <div className="rbr-otp-loadingbar" />
                        </div>

                        <style>{`
                          @keyframes rbrIndeterminate {
                            0%   { transform: translateX(-60%); }
                            100% { transform: translateX(260%); }
                          }
                          .rbr-otp-loadingbar{
                            position:absolute;
                            top:0; left:0;
                            height:100%;
                            width:35%;
                            background:#0b3bff;
                            border-radius:999px;
                            animation:rbrIndeterminate 1.15s ease-in-out infinite;
                          }
                        `}</style>
                      </div>
                    </div>

                    <div className="text-center text-4xl sm:text-5xl font-light text-gray-700 mb-3">
                      Verification Code
                    </div>
                    <div className="text-center text-lg sm:text-xl text-gray-700 mb-6">
                      Please enter the verification code sent to your mobile
                    </div>

                    <div
                      className="flex items-center justify-center gap-3 mb-7"
                      onPaste={onOtpPaste}
                    >
                      {Array.from({ length: OTP_LEN }).map((_, i) => (
                        <React.Fragment key={i}>
                          <input
                            ref={(el) => (otpBoxesRef.current[i] = el)}
                            value={otpDigits[i] || ""}
                            onChange={(e) => onOtpChange(i, e)}
                            onKeyDown={(e) => onOtpKeyDown(i, e)}
                            inputMode="numeric"
                            maxLength={1}
                            className={
                              "w-12 h-12 sm:w-14 sm:h-14 text-2xl text-center border rounded-md focus:outline-none " +
                              (i ===
                              Math.min(
                                otpValue.replace(/\D/g, "").length,
                                OTP_LEN - 1
                              )
                                ? "border-black"
                                : "border-gray-300")
                            }
                            aria-label={`OTP digit ${i + 1}`}
                          />
                          {i < OTP_LEN - 1 && (
                            <span className="text-gray-500 text-2xl" aria-hidden>
                              ·
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {otpError && (
                      <div className="text-center text-sm text-red-600 -mt-3 mb-4">
                        {otpError}
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onClick={verifyOtpAndProceedInstant}
                        disabled={otpVerifying}
                        className="w-[220px] sm:w-[260px] bg-indigo-600 hover:bg-indigo-700 text-white text-xl sm:text-2xl font-medium py-3 rounded-md shadow"
                      >
                        {otpVerifying ? "VERIFYING…" : "VERIFY"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : chooserStep === "details" ? (
              /* STEP 2 — only now ask for name/mobile */
              <div className="bg-[#F7FCFF] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPrebookError("");
                      setInstantChooserError("");
                      setChooserStep("offer");
                    }}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrebookPromptOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
                    {chooserIntent === "prebook" ? "Custom Report" : "Instant Report"}
                  </div>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {chooserIntent === "prebook"
                      ? `Order Custom Report — ${REGION.currencySymbol}${REGION.prebookPrice}`
                      : `Instant 10-Page Report — ${REGION.currencySymbol}${REGION.instantPrice}`}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Just your name and mobile number, then OTP and secure payment.
                  </p>
                </div>

                <form onSubmit={handleChooserDetailsSubmit} className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={prebookName}
                    onChange={(e) => setPrebookName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    value={prebookPhone}
                    onChange={(e) => setPrebookPhone(e.target.value)}
                    placeholder="WhatsApp / mobile number"
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {chooserIntent === "prebook" && prebookError ? (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                      {prebookError}
                    </div>
                  ) : null}

                  {chooserIntent === "instant" && instantChooserError ? (
                    <div className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                      {instantChooserError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    className={
                      "w-full rounded-xl py-3 text-sm font-black text-white shadow active:scale-[0.99] " +
                      (chooserIntent === "prebook"
                        ? "bg-[#15805C] hover:bg-[#116B4D]"
                        : "bg-[#2E83B8] hover:bg-[#2475A6]")
                    }
                  >
                    Continue to OTP
                  </button>

                  <div className="text-center text-[10px] text-slate-500">
                    OTP verification • Secure Razorpay payment
                  </div>
                </form>
              </div>
            ) : (
              /* STEP 1 — calm, one-glance solution screen */
              <div className="bg-[#F7FCFF] px-3.5 py-3.5">
                {/* Context first: make the search outcome impossible to miss */}
                <div className="relative rounded-2xl border border-[#CFEAF7] bg-[#EAF7FD] px-3.5 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => setPrebookPromptOpen(false)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-sm"
                    aria-label="Close"
                  >
                    ✕
                  </button>

                  <div className="text-[17px] font-extrabold leading-snug text-[#22313F] pr-6 pl-6">
                    We don’t have this exact report in our database yet.
                  </div>

                  <div
                    className="mx-auto mt-2 max-w-[92%] rounded-xl bg-white/85 px-3 py-2 text-[13px] font-bold leading-snug text-[#2F5D73] shadow-sm"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    “{prebookQuery}”
                  </div>

                  <div className="mt-2 text-[13px] font-bold leading-snug text-[#18704F]">
                    You can still get the information you need.
                  </div>
                </div>

                {/* Instant: quick help for the immediate requirement */}
                <div className="mt-3 rounded-2xl border border-[#CFE7F8] bg-[#F0F9FF] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#347CA5]">
                        Need it right now?
                      </div>
                      <div className="mt-0.5 text-[15px] font-extrabold text-[#22313F]">
                        Instant 10-Page Report
                      </div>
                      <div className="mt-0.5 text-[10px] leading-snug text-[#58717F]">
                        Immediate automated overview to help with your current requirement.
                      </div>
                    </div>

                    <div className="shrink-0 text-[20px] font-black text-[#2878A8]">
                      {REGION.currencySymbol}{REGION.instantPrice}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={beginInstantOrderFromOffer}
                    className="mt-2.5 w-full rounded-xl bg-[#2E83B8] py-2.5 text-[13px] font-black text-white shadow-sm hover:bg-[#2475A6] active:scale-[0.99]"
                  >
                    Generate Instant Report
                  </button>
                </div>

                {/* Custom: the detailed/premium solution */}
                <div className="mt-3 rounded-2xl border-2 border-[#BDE8D2] bg-[#EFFAF4] p-3.5 shadow-[0_8px_24px_rgba(21,128,92,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-[#15805C]">
                        Need the full answer?
                      </div>
                      <div className="mt-0.5 text-[16px] font-black text-[#21382F]">
                        Custom Business Report
                      </div>
                      <div className="mt-0.5 text-[10px] leading-snug text-[#557066]">
                        Detailed research prepared for your exact requirement.
                      </div>
                    </div>

                    <div className="shrink-0 text-[21px] font-black text-[#157A58]">
                      {REGION.currencySymbol}{REGION.prebookPrice}
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-center">
                    <div className="rounded-lg bg-white/90 px-1.5 py-2 text-[9px] font-bold leading-tight text-[#365A4C]">
                      Your exact requirement
                    </div>
                    <div className="rounded-lg bg-white/90 px-1.5 py-2 text-[9px] font-bold leading-tight text-[#365A4C]">
                      Ask 5 questions
                    </div>
                    <div className="rounded-lg bg-white/90 px-1.5 py-2 text-[9px] font-bold leading-tight text-[#365A4C]">
                      Sources • 48 hours
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-[0.88fr_1.12fr] gap-2">
                    <button
                      type="button"
                      onClick={openCustomPrebookSample}
                      className="rounded-xl border border-[#99D8B9] bg-white py-2.5 px-2 text-[11px] font-extrabold text-[#157A58] hover:bg-[#F7FFFA] active:scale-[0.99]"
                    >
                      View Sample
                    </button>

                    <button
                      type="button"
                      onClick={beginCustomOrderFromOffer}
                      className="rounded-xl bg-[#15805C] py-2.5 px-2 text-[11px] font-black text-white shadow-sm hover:bg-[#116B4D] active:scale-[0.99]"
                    >
                      Order Custom — {REGION.currencySymbol}{REGION.prebookPrice}
                    </button>
                  </div>

                  <div className="mt-1.5 text-center text-[9px] font-medium text-[#698078]">
                    Secure Razorpay payment • Report saved in My Profile
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Did you mean modal */}
      {suggestOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSuggestOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative z-10 w-[92%] max-w-sm rounded-2xl shadow-2xl border border-blue-100 bg-[#EAF6FF] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-blue-900">
                Did you mean…
              </h3>
              <button
                onClick={() => setSuggestOpen(false)}
                className="h-8 w-8 rounded-full bg-white/70 hover:bg-white text-blue-700 flex items-center justify-center"
                aria-label="Close suggestions"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-blue-800/80 mb-3">
              You searched: <strong>{lastQuery}</strong>
            </p>

            <div className="space-y-2">
              {suggestItems.map((s) => (
                <button
                  key={s.slug || s.title}
                  type="button"
                  className="w-full text-left rounded-xl border border-blue-100 bg-white/80 hover:bg-white hover:border-blue-200 hover:shadow-md active:scale-[0.99] transition-all p-3 flex items-center gap-3"
                  onClick={() => {
                    setSuggestOpen(false);
                    goToReportBySlug(s);
                  }}
                >
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <span>📊</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {s.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSuggestOpen(false)}
              className="mt-3 w-full border border-blue-100 hover:border-blue-200 bg-[#DFF1FF] hover:bg-[#D6ECFF] text-blue-900 font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-all"
            >
              None of these
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsMobile;

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import "./ReportsDisplay.css";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import Login from "./Login";
import { useStore } from "../Store";
import { Modal, ModalBody } from "reactstrap";

const PRESIGN_URL =
  "https://vtwyu7hv50.execute-api.ap-south-1.amazonaws.com/default/RBR_report_pre-signed_URL";

const MRP = 2999;
const PROMO_PCT = 25;
const FINAL = Math.round(MRP * (1 - PROMO_PCT / 100));
const UNLOCKED_MAX_PAGE = 3; // page index 0-3 = first 4 pages free

const ReportsDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useStore();

  const reportSlugFromState = location.state?.reportSlug || "";
  const incomingFileKey = location.state?.fileKey || "";
  const incomingReportId = location.state?.reportId || "";

  const { status = false, email = "", userInfo = {} } = state || {};
  const isLoggedIn = !!userInfo?.isLogin;
  const purchases = userInfo?.purchases || [];

  const derivedSlugFromFileKey = useMemo(() => {
    if (!incomingFileKey) return "";
    const m = incomingFileKey.match(/([a-z0-9_]+)(?:_preview)?\.pdf$/i);
    return m ? m[1] : "";
  }, [incomingFileKey]);

  const reportSlug =
    reportSlugFromState || derivedSlugFromFileKey || "paper_industry";

  const isPurchased = purchases.includes(reportSlug);

  const desiredKey = useMemo(() => {
    if (incomingFileKey) return incomingFileKey;
    return `${reportSlug}${isPurchased ? "" : "_preview"}.pdf`;
  }, [incomingFileKey, reportSlug, isPurchased]);

  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");
  const [localFileKey, setLocalFileKey] = useState(desiredKey);
  const [localReportId, setLocalReportId] = useState(incomingReportId);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setLocalFileKey(desiredKey);
    setLocalReportId(incomingReportId || "");
  }, [desiredKey, incomingReportId]);

  const shouldLock =
    !isPurchased &&
    typeof currentPage === "number" &&
    currentPage > UNLOCKED_MAX_PAGE;

  const formatSlugTitle = (slug) => {
    if (!slug) return "Report Preview";
    return slug
      .replace(/_preview$/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const pageTitle = formatSlugTitle(reportSlug);
  const pageDesc = isPurchased
    ? "You’ve unlocked this report from Rajan Business Reports."
    : "Preview this report and unlock the full version for complete data, analysis, and forecasts.";

  const handlePayment = () => {
    cxtDispatch({
      type: "SET_FILE_REPORT",
      payload: {
        fileKey: `${reportSlug}.pdf`,
        reportId: localReportId,
        reportSlug,
      },
    });

    localStorage.setItem("amount", String(FINAL));

    if (isLoggedIn) {
      navigate("/payment", {
        replace: true,
        state: {
          fromReport: true,
          amount: FINAL,
          reportId: localReportId,
          fileKey: `${reportSlug}.pdf`,
          reportSlug,
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

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!localFileKey) {
        setError("No report key determined. Please try again.");
        setPdfUrl("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(PRESIGN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_key: localFileKey }),
        });

        if (!response.ok) {
          const txt = await response.text();
          throw new Error(`HTTP ${response.status}: ${txt}`);
        }

        const data = await response.json();

        if (!data?.presigned_url) {
          throw new Error(`No presigned URL returned: ${JSON.stringify(data)}`);
        }

        setPdfUrl(data.presigned_url);
      } catch (err) {
        console.error("Error fetching presigned URL:", err);
        setError("Failed to load report preview. Please try again.");
        setPdfUrl("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [localFileKey]);

  return (
    <>
      <div className="report-display">
        <nav className="navbar navbar-expand-lg bg-light">
          <div className="container-fluid">
            <div className="nav-left">
              <div className="logo">
                <Link to="/" className="navbar-brand">
                  <img src={logo} alt="" style={{ width: "60px", height: "60px" }} />
                </Link>
              </div>

              <div className="text">
                <p
                  className="report-display-title"
                  style={{ fontSize: "28px", marginBottom: "6px" }}
                >
                  {pageTitle}
                </p>
                <p
                  className="report-display-desc"
                  style={{ marginTop: "0px", width: "70%" }}
                >
                  {pageDesc}
                </p>
              </div>
            </div>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <button
                    className="buy-btn"
                    onClick={handlePayment}
                    style={{ color: "white" }}
                  >
                    {isPurchased ? "PURCHASED" : "BUY NOW"}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div
          className="viewer col-md-11 col-sm-11 col-11"
          style={{ position: "relative", minHeight: "80vh" }}
        >
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {isLoading ? (
              <div className="spinner-border" role="status" style={{ marginTop: "40px" }}>
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : pdfUrl ? (
              <>
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  onPageChange={(e) => {
                    setCurrentPage(e.currentPage);
                  }}
                />

                {shouldLock && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 30,
                        background:
                          "linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(15,23,42,0.18), rgba(15,23,42,0.82))",
                        backdropFilter: "blur(3px)",
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "24px",
                        transform: "translateX(-50%)",
                        zIndex: 40,
                        width: "min(92%, 520px)",
                        borderRadius: "20px",
                        background:
                          "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
                        border: "1px solid rgba(59,130,246,0.35)",
                        boxShadow: "0 20px 45px rgba(15,23,42,0.55)",
                        color: "#fff",
                        padding: "18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "16px",
                          alignItems: "flex-start",
                          marginBottom: "10px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "inline-block",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              padding: "4px 8px",
                              borderRadius: "999px",
                              background: "rgba(59,130,246,0.15)",
                              border: "1px solid rgba(96,165,250,0.45)",
                              color: "#bfdbfe",
                              marginBottom: "8px",
                            }}
                          >
                            You’ve reached the detailed section
                          </div>

                          <div style={{ fontSize: "16px", fontWeight: 600 }}>
                            Unlock the full report to continue beyond the free preview.
                          </div>
                        </div>

                        <div style={{ textAlign: "right", minWidth: "90px" }}>
                          <div
                            style={{
                              textDecoration: "line-through",
                              color: "#94a3b8",
                              fontSize: "12px",
                            }}
                          >
                            ₹{MRP.toLocaleString("en-IN")}
                          </div>
                          <div
                            style={{
                              color: "#fde68a",
                              fontWeight: 700,
                              fontSize: "20px",
                              lineHeight: 1.1,
                            }}
                          >
                            ₹{FINAL.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "11px", color: "#86efac" }}>
                            {PROMO_PCT}% launch discount
                          </div>
                        </div>
                      </div>

                      <ul
                        style={{
                          margin: "0 0 14px 18px",
                          padding: 0,
                          fontSize: "13px",
                          color: "#e2e8f0",
                          lineHeight: 1.6,
                        }}
                      >
                        <li>Full market size and growth outlook</li>
                        <li>Competitor list, pricing, and business insights</li>
                        <li>Detailed opportunities, risks, and recommendations</li>
                      </ul>

                      <button
                        onClick={handlePayment}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: "12px",
                          padding: "12px 14px",
                          fontWeight: 700,
                          fontSize: "14px",
                          background:
                            "linear-gradient(to right, #fbbf24, #fde68a)",
                          color: "#111827",
                          cursor: "pointer",
                          marginBottom: "10px",
                        }}
                      >
                        Pay & unlock full report — ₹{FINAL.toLocaleString("en-IN")}
                      </button>

                      <div
                        style={{
                          textAlign: "center",
                          fontSize: "11px",
                          color: "#cbd5e1",
                        }}
                      >
                        You can still scroll back and read the first 4 preview pages.
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="error-message">
                Failed to load report preview. The preview file may be missing.
              </div>
            )}
          </Worker>
        </div>
      </div>

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
    </>
  );
};

export default ReportsDisplay;

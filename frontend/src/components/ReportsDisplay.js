import React, { useState, useEffect } from "react";
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

const ReportsDisplay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const { state, dispatch: cxtDispatch } = useStore();

  const reportSlug = location.state?.reportSlug || "";
  const incomingFileKey = location.state?.fileKey || "";
  const incomingReportId = location.state?.reportId || "";

  const { status = false, email = "" } = state || {};

  const [openModel, setOpenModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState("");
  const [localFileKey, setLocalFileKey] = useState("");
  const [localReportId, setLocalReportId] = useState(incomingReportId);

  useEffect(() => {
    // Accept either fileKey directly, or derive preview file from reportSlug
    const resolvedFileKey =
      incomingFileKey || (reportSlug ? `${reportSlug}_preview.pdf` : "");

    setLocalFileKey(resolvedFileKey);
    setLocalReportId(incomingReportId || "");
  }, [incomingFileKey, reportSlug, incomingReportId]);

  const formatSlugTitle = (slug) => {
    if (!slug) return "Report Preview";
    return slug
      .replace(/_preview$/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const pageTitle = formatSlugTitle(reportSlug || localFileKey.replace(/\.pdf$/i, ""));
  const pageDesc =
    "Preview the report and continue to purchase if you would like full access.";

  const handlePayment = () => {
    cxtDispatch({
      type: "SET_FILE_REPORT",
      payload: { fileKey: localFileKey, reportId: localReportId },
    });

    if (state?.userInfo?.isLogin && state?.userInfo?.token) {
      navigate("/payment", {
        replace: true,
        state: { fileKey: localFileKey, reportId: localReportId },
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
        console.error("No fileKey or reportSlug found.");
        setPdfUrl("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
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
        if (data?.presigned_url) {
          setPdfUrl(data.presigned_url);
        } else {
          throw new Error(`No presigned_url returned: ${JSON.stringify(data)}`);
        }
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
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
                    disabled={!localFileKey}
                  >
                    BUY NOW
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="viewer col-md-11 col-sm-11 col-11">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            {isLoading ? (
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : pdfUrl ? (
              <Viewer fileUrl={pdfUrl} plugins={[defaultLayoutPluginInstance]} />
            ) : (
              <div className="error-message">
                Failed to load report preview. The preview file may be missing or the
                report key was not passed correctly.
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
              <p className="success-head">The Report has been successfully sent to</p>
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

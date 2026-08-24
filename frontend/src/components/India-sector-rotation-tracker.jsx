import React, { useMemo, useState } from "react";

/*
  India Sector Rotation Tracker
  --------------------------------
  CURRENT VERSION:
  - Public overview is visible to everyone.
  - Detailed sections are locked.
  - Authentication/subscription are currently placeholders.
  - Data is SAMPLE DATA until we connect the 10 AM backend update.

  LATER WE WILL REPLACE:
  1. DEMO_AUTH with your existing RBR login/userInfo.
  2. SAMPLE_DATA with API data.
  3. Subscription button with Razorpay subscription flow.
  4. Access check with the RBR entitlement/subscription table.
*/

const CONFIG = {
  showSampleDataWarning: true,

  // Keep false on production until subscription/payment is connected.
  subscriptionLive: false,

  // TEMPORARY DEVELOPMENT OPTION:
  // Change this to true if YOU want to visually inspect all expanded sections.
  // IMPORTANT: Keep false on the live production version.
  previewAsSubscriber: false,
};

const DEMO_AUTH = {
  isLoggedIn: false,
  isSubscribed: false,
};

const sectorData = [
  {
    sector: "Nifty Auto",
    shortName: "Auto",
    status: "Leading",
    score: 91,
    oneWeek: "+3.8%",
    oneMonth: "+8.4%",
    threeMonth: "+14.2%",
    momentum: "Strong",
    change: "+5",
  },
  {
    sector: "Nifty Metal",
    shortName: "Metal",
    status: "Leading",
    score: 86,
    oneWeek: "+2.9%",
    oneMonth: "+7.1%",
    threeMonth: "+11.8%",
    momentum: "Strong",
    change: "+2",
  },
  {
    sector: "Nifty IT",
    shortName: "IT",
    status: "Improving",
    score: 79,
    oneWeek: "+4.2%",
    oneMonth: "+6.7%",
    threeMonth: "+3.9%",
    momentum: "Accelerating",
    change: "+9",
  },
  {
    sector: "Nifty Realty",
    shortName: "Realty",
    status: "Improving",
    score: 74,
    oneWeek: "+3.1%",
    oneMonth: "+5.5%",
    threeMonth: "+2.8%",
    momentum: "Improving",
    change: "+7",
  },
  {
    sector: "Nifty Bank",
    shortName: "Bank",
    status: "Improving",
    score: 69,
    oneWeek: "+1.8%",
    oneMonth: "+4.2%",
    threeMonth: "+6.1%",
    momentum: "Improving",
    change: "+3",
  },
  {
    sector: "Nifty Pharma",
    shortName: "Pharma",
    status: "Weakening",
    score: 57,
    oneWeek: "-1.3%",
    oneMonth: "+1.8%",
    threeMonth: "+7.2%",
    momentum: "Falling",
    change: "-8",
  },
  {
    sector: "Nifty FMCG",
    shortName: "FMCG",
    status: "Weakening",
    score: 51,
    oneWeek: "-0.8%",
    oneMonth: "+0.6%",
    threeMonth: "+4.5%",
    momentum: "Falling",
    change: "-5",
  },
  {
    sector: "Nifty Energy",
    shortName: "Energy",
    status: "Lagging",
    score: 38,
    oneWeek: "-2.1%",
    oneMonth: "-3.4%",
    threeMonth: "-1.9%",
    momentum: "Weak",
    change: "-4",
  },
  {
    sector: "Nifty Media",
    shortName: "Media",
    status: "Lagging",
    score: 31,
    oneWeek: "-2.8%",
    oneMonth: "-5.2%",
    threeMonth: "-7.1%",
    momentum: "Weak",
    change: "-2",
  },
];

const stockDrivers = {
  Auto: ["Mahindra & Mahindra", "Maruti Suzuki", "Bajaj Auto", "Eicher Motors"],
  Metal: ["Tata Steel", "Hindalco", "JSW Steel", "Vedanta"],
  IT: ["TCS", "Infosys", "HCL Technologies", "Tech Mahindra"],
  Realty: ["DLF", "Godrej Properties", "Macrotech Developers", "Oberoi Realty"],
};

const rotationHistory = [
  {
    sector: "IT",
    previous: "Lagging",
    middle: "Improving",
    current: "Improving",
    direction: "Positive",
  },
  {
    sector: "Auto",
    previous: "Improving",
    middle: "Leading",
    current: "Leading",
    direction: "Positive",
  },
  {
    sector: "Pharma",
    previous: "Leading",
    middle: "Leading",
    current: "Weakening",
    direction: "Negative",
  },
  {
    sector: "Realty",
    previous: "Lagging",
    middle: "Improving",
    current: "Improving",
    direction: "Positive",
  },
];

const sections = [
  {
    id: "rotation-map",
    number: "01",
    title: "Sector Rotation Map",
    description:
      "See which Indian market sectors are Leading, Improving, Weakening or Lagging.",
  },
  {
    id: "ranking",
    number: "02",
    title: "Complete Sector Ranking",
    description:
      "Compare every tracked sector using the RBR Sector Rotation Score.",
  },
  {
    id: "improving",
    number: "03",
    title: "Improving Sectors",
    description:
      "Identify sectors where relative strength and momentum are accelerating.",
  },
  {
    id: "leading",
    number: "04",
    title: "Leading Sectors",
    description:
      "See the sectors currently demonstrating the strongest market leadership.",
  },
  {
    id: "weakening",
    number: "05",
    title: "Weakening Sectors",
    description:
      "Watch sectors that remain relatively strong but are beginning to lose momentum.",
  },
  {
    id: "lagging",
    number: "06",
    title: "Lagging Sectors",
    description:
      "Monitor sectors currently showing weak relative strength and momentum.",
  },
  {
    id: "deep-dive",
    number: "07",
    title: "Sector Deep Dive",
    description:
      "Examine individual sectors with performance, momentum and rotation indicators.",
  },
  {
    id: "stocks",
    number: "08",
    title: "Stocks Driving Sector Movement",
    description:
      "See which constituent stocks are contributing most to sector movement.",
  },
  {
    id: "history",
    number: "09",
    title: "Rotation History",
    description:
      "Track how sectors have moved between rotation stages over time.",
  },
  {
    id: "performance",
    number: "10",
    title: "Historical Sector Performance",
    description:
      "Compare short and medium-term performance across Indian market sectors.",
  },
];

function getStatusClass(status) {
  switch (status) {
    case "Leading":
      return "isrt-status-leading";
    case "Improving":
      return "isrt-status-improving";
    case "Weakening":
      return "isrt-status-weakening";
    case "Lagging":
      return "isrt-status-lagging";
    default:
      return "";
  }
}

function IndiaSectorRotationTracker() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [modal, setModal] = useState(null);

  const isLoggedIn =
    CONFIG.previewAsSubscriber === true ? true : DEMO_AUTH.isLoggedIn;

  const isSubscribed =
    CONFIG.previewAsSubscriber === true ? true : DEMO_AUTH.isSubscribed;

  const lastUpdated = useMemo(() => {
    try {
      const now = new Date();

      const indiaParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
      }).formatToParts(now);

      const values = {};

      indiaParts.forEach((part) => {
        values[part.type] = part.value;
      });

      let year = Number(values.year);
      let month = Number(values.month);
      let day = Number(values.day);
      const hour = Number(values.hour);

      // Before 10 AM IST, display the previous day's scheduled update.
      if (hour < 10) {
        const previousDate = new Date(
          Date.UTC(year, month - 1, day - 1, 12, 0, 0)
        );

        const previousParts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).formatToParts(previousDate);

        const previousValues = {};

        previousParts.forEach((part) => {
          previousValues[part.type] = part.value;
        });

        year = Number(previousValues.year);
        month = Number(previousValues.month);
        day = Number(previousValues.day);
      }

      const dateForDisplay = new Date(
        Date.UTC(year, month - 1, day, 4, 30, 0)
      );

      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(dateForDisplay);
    } catch {
      return "Latest scheduled update";
    }
  }, []);

  const leading = sectorData.filter((item) => item.status === "Leading");
  const improving = sectorData.filter((item) => item.status === "Improving");
  const weakening = sectorData.filter((item) => item.status === "Weakening");
  const lagging = sectorData.filter((item) => item.status === "Lagging");

  const handleSectionClick = (sectionId) => {
    if (!isLoggedIn) {
      setModal("login");
      return;
    }

    if (!isSubscribed) {
      setModal("subscribe");
      return;
    }

    setExpandedSection((current) =>
      current === sectionId ? null : sectionId
    );
  };

  const handleSubscribeClick = () => {
    if (!isLoggedIn) {
      setModal("login");
      return;
    }

    setModal("subscribe");
  };

  const closeModal = () => {
    setModal(null);
  };

  const renderSectorCards = (items) => (
    <div className="isrt-sector-list">
      {items.map((item) => (
        <div className="isrt-sector-detail-card" key={item.sector}>
          <div>
            <span className={`isrt-status ${getStatusClass(item.status)}`}>
              {item.status}
            </span>

            <h4>{item.sector}</h4>

            <p>
              Momentum: <strong>{item.momentum}</strong>
            </p>
          </div>

          <div className="isrt-score-circle">
            <strong>{item.score}</strong>
            <span>Score</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderRankingTable = (items = sectorData) => (
    <div className="isrt-table-scroll">
      <table className="isrt-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Sector</th>
            <th>Status</th>
            <th>Score</th>
            <th>1 Week</th>
            <th>1 Month</th>
            <th>3 Months</th>
            <th>Momentum</th>
          </tr>
        </thead>

        <tbody>
          {[...items]
            .sort((a, b) => b.score - a.score)
            .map((item, index) => (
              <tr key={item.sector}>
                <td>#{index + 1}</td>

                <td>
                  <strong>{item.sector}</strong>
                </td>

                <td>
                  <span className={`isrt-status ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>

                <td>
                  <div className="isrt-score-cell">
                    <strong>{item.score}</strong>

                    <div className="isrt-score-track">
                      <div
                        className="isrt-score-fill"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td>{item.oneWeek}</td>
                <td>{item.oneMonth}</td>
                <td>{item.threeMonth}</td>
                <td>{item.momentum}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case "rotation-map":
        return (
          <div className="isrt-rotation-grid">
            <div className="isrt-quadrant isrt-q-improving">
              <div className="isrt-quadrant-label">IMPROVING</div>

              <p>
                Relative strength is below leadership levels, but momentum is
                improving.
              </p>

              <div className="isrt-chip-wrap">
                {improving.map((item) => (
                  <span key={item.sector}>{item.shortName}</span>
                ))}
              </div>
            </div>

            <div className="isrt-quadrant isrt-q-leading">
              <div className="isrt-quadrant-label">LEADING</div>

              <p>
                Strong relative strength combined with positive market
                momentum.
              </p>

              <div className="isrt-chip-wrap">
                {leading.map((item) => (
                  <span key={item.sector}>{item.shortName}</span>
                ))}
              </div>
            </div>

            <div className="isrt-quadrant isrt-q-lagging">
              <div className="isrt-quadrant-label">LAGGING</div>

              <p>
                Weak relative strength with comparatively weak momentum.
              </p>

              <div className="isrt-chip-wrap">
                {lagging.map((item) => (
                  <span key={item.sector}>{item.shortName}</span>
                ))}
              </div>
            </div>

            <div className="isrt-quadrant isrt-q-weakening">
              <div className="isrt-quadrant-label">WEAKENING</div>

              <p>
                Stronger sectors that are beginning to lose momentum.
              </p>

              <div className="isrt-chip-wrap">
                {weakening.map((item) => (
                  <span key={item.sector}>{item.shortName}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case "ranking":
        return renderRankingTable();

      case "improving":
        return renderSectorCards(improving);

      case "leading":
        return renderSectorCards(leading);

      case "weakening":
        return renderSectorCards(weakening);

      case "lagging":
        return renderSectorCards(lagging);

      case "deep-dive":
        return (
          <div>
            <div className="isrt-deep-dive-header">
              <div>
                <span className="isrt-small-label">SELECTED SECTOR</span>
                <h3>Nifty IT</h3>
                <p>
                  Currently showing strengthening momentum and approaching
                  market leadership.
                </p>
              </div>

              <div className="isrt-large-score">
                <strong>79</strong>
                <span>Rotation Score</span>
              </div>
            </div>

            <div className="isrt-stat-grid">
              <div>
                <span>Status</span>
                <strong>Improving</strong>
              </div>

              <div>
                <span>1 Week</span>
                <strong>+4.2%</strong>
              </div>

              <div>
                <span>1 Month</span>
                <strong>+6.7%</strong>
              </div>

              <div>
                <span>3 Months</span>
                <strong>+3.9%</strong>
              </div>

              <div>
                <span>Momentum</span>
                <strong>Accelerating</strong>
              </div>

              <div>
                <span>Score Change</span>
                <strong>+9</strong>
              </div>
            </div>
          </div>
        );

      case "stocks":
        return (
          <div className="isrt-stock-groups">
            {Object.entries(stockDrivers).map(([sector, stocks]) => (
              <div className="isrt-stock-group" key={sector}>
                <div className="isrt-stock-title">
                  <strong>{sector}</strong>
                  <span>Key contributors</span>
                </div>

                {stocks.map((stock, index) => (
                  <div className="isrt-stock-row" key={stock}>
                    <span>{index + 1}</span>
                    <strong>{stock}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case "history":
        return (
          <div className="isrt-history-list">
            {rotationHistory.map((item) => (
              <div className="isrt-history-row" key={item.sector}>
                <strong>{item.sector}</strong>

                <div className="isrt-history-flow">
                  <span>{item.previous}</span>
                  <b>→</b>
                  <span>{item.middle}</span>
                  <b>→</b>
                  <span>{item.current}</span>
                </div>

                <span
                  className={
                    item.direction === "Positive"
                      ? "isrt-direction-positive"
                      : "isrt-direction-negative"
                  }
                >
                  {item.direction === "Positive" ? "↑" : "↓"}{" "}
                  {item.direction}
                </span>
              </div>
            ))}
          </div>
        );

      case "performance":
        return renderRankingTable();

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        .isrt-page {
          --ink: #14233b;
          --muted: #68758a;
          --line: #e6eaf0;
          --soft: #f7f9fc;
          --blue: #1769e0;
          --blue-dark: #0c4fb8;

          min-height: 100vh;
          background:
            radial-gradient(circle at 90% 4%, rgba(23, 105, 224, 0.08), transparent 27%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          color: var(--ink);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .isrt-container {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
        }

        .isrt-hero {
          padding: 74px 0 38px;
        }

        .isrt-breadcrumb {
          color: #7b8799;
          font-size: 13px;
          margin-bottom: 32px;
        }

        .isrt-breadcrumb span {
          color: var(--blue);
        }

        .isrt-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #d9e4f5;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #31527e;
          background: rgba(255,255,255,0.8);
        }

        .isrt-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #21a366;
        }

        .isrt-hero h1 {
          max-width: 850px;
          margin: 22px 0 16px;
          font-size: clamp(38px, 5vw, 66px);
          line-height: 0.99;
          letter-spacing: -0.045em;
          font-weight: 760;
        }

        .isrt-hero-lead {
          max-width: 710px;
          font-size: 19px;
          line-height: 1.65;
          color: var(--muted);
          margin: 0;
        }

        .isrt-update-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px 22px;
          margin-top: 26px;
          font-size: 13px;
        }

        .isrt-update-primary {
          font-weight: 700;
        }

        .isrt-update-secondary {
          color: var(--muted);
        }

        .isrt-sample-warning {
          margin-top: 24px;
          padding: 13px 16px;
          border-radius: 12px;
          background: #fff9e9;
          border: 1px solid #f2dda6;
          color: #725a14;
          font-size: 13px;
          line-height: 1.5;
        }

        .isrt-overview {
          padding: 16px 0 64px;
        }

        .isrt-overview-card {
          overflow: hidden;
          background: rgba(255,255,255,0.92);
          border: 1px solid var(--line);
          border-radius: 24px;
          box-shadow: 0 18px 60px rgba(29, 52, 82, 0.07);
        }

        .isrt-overview-top {
          padding: 28px 30px 22px;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .isrt-overview-top h2 {
          margin: 0;
          font-size: 22px;
          letter-spacing: -0.02em;
        }

        .isrt-overview-top p {
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 14px;
        }

        .isrt-market-pill {
          flex: 0 0 auto;
          padding: 9px 12px;
          border-radius: 999px;
          background: #edf8f2;
          color: #23724d;
          font-size: 12px;
          font-weight: 700;
        }

        .isrt-overview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .isrt-overview-column {
          padding: 26px 25px 28px;
          border-right: 1px solid var(--line);
        }

        .isrt-overview-column:last-child {
          border-right: 0;
        }

        .isrt-status-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 20px;
        }

        .isrt-status-title strong {
          font-size: 13px;
          letter-spacing: 0.04em;
        }

        .isrt-count {
          font-size: 12px;
          color: var(--muted);
        }

        .isrt-sector-public {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f0f2f6;
        }

        .isrt-sector-public:last-child {
          border-bottom: 0;
        }

        .isrt-sector-public span:first-child {
          font-size: 14px;
          font-weight: 650;
        }

        .isrt-change-positive {
          color: #1e8a57;
          font-size: 12px;
        }

        .isrt-change-negative {
          color: #c65b57;
          font-size: 12px;
        }

        .isrt-headlines {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--line);
        }

        .isrt-headline {
          padding: 22px 28px;
          border-right: 1px solid var(--line);
        }

        .isrt-headline:last-child {
          border-right: 0;
        }

        .isrt-headline span {
          display: block;
          color: var(--muted);
          font-size: 12px;
          margin-bottom: 7px;
        }

        .isrt-headline strong {
          font-size: 17px;
        }

        .isrt-premium-section {
          padding: 20px 0 76px;
        }

        .isrt-section-heading {
          max-width: 680px;
          margin-bottom: 30px;
        }

        .isrt-section-heading span {
          display: block;
          margin-bottom: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--blue);
        }

        .isrt-section-heading h2 {
          margin: 0 0 12px;
          font-size: clamp(29px, 4vw, 42px);
          letter-spacing: -0.035em;
        }

        .isrt-section-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.6;
        }

        .isrt-accordion-list {
          border-top: 1px solid var(--line);
        }

        .isrt-accordion {
          border-bottom: 1px solid var(--line);
        }

        .isrt-accordion-button {
          width: 100%;
          padding: 25px 4px;
          border: 0;
          background: transparent;
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          text-align: left;
          cursor: pointer;
          color: inherit;
        }

        .isrt-accordion-button:hover .isrt-accordion-title {
          color: var(--blue);
        }

        .isrt-accordion-number {
          color: #a3abba;
          font-size: 12px;
          font-weight: 700;
        }

        .isrt-accordion-title {
          display: block;
          font-size: 18px;
          font-weight: 700;
          transition: color 0.2s ease;
        }

        .isrt-accordion-description {
          display: block;
          margin-top: 5px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .isrt-lock {
          min-width: 110px;
          text-align: right;
          font-size: 12px;
          font-weight: 700;
          color: #7a8597;
        }

        .isrt-plus {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--line);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          color: #677386;
        }

        .isrt-accordion-content {
          padding: 4px 4px 32px 74px;
        }

        .isrt-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .isrt-status-leading {
          background: #eaf8f0;
          color: #24744c;
        }

        .isrt-status-improving {
          background: #eaf2ff;
          color: #2865b7;
        }

        .isrt-status-weakening {
          background: #fff3df;
          color: #9a671a;
        }

        .isrt-status-lagging {
          background: #fcecec;
          color: #ad4d4d;
        }

        .isrt-rotation-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border: 1px solid var(--line);
          border-radius: 18px;
          overflow: hidden;
          background: white;
        }

        .isrt-quadrant {
          min-height: 215px;
          padding: 24px;
          border-right: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }

        .isrt-quadrant:nth-child(2n) {
          border-right: 0;
        }

        .isrt-quadrant:nth-child(3),
        .isrt-quadrant:nth-child(4) {
          border-bottom: 0;
        }

        .isrt-quadrant-label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.07em;
        }

        .isrt-quadrant p {
          max-width: 390px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.6;
        }

        .isrt-chip-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 22px;
        }

        .isrt-chip-wrap span {
          padding: 7px 10px;
          background: #f3f5f8;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
        }

        .isrt-q-leading {
          background: #fbfffc;
        }

        .isrt-q-improving {
          background: #fbfdff;
        }

        .isrt-q-weakening {
          background: #fffdfa;
        }

        .isrt-q-lagging {
          background: #fffafa;
        }

        .isrt-table-scroll {
          overflow-x: auto;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: white;
        }

        .isrt-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }

        .isrt-table th {
          padding: 13px 15px;
          background: #f7f8fa;
          color: #727d8d;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-align: left;
          white-space: nowrap;
        }

        .isrt-table td {
          padding: 15px;
          border-top: 1px solid #edf0f4;
          font-size: 13px;
          white-space: nowrap;
        }

        .isrt-score-cell {
          min-width: 105px;
        }

        .isrt-score-track {
          width: 76px;
          height: 4px;
          overflow: hidden;
          background: #e9edf2;
          border-radius: 10px;
          margin-top: 6px;
        }

        .isrt-score-fill {
          height: 100%;
          border-radius: inherit;
          background: #4c78b9;
        }

        .isrt-sector-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .isrt-sector-detail-card {
          padding: 20px;
          border: 1px solid var(--line);
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .isrt-sector-detail-card h4 {
          margin: 11px 0 6px;
          font-size: 17px;
        }

        .isrt-sector-detail-card p {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
        }

        .isrt-score-circle {
          width: 60px;
          height: 60px;
          flex: 0 0 60px;
          border: 1px solid #dce3ed;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .isrt-score-circle strong {
          font-size: 19px;
        }

        .isrt-score-circle span {
          font-size: 9px;
          color: var(--muted);
        }

        .isrt-deep-dive-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          padding: 24px;
          border: 1px solid var(--line);
          border-radius: 16px 16px 0 0;
          background: white;
        }

        .isrt-small-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--blue);
        }

        .isrt-deep-dive-header h3 {
          margin: 7px 0;
          font-size: 25px;
        }

        .isrt-deep-dive-header p {
          color: var(--muted);
          margin: 0;
          font-size: 13px;
        }

        .isrt-large-score {
          flex: 0 0 auto;
          text-align: center;
        }

        .isrt-large-score strong {
          display: block;
          font-size: 35px;
        }

        .isrt-large-score span {
          color: var(--muted);
          font-size: 10px;
        }

        .isrt-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid var(--line);
          border-top: 0;
          border-radius: 0 0 16px 16px;
          background: white;
        }

        .isrt-stat-grid > div {
          padding: 18px;
          border-right: 1px solid var(--line);
          border-top: 1px solid var(--line);
        }

        .isrt-stat-grid > div:nth-child(3n) {
          border-right: 0;
        }

        .isrt-stat-grid span,
        .isrt-stat-grid strong {
          display: block;
        }

        .isrt-stat-grid span {
          color: var(--muted);
          font-size: 11px;
          margin-bottom: 5px;
        }

        .isrt-stat-grid strong {
          font-size: 15px;
        }

        .isrt-stock-groups {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .isrt-stock-group {
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: white;
        }

        .isrt-stock-title {
          padding: 16px;
          background: #f7f9fb;
        }

        .isrt-stock-title strong,
        .isrt-stock-title span {
          display: block;
        }

        .isrt-stock-title span {
          margin-top: 3px;
          color: var(--muted);
          font-size: 10px;
        }

        .isrt-stock-row {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid var(--line);
          font-size: 12px;
        }

        .isrt-stock-row span {
          color: #9aa3b2;
        }

        .isrt-history-list {
          border: 1px solid var(--line);
          border-radius: 14px;
          background: white;
          overflow: hidden;
        }

        .isrt-history-row {
          display: grid;
          grid-template-columns: 100px 1fr 110px;
          align-items: center;
          gap: 16px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
          font-size: 12px;
        }

        .isrt-history-row:last-child {
          border-bottom: 0;
        }

        .isrt-history-flow {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #596678;
        }

        .isrt-history-flow b {
          color: #adb4bf;
        }

        .isrt-direction-positive {
          color: #228354;
          font-weight: 700;
        }

        .isrt-direction-negative {
          color: #bb5151;
          font-weight: 700;
        }

        .isrt-subscription-box {
          margin-top: 54px;
          padding: 38px;
          border-radius: 22px;
          background: #13233d;
          color: white;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 30px;
        }

        .isrt-subscription-box h3 {
          margin: 0 0 8px;
          font-size: 25px;
          letter-spacing: -0.02em;
        }

        .isrt-subscription-box p {
          max-width: 650px;
          margin: 0;
          color: #b9c5d6;
          line-height: 1.6;
          font-size: 14px;
        }

        .isrt-price {
          text-align: right;
        }

        .isrt-price strong {
          font-size: 33px;
          letter-spacing: -0.03em;
        }

        .isrt-price span {
          font-size: 12px;
          color: #b9c5d6;
        }

        .isrt-subscribe-button {
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 11px 18px;
          border: 0;
          border-radius: 9px;
          background: white;
          color: #13233d;
          font-weight: 800;
          cursor: pointer;
        }

        .isrt-methodology {
          padding: 52px 0 90px;
          border-top: 1px solid var(--line);
        }

        .isrt-methodology-grid {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 55px;
        }

        .isrt-methodology h3 {
          margin: 0;
          font-size: 23px;
        }

        .isrt-methodology p {
          margin: 0 0 14px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .isrt-disclaimer {
          margin-top: 24px !important;
          padding-top: 18px;
          border-top: 1px solid var(--line);
          font-size: 11px !important;
          color: #8b95a5 !important;
        }

        .isrt-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(10, 22, 40, 0.58);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .isrt-modal {
          width: min(440px, 100%);
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 30px 100px rgba(0,0,0,0.26);
        }

        .isrt-modal-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #edf4ff;
          color: var(--blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .isrt-modal h3 {
          margin: 20px 0 8px;
          font-size: 24px;
        }

        .isrt-modal p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .isrt-modal-price {
          margin-top: 18px;
          padding: 15px;
          background: var(--soft);
          border-radius: 11px;
        }

        .isrt-modal-price strong {
          font-size: 22px;
        }

        .isrt-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }

        .isrt-primary-button,
        .isrt-secondary-button {
          flex: 1;
          border-radius: 9px;
          padding: 11px 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .isrt-primary-button {
          border: 1px solid var(--blue);
          background: var(--blue);
          color: white;
        }

        .isrt-secondary-button {
          border: 1px solid var(--line);
          background: white;
          color: var(--ink);
        }

        .isrt-coming {
          margin-top: 13px;
          color: #94691e !important;
          font-size: 11px !important;
        }

        @media (max-width: 900px) {
          .isrt-overview-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .isrt-overview-column:nth-child(2) {
            border-right: 0;
          }

          .isrt-overview-column:nth-child(-n+2) {
            border-bottom: 1px solid var(--line);
          }

          .isrt-headlines {
            grid-template-columns: 1fr;
          }

          .isrt-headline {
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .isrt-headline:last-child {
            border-bottom: 0;
          }

          .isrt-subscription-box {
            grid-template-columns: 1fr;
          }

          .isrt-price {
            text-align: left;
          }

          .isrt-methodology-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .isrt-container {
            width: min(100% - 24px, 1180px);
          }

          .isrt-hero {
            padding-top: 42px;
          }

          .isrt-hero h1 {
            font-size: 42px;
          }

          .isrt-hero-lead {
            font-size: 16px;
          }

          .isrt-overview-top {
            padding: 22px 18px;
            flex-direction: column;
          }

          .isrt-overview-grid {
            grid-template-columns: 1fr;
          }

          .isrt-overview-column {
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .isrt-overview-column:last-child {
            border-bottom: 0;
          }

          .isrt-accordion-button {
            grid-template-columns: 38px minmax(0, 1fr) auto;
          }

          .isrt-accordion-description {
            display: none;
          }

          .isrt-lock {
            min-width: 28px;
            font-size: 0;
          }

          .isrt-lock::after {
            content: "🔒";
            font-size: 13px;
          }

          .isrt-accordion-content {
            padding-left: 0;
          }

          .isrt-rotation-grid {
            grid-template-columns: 1fr;
          }

          .isrt-quadrant {
            border-right: 0;
            border-bottom: 1px solid var(--line) !important;
          }

          .isrt-quadrant:last-child {
            border-bottom: 0 !important;
          }

          .isrt-sector-list,
          .isrt-stock-groups {
            grid-template-columns: 1fr;
          }

          .isrt-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .isrt-stat-grid > div:nth-child(3n) {
            border-right: 1px solid var(--line);
          }

          .isrt-stat-grid > div:nth-child(2n) {
            border-right: 0;
          }

          .isrt-history-row {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .isrt-history-flow {
            flex-wrap: wrap;
          }

          .isrt-subscription-box {
            padding: 27px 22px;
          }
        }
      `}</style>

      <main className="isrt-page">
        <section className="isrt-hero">
          <div className="isrt-container">
            <div className="isrt-breadcrumb">
              Rajan Business Reports / <span>India Sector Rotation Tracker</span>
            </div>

            <div className="isrt-eyebrow">
              <span className="isrt-live-dot" />
              INDIA MARKET INTELLIGENCE
            </div>

            <h1>India Sector Rotation Tracker</h1>

            <p className="isrt-hero-lead">
              Follow how market leadership is moving across Indian stock market
              sectors. Identify sectors that are leading, improving, weakening
              or lagging.
            </p>

            <div className="isrt-update-row">
              <span className="isrt-update-primary">
                Updates every day at 10:00 AM IST
              </span>

              <span className="isrt-update-secondary">
                Last scheduled update: {lastUpdated}, 10:00 AM IST
              </span>
            </div>

            {CONFIG.showSampleDataWarning && (
              <div className="isrt-sample-warning">
                <strong>Preview version:</strong> The sector values displayed
                on this page are currently sample data for interface testing.
                Live market data will be connected before the tracker is
                officially launched.
              </div>
            )}
          </div>
        </section>

        <section className="isrt-overview">
          <div className="isrt-container">
            <div className="isrt-overview-card">
              <div className="isrt-overview-top">
                <div>
                  <h2>Today's Sector Rotation Overview</h2>
                  <p>
                    A quick view of current relative strength and momentum
                    across major Indian market sectors.
                  </p>
                </div>

                <div className="isrt-market-pill">Market view: Positive</div>
              </div>

              <div className="isrt-overview-grid">
                <div className="isrt-overview-column">
                  <div className="isrt-status-title">
                    <strong>LEADING</strong>
                    <span className="isrt-count">{leading.length} sectors</span>
                  </div>

                  {leading.map((item) => (
                    <div className="isrt-sector-public" key={item.sector}>
                      <span>{item.shortName}</span>
                      <span className="isrt-change-positive">
                        ↑ {item.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="isrt-overview-column">
                  <div className="isrt-status-title">
                    <strong>IMPROVING</strong>
                    <span className="isrt-count">
                      {improving.length} sectors
                    </span>
                  </div>

                  {improving.map((item) => (
                    <div className="isrt-sector-public" key={item.sector}>
                      <span>{item.shortName}</span>
                      <span className="isrt-change-positive">
                        ↑ {item.change}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="isrt-overview-column">
                  <div className="isrt-status-title">
                    <strong>WEAKENING</strong>
                    <span className="isrt-count">
                      {weakening.length} sectors
                    </span>
                  </div>

                  {weakening.map((item) => (
                    <div className="isrt-sector-public" key={item.sector}>
                      <span>{item.shortName}</span>
                      <span className="isrt-change-negative">
                        ↓ {item.change.replace("-", "")}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="isrt-overview-column">
                  <div className="isrt-status-title">
                    <strong>LAGGING</strong>
                    <span className="isrt-count">{lagging.length} sectors</span>
                  </div>

                  {lagging.map((item) => (
                    <div className="isrt-sector-public" key={item.sector}>
                      <span>{item.shortName}</span>
                      <span className="isrt-change-negative">
                        ↓ {item.change.replace("-", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="isrt-headlines">
                <div className="isrt-headline">
                  <span>Strongest sector</span>
                  <strong>Auto</strong>
                </div>

                <div className="isrt-headline">
                  <span>Fastest improving</span>
                  <strong>Information Technology</strong>
                </div>

                <div className="isrt-headline">
                  <span>Largest momentum decline</span>
                  <strong>Pharma</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="isrt-premium-section">
          <div className="isrt-container">
            <div className="isrt-section-heading">
              <span>DETAILED SECTOR INTELLIGENCE</span>

              <h2>Go beyond today's overview.</h2>

              <p>
                Subscribers can open each section to study sector rankings,
                rotation patterns, momentum changes, constituent stocks and
                historical movement.
              </p>
            </div>

            <div className="isrt-accordion-list">
              {sections.map((section) => {
                const expanded = expandedSection === section.id;
                const unlocked = isLoggedIn && isSubscribed;

                return (
                  <div className="isrt-accordion" key={section.id}>
                    <button
                      className="isrt-accordion-button"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      <span className="isrt-accordion-number">
                        {section.number}
                      </span>

                      <span>
                        <span className="isrt-accordion-title">
                          {section.title}
                        </span>

                        <span className="isrt-accordion-description">
                          {section.description}
                        </span>
                      </span>

                      {unlocked ? (
                        <span className="isrt-plus">
                          {expanded ? "−" : "+"}
                        </span>
                      ) : (
                        <span className="isrt-lock">🔒 Subscriber access</span>
                      )}
                    </button>

                    {expanded && unlocked && (
                      <div className="isrt-accordion-content">
                        {renderSectionContent(section.id)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isSubscribed && (
              <div className="isrt-subscription-box">
                <div>
                  <h3>Unlock the complete tracker</h3>

                  <p>
                    Access complete sector rankings, rotation analysis,
                    momentum changes, stock contributors and historical
                    movement across Indian market sectors.
                  </p>
                </div>

                <div className="isrt-price">
                  <div>
                    <strong>₹199</strong>
                    <span> / month</span>
                  </div>

                  <button
                    className="isrt-subscribe-button"
                    type="button"
                    onClick={handleSubscribeClick}
                  >
                    Get Full Access
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="isrt-methodology">
          <div className="isrt-container">
            <div className="isrt-methodology-grid">
              <div>
                <h3>How to read the tracker</h3>
              </div>

              <div>
                <p>
                  <strong>Leading</strong> sectors demonstrate comparatively
                  strong relative strength and momentum.{" "}
                  <strong>Improving</strong> sectors are gaining momentum and
                  may be moving toward leadership.
                </p>

                <p>
                  <strong>Weakening</strong> sectors remain relatively strong
                  but are losing momentum. <strong>Lagging</strong> sectors
                  demonstrate comparatively weaker relative strength and
                  momentum.
                </p>

                <p className="isrt-disclaimer">
                  This tracker is provided for informational and research
                  purposes only. It does not constitute investment advice,
                  securities recommendations or a solicitation to buy or sell
                  securities. Market conditions can change rapidly and past
                  performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {modal === "login" && (
        <div className="isrt-modal-backdrop" onClick={closeModal}>
          <div
            className="isrt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="isrt-modal-icon">🔒</div>

            <h3>Sign in to continue</h3>

            <p>
              Detailed India Sector Rotation Tracker sections are available to
              signed-in RBR users with an active tracker subscription.
            </p>

            <div className="isrt-modal-actions">
              <button
                type="button"
                className="isrt-secondary-button"
                onClick={closeModal}
              >
                Not now
              </button>

              <button
                type="button"
                className="isrt-primary-button"
                onClick={() => {
                  /*
                    LATER:
                    Replace this with your existing RBR login function,
                    login modal, or navigation.
                  */
                  closeModal();
                }}
              >
                Sign in
              </button>
            </div>

            <p className="isrt-coming">
              Login connection will be wired to the existing RBR user system in
              the next step.
            </p>
          </div>
        </div>
      )}

      {modal === "subscribe" && (
        <div className="isrt-modal-backdrop" onClick={closeModal}>
          <div
            className="isrt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="isrt-modal-icon">↗</div>

            <h3>India Sector Rotation Tracker</h3>

            <p>
              Subscribe for access to all detailed tracker sections and daily
              sector intelligence.
            </p>

            <div className="isrt-modal-price">
              <strong>₹199</strong> / month
            </div>

            <div className="isrt-modal-actions">
              <button
                type="button"
                className="isrt-secondary-button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="isrt-primary-button"
                onClick={() => {
                  /*
                    LATER:
                    Connect this button to the Razorpay subscription flow.
                  */

                  if (!CONFIG.subscriptionLive) {
                    return;
                  }
                }}
              >
                Subscribe
              </button>
            </div>

            {!CONFIG.subscriptionLive && (
              <p className="isrt-coming">
                Subscription checkout is not active yet. We will connect this
                to Razorpay before enabling paid access.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default IndiaSectorRotationTracker;

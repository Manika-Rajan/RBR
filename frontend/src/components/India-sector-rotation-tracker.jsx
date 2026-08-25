import React, { useMemo, useState } from "react";

/*
  ============================================================
  RBR - INDIA SECTOR ROTATION TRACKER
  ============================================================

  DESIGN DIRECTION
  - Familiar Indian financial-data website layout
  - Compact header
  - Public market overview
  - Horizontal tabs
  - Heatmap / market tiles
  - Dense financial tables
  - Premium data teased rather than hidden behind large locks
  - No additional npm packages required

  CURRENT STATUS
  - Data below is SAMPLE DATA.
  - Login integration will be connected later.
  - ₹199/month subscription integration will be connected later.
  - Daily live data API will be connected later.

  DEVELOPMENT:
  Set previewAsSubscriber = true to inspect all premium sections.
*/

const CONFIG = {
  previewAsSubscriber: false,
  showSampleDataNotice: true,
  monthlyPrice: 199,
};

/*
  TEMPORARY AUTH STATE

  Later this will be replaced by your existing RBR Store:
  state.userInfo.isLogin

  and subscription entitlement returned from backend.
*/
const TEMP_USER_STATE = {
  isLoggedIn: false,
  hasActiveSubscription: false,
};

const SECTORS = [
  {
    id: "auto",
    name: "Nifty Auto",
    shortName: "Auto",
    status: "Leading",
    score: 91,
    scoreChange: 5,
    oneDay: 1.24,
    fiveDay: 3.82,
    oneMonth: 8.41,
    threeMonth: 14.22,
    sixMonth: 19.14,
    oneYear: 28.31,
    momentum: "Strong",
    relativeStrength: "Very Strong",
    breadth: "Positive",
    advanceDecline: "11 / 4",
    pe: "23.8",
    marketCap: "₹17.4L Cr",
    sparkline: [42, 46, 44, 50, 56, 55, 61, 65, 71, 76, 82, 91],
  },
  {
    id: "metal",
    name: "Nifty Metal",
    shortName: "Metal",
    status: "Leading",
    score: 86,
    scoreChange: 2,
    oneDay: 0.87,
    fiveDay: 2.91,
    oneMonth: 7.12,
    threeMonth: 11.83,
    sixMonth: 15.42,
    oneYear: 22.18,
    momentum: "Strong",
    relativeStrength: "Strong",
    breadth: "Positive",
    advanceDecline: "10 / 5",
    pe: "18.6",
    marketCap: "₹14.1L Cr",
    sparkline: [48, 50, 54, 52, 58, 61, 63, 69, 72, 78, 81, 86],
  },
  {
    id: "it",
    name: "Nifty IT",
    shortName: "IT",
    status: "Improving",
    score: 79,
    scoreChange: 9,
    oneDay: 1.71,
    fiveDay: 4.19,
    oneMonth: 6.68,
    threeMonth: 3.94,
    sixMonth: 8.22,
    oneYear: 11.41,
    momentum: "Accelerating",
    relativeStrength: "Improving",
    breadth: "Positive",
    advanceDecline: "8 / 2",
    pe: "29.1",
    marketCap: "₹39.2L Cr",
    sparkline: [37, 35, 39, 41, 44, 49, 53, 57, 62, 68, 70, 79],
  },
  {
    id: "realty",
    name: "Nifty Realty",
    shortName: "Realty",
    status: "Improving",
    score: 74,
    scoreChange: 7,
    oneDay: 1.12,
    fiveDay: 3.13,
    oneMonth: 5.53,
    threeMonth: 2.84,
    sixMonth: 10.13,
    oneYear: 17.51,
    momentum: "Improving",
    relativeStrength: "Improving",
    breadth: "Positive",
    advanceDecline: "7 / 3",
    pe: "34.4",
    marketCap: "₹7.8L Cr",
    sparkline: [40, 38, 39, 43, 45, 48, 52, 57, 61, 65, 67, 74],
  },
  {
    id: "bank",
    name: "Nifty Bank",
    shortName: "Bank",
    status: "Improving",
    score: 69,
    scoreChange: 3,
    oneDay: 0.63,
    fiveDay: 1.84,
    oneMonth: 4.23,
    threeMonth: 6.11,
    sixMonth: 9.44,
    oneYear: 14.92,
    momentum: "Improving",
    relativeStrength: "Neutral → Stronger",
    breadth: "Positive",
    advanceDecline: "8 / 4",
    pe: "16.8",
    marketCap: "₹41.7L Cr",
    sparkline: [45, 47, 46, 48, 52, 54, 55, 58, 61, 63, 66, 69],
  },
  {
    id: "financial-services",
    name: "Nifty Financial Services",
    shortName: "Financials",
    status: "Improving",
    score: 66,
    scoreChange: 2,
    oneDay: 0.48,
    fiveDay: 1.52,
    oneMonth: 3.91,
    threeMonth: 5.88,
    sixMonth: 8.71,
    oneYear: 13.66,
    momentum: "Improving",
    relativeStrength: "Improving",
    breadth: "Positive",
    advanceDecline: "13 / 7",
    pe: "18.1",
    marketCap: "₹57.5L Cr",
    sparkline: [46, 45, 48, 49, 52, 55, 54, 57, 60, 62, 64, 66],
  },
  {
    id: "pharma",
    name: "Nifty Pharma",
    shortName: "Pharma",
    status: "Weakening",
    score: 57,
    scoreChange: -8,
    oneDay: -0.71,
    fiveDay: -1.34,
    oneMonth: 1.81,
    threeMonth: 7.19,
    sixMonth: 13.32,
    oneYear: 20.43,
    momentum: "Falling",
    relativeStrength: "Strong but Falling",
    breadth: "Mixed",
    advanceDecline: "8 / 12",
    pe: "36.7",
    marketCap: "₹15.9L Cr",
    sparkline: [81, 84, 82, 79, 77, 75, 72, 69, 66, 63, 60, 57],
  },
  {
    id: "fmcg",
    name: "Nifty FMCG",
    shortName: "FMCG",
    status: "Weakening",
    score: 51,
    scoreChange: -5,
    oneDay: -0.32,
    fiveDay: -0.81,
    oneMonth: 0.61,
    threeMonth: 4.47,
    sixMonth: 6.23,
    oneYear: 9.85,
    momentum: "Falling",
    relativeStrength: "Weakening",
    breadth: "Mixed",
    advanceDecline: "7 / 8",
    pe: "38.2",
    marketCap: "₹20.1L Cr",
    sparkline: [69, 71, 69, 66, 64, 63, 61, 58, 56, 55, 53, 51],
  },
  {
    id: "psu-bank",
    name: "Nifty PSU Bank",
    shortName: "PSU Bank",
    status: "Weakening",
    score: 48,
    scoreChange: -3,
    oneDay: -0.56,
    fiveDay: -1.22,
    oneMonth: 1.38,
    threeMonth: 4.94,
    sixMonth: 11.27,
    oneYear: 17.16,
    momentum: "Cooling",
    relativeStrength: "Weakening",
    breadth: "Mixed",
    advanceDecline: "6 / 6",
    pe: "9.7",
    marketCap: "₹6.9L Cr",
    sparkline: [65, 67, 66, 63, 61, 60, 57, 55, 53, 51, 50, 48],
  },
  {
    id: "energy",
    name: "Nifty Energy",
    shortName: "Energy",
    status: "Lagging",
    score: 38,
    scoreChange: -4,
    oneDay: -0.91,
    fiveDay: -2.08,
    oneMonth: -3.37,
    threeMonth: -1.91,
    sixMonth: 3.42,
    oneYear: 6.12,
    momentum: "Weak",
    relativeStrength: "Weak",
    breadth: "Negative",
    advanceDecline: "4 / 16",
    pe: "14.9",
    marketCap: "₹31.6L Cr",
    sparkline: [58, 56, 54, 51, 49, 47, 46, 43, 42, 40, 39, 38],
  },
  {
    id: "media",
    name: "Nifty Media",
    shortName: "Media",
    status: "Lagging",
    score: 31,
    scoreChange: -2,
    oneDay: -1.17,
    fiveDay: -2.81,
    oneMonth: -5.19,
    threeMonth: -7.08,
    sixMonth: -4.72,
    oneYear: -8.43,
    momentum: "Weak",
    relativeStrength: "Very Weak",
    breadth: "Negative",
    advanceDecline: "2 / 8",
    pe: "22.3",
    marketCap: "₹1.4L Cr",
    sparkline: [53, 51, 48, 46, 44, 42, 39, 37, 36, 34, 33, 31],
  },
  {
    id: "consumer-durables",
    name: "Nifty Consumer Durables",
    shortName: "Consumer",
    status: "Lagging",
    score: 35,
    scoreChange: 1,
    oneDay: 0.11,
    fiveDay: -1.43,
    oneMonth: -2.21,
    threeMonth: -0.81,
    sixMonth: 4.18,
    oneYear: 7.42,
    momentum: "Stabilising",
    relativeStrength: "Weak",
    breadth: "Mixed",
    advanceDecline: "6 / 9",
    pe: "54.1",
    marketCap: "₹8.2L Cr",
    sparkline: [47, 45, 43, 41, 39, 37, 35, 34, 33, 34, 34, 35],
  },
];

const ROTATION_HISTORY = [
  {
    sector: "IT",
    d5: "Lagging",
    d4: "Improving",
    d3: "Improving",
    d2: "Improving",
    current: "Improving",
    score: "+9",
  },
  {
    sector: "Auto",
    d5: "Improving",
    d4: "Leading",
    d3: "Leading",
    d2: "Leading",
    current: "Leading",
    score: "+5",
  },
  {
    sector: "Metal",
    d5: "Improving",
    d4: "Leading",
    d3: "Leading",
    d2: "Leading",
    current: "Leading",
    score: "+2",
  },
  {
    sector: "Pharma",
    d5: "Leading",
    d4: "Leading",
    d3: "Weakening",
    d2: "Weakening",
    current: "Weakening",
    score: "-8",
  },
  {
    sector: "Realty",
    d5: "Lagging",
    d4: "Improving",
    d3: "Improving",
    d2: "Improving",
    current: "Improving",
    score: "+7",
  },
];

const STOCK_DRIVERS = {
  Auto: [
    { name: "Mahindra & Mahindra", contribution: "+1.7%", signal: "Positive" },
    { name: "Maruti Suzuki", contribution: "+1.2%", signal: "Positive" },
    { name: "Bajaj Auto", contribution: "+0.9%", signal: "Positive" },
    { name: "Eicher Motors", contribution: "+0.6%", signal: "Positive" },
  ],
  IT: [
    { name: "Infosys", contribution: "+1.8%", signal: "Positive" },
    { name: "TCS", contribution: "+1.4%", signal: "Positive" },
    { name: "HCL Technologies", contribution: "+1.1%", signal: "Positive" },
    { name: "Tech Mahindra", contribution: "+0.8%", signal: "Positive" },
  ],
  Metal: [
    { name: "Tata Steel", contribution: "+1.3%", signal: "Positive" },
    { name: "Hindalco", contribution: "+1.1%", signal: "Positive" },
    { name: "JSW Steel", contribution: "+0.8%", signal: "Positive" },
    { name: "Vedanta", contribution: "+0.6%", signal: "Positive" },
  ],
};

const TABS = [
  { id: "overview", label: "Overview", premium: false },
  { id: "rotation", label: "Rotation Map", premium: true },
  { id: "ranking", label: "Sector Ranking", premium: true },
  { id: "performance", label: "Performance", premium: true },
  { id: "details", label: "Sector Details", premium: true },
];

function formatPercent(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function getMovementClass(value) {
  if (value > 0) return "rbr-srt-positive";
  if (value < 0) return "rbr-srt-negative";
  return "rbr-srt-neutral";
}

function getStatusClass(status) {
  return `rbr-srt-status-${status.toLowerCase()}`;
}

function Sparkline({ values, status }) {
  const width = 120;
  const height = 38;
  const padding = 3;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      const x =
        padding +
        (index / (values.length - 1)) * (width - padding * 2);

      const y =
        height -
        padding -
        ((value - min) / range) * (height - padding * 2);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className={`rbr-srt-sparkline ${getStatusClass(status)}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" strokeWidth="2.2" />
    </svg>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`rbr-srt-status-badge ${getStatusClass(status)}`}>
      <span className="rbr-srt-status-dot" />
      {status}
    </span>
  );
}

function IndiaSectorRotationTracker() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("1M");
  const [heatmapMetric, setHeatmapMetric] = useState("rotation");
  const [selectedSectorId, setSelectedSectorId] = useState("it");
  const [modal, setModal] = useState(null);

  const isLoggedIn = CONFIG.previewAsSubscriber
    ? true
    : TEMP_USER_STATE.isLoggedIn;

  const hasSubscription = CONFIG.previewAsSubscriber
    ? true
    : TEMP_USER_STATE.hasActiveSubscription;

  const sortedSectors = useMemo(
    () => [...SECTORS].sort((a, b) => b.score - a.score),
    []
  );

  const selectedSector =
    SECTORS.find((sector) => sector.id === selectedSectorId) || SECTORS[0];

  const leading = SECTORS.filter((sector) => sector.status === "Leading");
  const improving = SECTORS.filter((sector) => sector.status === "Improving");
  const weakening = SECTORS.filter((sector) => sector.status === "Weakening");
  const lagging = SECTORS.filter((sector) => sector.status === "Lagging");

  const topSector = sortedSectors[0];

  const fastestImproving = [...SECTORS].sort(
    (a, b) => b.scoreChange - a.scoreChange
  )[0];

  const fastestWeakening = [...SECTORS].sort(
    (a, b) => a.scoreChange - b.scoreChange
  )[0];

  const handleTabClick = (tab) => {
    if (!tab.premium || hasSubscription) {
      setActiveTab(tab.id);
      return;
    }

    if (!isLoggedIn) {
      setModal("login");
      return;
    }

    setModal("subscribe");
  };

  const handlePremiumAction = () => {
    if (!isLoggedIn) {
      setModal("login");
      return;
    }

    if (!hasSubscription) {
      setModal("subscribe");
    }
  };

  const getTimeframeValue = (sector) => {
    switch (timeframe) {
      case "1D":
        return sector.oneDay;
      case "5D":
        return sector.fiveDay;
      case "1M":
        return sector.oneMonth;
      case "3M":
        return sector.threeMonth;
      case "6M":
        return sector.sixMonth;
      case "1Y":
        return sector.oneYear;
      default:
        return sector.oneMonth;
    }
  };

  const getHeatmapValue = (sector) => {
    switch (heatmapMetric) {
      case "1D":
        return formatPercent(sector.oneDay);
      case "5D":
        return formatPercent(sector.fiveDay);
      case "1M":
        return formatPercent(sector.oneMonth);
      default:
        return `Score ${sector.score}`;
    }
  };

  const renderMarketGroup = (title, sectors) => (
    <div className="rbr-srt-market-group">
      <div className="rbr-srt-market-group-header">
        <span className={`rbr-srt-market-dot ${getStatusClass(title)}`} />
        <strong>{title}</strong>
        <span>{sectors.length}</span>
      </div>

      <div className="rbr-srt-market-group-list">
        {sectors.map((sector) => (
          <div className="rbr-srt-market-row" key={sector.id}>
            <div>
              <strong>{sector.shortName}</strong>
              <span>{sector.score}</span>
            </div>

            <span
              className={
                sector.scoreChange >= 0
                  ? "rbr-srt-positive"
                  : "rbr-srt-negative"
              }
            >
              {sector.scoreChange >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(sector.scoreChange)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      <section className="rbr-srt-market-overview">
        <div className="rbr-srt-section-title-row">
          <div>
            <span className="rbr-srt-kicker">MARKET OVERVIEW</span>
            <h2>Sector Rotation Today</h2>
          </div>

          <div className="rbr-srt-market-condition">
            <span className="rbr-srt-market-condition-dot" />
            Market breadth positive
          </div>
        </div>

        <div className="rbr-srt-market-grid">
          {renderMarketGroup("Leading", leading)}
          {renderMarketGroup("Improving", improving)}
          {renderMarketGroup("Weakening", weakening)}
          {renderMarketGroup("Lagging", lagging)}
        </div>
      </section>

      <section className="rbr-srt-insight-strip">
        <div className="rbr-srt-insight-card">
          <span>TOP SECTOR</span>

          <div className="rbr-srt-insight-main">
            <strong>{topSector.shortName}</strong>
            <b>{topSector.score}</b>
          </div>

          <div className="rbr-srt-insight-sub">
            <span>Rotation score</span>
            <span className="rbr-srt-positive">
              ▲ {topSector.scoreChange}
            </span>
          </div>
        </div>

        <div className="rbr-srt-insight-card">
          <span>FASTEST IMPROVING</span>

          <div className="rbr-srt-insight-main">
            <strong>{fastestImproving.shortName}</strong>
            <b>{fastestImproving.score}</b>
          </div>

          <div className="rbr-srt-insight-sub">
            <span>{fastestImproving.momentum}</span>
            <span className="rbr-srt-positive">
              ▲ {fastestImproving.scoreChange}
            </span>
          </div>
        </div>

        <div className="rbr-srt-insight-card">
          <span>LOSING MOMENTUM</span>

          <div className="rbr-srt-insight-main">
            <strong>{fastestWeakening.shortName}</strong>
            <b>{fastestWeakening.score}</b>
          </div>

          <div className="rbr-srt-insight-sub">
            <span>{fastestWeakening.momentum}</span>
            <span className="rbr-srt-negative">
              ▼ {Math.abs(fastestWeakening.scoreChange)}
            </span>
          </div>
        </div>

        <div className="rbr-srt-insight-card">
          <span>SECTORS STRENGTHENING</span>

          <div className="rbr-srt-insight-main">
            <strong>{leading.length + improving.length}</strong>
            <b className="rbr-srt-mini-label">of {SECTORS.length}</b>
          </div>

          <div className="rbr-srt-insight-sub">
            <span>Leading + Improving</span>
            <span className="rbr-srt-positive">Positive</span>
          </div>
        </div>
      </section>

      <section className="rbr-srt-panel">
        <div className="rbr-srt-panel-header">
          <div>
            <h3>Sector Performance</h3>
            <p>
              Compare current sector movement across commonly used market
              timeframes.
            </p>
          </div>

          <div className="rbr-srt-timeframes">
            {["1D", "5D", "1M", "3M", "6M", "1Y"].map((item) => (
              <button
                type="button"
                key={item}
                className={timeframe === item ? "active" : ""}
                onClick={() => setTimeframe(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rbr-srt-table-wrap">
          <table className="rbr-srt-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Status</th>
                <th>Rotation Score</th>
                <th>{timeframe}</th>
                <th>Momentum</th>
                <th>Trend</th>
              </tr>
            </thead>

            <tbody>
              {sortedSectors.slice(0, 5).map((sector, index) => (
                <tr key={sector.id}>
                  <td>
                    <div className="rbr-srt-sector-name-cell">
                      <span>{index + 1}</span>
                      <strong>{sector.name}</strong>
                    </div>
                  </td>

                  <td>
                    <StatusBadge status={sector.status} />
                  </td>

                  <td>
                    <div className="rbr-srt-score-display">
                      <strong>{sector.score}</strong>

                      <div className="rbr-srt-score-track">
                        <div
                          className={`rbr-srt-score-progress ${getStatusClass(
                            sector.status
                          )}`}
                          style={{ width: `${sector.score}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td
                    className={getMovementClass(
                      getTimeframeValue(sector)
                    )}
                  >
                    <strong>
                      {formatPercent(getTimeframeValue(sector))}
                    </strong>
                  </td>

                  <td>{sector.momentum}</td>

                  <td>
                    <Sparkline
                      values={sector.sparkline}
                      status={sector.status}
                    />
                  </td>
                </tr>
              ))}

              {!hasSubscription &&
                sortedSectors.slice(5, 8).map((sector, index) => (
                  <tr
                    className="rbr-srt-locked-table-row"
                    key={`locked-${index}`}
                  >
                    <td>
                      <div className="rbr-srt-sector-name-cell">
                        <span>{index + 6}</span>
                        <strong>{sector.name}</strong>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={sector.status} />
                    </td>

                    <td>{sector.score}</td>
                    <td>••••</td>
                    <td>Subscriber</td>
                    <td>••••••••</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!hasSubscription && (
          <div className="rbr-srt-table-unlock">
            <div>
              <strong>View the complete sector leaderboard</strong>
              <span>
                Rankings, momentum, multi-period performance and rotation
                history.
              </span>
            </div>

            <button type="button" onClick={handlePremiumAction}>
              Unlock for ₹{CONFIG.monthlyPrice}/month
            </button>
          </div>
        )}
      </section>

      <section className="rbr-srt-panel">
        <div className="rbr-srt-panel-header">
          <div>
            <h3>Sector Heatmap</h3>
            <p>
              A visual snapshot of sector leadership and performance.
            </p>
          </div>

          <div className="rbr-srt-timeframes">
            {[
              { id: "rotation", label: "Rotation" },
              { id: "1D", label: "1D" },
              { id: "5D", label: "5D" },
              { id: "1M", label: "1M" },
            ].map((item) => (
              <button
                type="button"
                key={item.id}
                className={heatmapMetric === item.id ? "active" : ""}
                onClick={() => setHeatmapMetric(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rbr-srt-heatmap">
          {sortedSectors.map((sector, index) => (
            <button
              type="button"
              key={sector.id}
              className={`rbr-srt-heatmap-tile ${getStatusClass(
                sector.status
              )} ${index < 2 ? "large" : ""}`}
              onClick={() => {
                if (hasSubscription) {
                  setSelectedSectorId(sector.id);
                  setActiveTab("details");
                } else {
                  handlePremiumAction();
                }
              }}
            >
              <strong>{sector.shortName}</strong>

              <span>{sector.status}</span>

              <b
                className={
                  heatmapMetric === "rotation"
                    ? ""
                    : getMovementClass(
                        heatmapMetric === "1D"
                          ? sector.oneDay
                          : heatmapMetric === "5D"
                          ? sector.fiveDay
                          : sector.oneMonth
                      )
                }
              >
                {getHeatmapValue(sector)}
              </b>
            </button>
          ))}
        </div>
      </section>

      <section className="rbr-srt-today-watch">
        <div className="rbr-srt-watch-left">
          <span className="rbr-srt-kicker">TODAY'S ROTATION WATCH</span>

          <h3>IT is gaining momentum toward market leadership</h3>

          <p>
            The IT sector currently has the largest positive change in its
            rotation score among the sectors shown in this preview.
          </p>
        </div>

        <div className="rbr-srt-watch-score">
          <span>ROTATION SCORE</span>
          <strong>79</strong>
          <b className="rbr-srt-positive">▲ 9</b>
        </div>

        <div className="rbr-srt-watch-action">
          <button type="button" onClick={handlePremiumAction}>
            View detailed analysis
          </button>

          <span>Included with ₹{CONFIG.monthlyPrice}/month access</span>
        </div>
      </section>
    </>
  );

  const renderRotationMap = () => (
    <section className="rbr-srt-panel rbr-srt-premium-panel">
      <div className="rbr-srt-panel-header">
        <div>
          <span className="rbr-srt-kicker">RELATIVE ROTATION</span>
          <h3>Sector Rotation Map</h3>
          <p>
            Track sector positioning across Leading, Improving, Weakening and
            Lagging phases.
          </p>
        </div>
      </div>

      <div className="rbr-srt-rrg-axis-label rbr-srt-rrg-y-label">
        MOMENTUM ↑
      </div>

      <div className="rbr-srt-rrg">
        <div className="rbr-srt-rrg-quadrant improving">
          <div className="rbr-srt-rrg-title">
            <strong>IMPROVING</strong>
            <span>Momentum rising</span>
          </div>

          {improving.map((sector, index) => (
            <div
              key={sector.id}
              className="rbr-srt-rrg-point improving"
              style={{
                left: `${24 + index * 18}%`,
                top: `${34 + (index % 2) * 24}%`,
              }}
            >
              <span>{sector.shortName}</span>
              <i />
            </div>
          ))}
        </div>

        <div className="rbr-srt-rrg-quadrant leading">
          <div className="rbr-srt-rrg-title">
            <strong>LEADING</strong>
            <span>Strong momentum</span>
          </div>

          {leading.map((sector, index) => (
            <div
              key={sector.id}
              className="rbr-srt-rrg-point leading"
              style={{
                left: `${38 + index * 30}%`,
                top: `${35 + index * 20}%`,
              }}
            >
              <span>{sector.shortName}</span>
              <i />
            </div>
          ))}
        </div>

        <div className="rbr-srt-rrg-quadrant lagging">
          <div className="rbr-srt-rrg-title">
            <strong>LAGGING</strong>
            <span>Relative weakness</span>
          </div>

          {lagging.map((sector, index) => (
            <div
              key={sector.id}
              className="rbr-srt-rrg-point lagging"
              style={{
                left: `${25 + index * 20}%`,
                top: `${38 + index * 16}%`,
              }}
            >
              <span>{sector.shortName}</span>
              <i />
            </div>
          ))}
        </div>

        <div className="rbr-srt-rrg-quadrant weakening">
          <div className="rbr-srt-rrg-title">
            <strong>WEAKENING</strong>
            <span>Momentum falling</span>
          </div>

          {weakening.map((sector, index) => (
            <div
              key={sector.id}
              className="rbr-srt-rrg-point weakening"
              style={{
                left: `${28 + index * 25}%`,
                top: `${36 + index * 19}%`,
              }}
            >
              <span>{sector.shortName}</span>
              <i />
            </div>
          ))}
        </div>
      </div>

      <div className="rbr-srt-rrg-x-label">
        RELATIVE STRENGTH →
      </div>

      <div className="rbr-srt-rotation-history">
        <h4>Recent Rotation History</h4>

        <div className="rbr-srt-table-wrap">
          <table className="rbr-srt-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>5 Sessions Ago</th>
                <th>4 Sessions Ago</th>
                <th>3 Sessions Ago</th>
                <th>Previous</th>
                <th>Current</th>
                <th>Score Change</th>
              </tr>
            </thead>

            <tbody>
              {ROTATION_HISTORY.map((item) => (
                <tr key={item.sector}>
                  <td>
                    <strong>{item.sector}</strong>
                  </td>
                  <td>{item.d5}</td>
                  <td>{item.d4}</td>
                  <td>{item.d3}</td>
                  <td>{item.d2}</td>
                  <td>
                    <StatusBadge status={item.current} />
                  </td>
                  <td
                    className={
                      item.score.startsWith("+")
                        ? "rbr-srt-positive"
                        : "rbr-srt-negative"
                    }
                  >
                    <strong>{item.score}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderRanking = () => (
    <section className="rbr-srt-panel">
      <div className="rbr-srt-panel-header">
        <div>
          <span className="rbr-srt-kicker">COMPLETE DATA</span>
          <h3>Sector Ranking</h3>
          <p>
            Ranked using the current RBR sector rotation score.
          </p>
        </div>

        <div className="rbr-srt-timeframes">
          {["1D", "5D", "1M", "3M", "6M", "1Y"].map((item) => (
            <button
              type="button"
              key={item}
              className={timeframe === item ? "active" : ""}
              onClick={() => setTimeframe(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="rbr-srt-table-wrap">
        <table className="rbr-srt-table rbr-srt-full-ranking">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Sector</th>
              <th>Status</th>
              <th>Rotation Score</th>
              <th>Change</th>
              <th>1D</th>
              <th>5D</th>
              <th>1M</th>
              <th>3M</th>
              <th>Momentum</th>
            </tr>
          </thead>

          <tbody>
            {sortedSectors.map((sector, index) => (
              <tr key={sector.id}>
                <td>
                  <span className="rbr-srt-rank">#{index + 1}</span>
                </td>

                <td>
                  <button
                    type="button"
                    className="rbr-srt-sector-link"
                    onClick={() => {
                      setSelectedSectorId(sector.id);
                      setActiveTab("details");
                    }}
                  >
                    {sector.name}
                  </button>
                </td>

                <td>
                  <StatusBadge status={sector.status} />
                </td>

                <td>
                  <div className="rbr-srt-score-display">
                    <strong>{sector.score}</strong>

                    <div className="rbr-srt-score-track">
                      <div
                        className={`rbr-srt-score-progress ${getStatusClass(
                          sector.status
                        )}`}
                        style={{ width: `${sector.score}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td
                  className={
                    sector.scoreChange >= 0
                      ? "rbr-srt-positive"
                      : "rbr-srt-negative"
                  }
                >
                  <strong>
                    {sector.scoreChange >= 0 ? "+" : ""}
                    {sector.scoreChange}
                  </strong>
                </td>

                <td className={getMovementClass(sector.oneDay)}>
                  {formatPercent(sector.oneDay)}
                </td>

                <td className={getMovementClass(sector.fiveDay)}>
                  {formatPercent(sector.fiveDay)}
                </td>

                <td className={getMovementClass(sector.oneMonth)}>
                  {formatPercent(sector.oneMonth)}
                </td>

                <td className={getMovementClass(sector.threeMonth)}>
                  {formatPercent(sector.threeMonth)}
                </td>

                <td>{sector.momentum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderPerformance = () => (
    <>
      <section className="rbr-srt-panel">
        <div className="rbr-srt-panel-header">
          <div>
            <span className="rbr-srt-kicker">MULTI-PERIOD PERFORMANCE</span>
            <h3>Sector Performance Comparison</h3>
            <p>
              Compare short and medium-term sector returns alongside current
              rotation status.
            </p>
          </div>
        </div>

        <div className="rbr-srt-performance-grid">
          {sortedSectors.map((sector) => (
            <button
              className="rbr-srt-performance-card"
              type="button"
              key={sector.id}
              onClick={() => {
                setSelectedSectorId(sector.id);
                setActiveTab("details");
              }}
            >
              <div className="rbr-srt-performance-card-top">
                <div>
                  <strong>{sector.shortName}</strong>
                  <StatusBadge status={sector.status} />
                </div>

                <span className="rbr-srt-performance-score">
                  {sector.score}
                </span>
              </div>

              <Sparkline
                values={sector.sparkline}
                status={sector.status}
              />

              <div className="rbr-srt-performance-periods">
                <div>
                  <span>1D</span>
                  <b className={getMovementClass(sector.oneDay)}>
                    {formatPercent(sector.oneDay)}
                  </b>
                </div>

                <div>
                  <span>1M</span>
                  <b className={getMovementClass(sector.oneMonth)}>
                    {formatPercent(sector.oneMonth)}
                  </b>
                </div>

                <div>
                  <span>3M</span>
                  <b className={getMovementClass(sector.threeMonth)}>
                    {formatPercent(sector.threeMonth)}
                  </b>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );

  const renderDetails = () => {
    const drivers =
      STOCK_DRIVERS[selectedSector.shortName] ||
      STOCK_DRIVERS.IT;

    return (
      <>
        <section className="rbr-srt-panel">
          <div className="rbr-srt-sector-picker">
            <span>View sector</span>

            <select
              value={selectedSectorId}
              onChange={(event) =>
                setSelectedSectorId(event.target.value)
              }
            >
              {sortedSectors.map((sector) => (
                <option value={sector.id} key={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rbr-srt-sector-detail-header">
            <div>
              <span className="rbr-srt-kicker">SECTOR DEEP DIVE</span>

              <h2>{selectedSector.name}</h2>

              <div className="rbr-srt-sector-detail-status">
                <StatusBadge status={selectedSector.status} />

                <span>
                  Momentum: <strong>{selectedSector.momentum}</strong>
                </span>
              </div>
            </div>

            <div className="rbr-srt-big-score">
              <span>RBR ROTATION SCORE</span>
              <strong>{selectedSector.score}</strong>

              <b
                className={
                  selectedSector.scoreChange >= 0
                    ? "rbr-srt-positive"
                    : "rbr-srt-negative"
                }
              >
                {selectedSector.scoreChange >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(selectedSector.scoreChange)}
              </b>
            </div>
          </div>

          <div className="rbr-srt-sector-stats">
            <div>
              <span>Relative Strength</span>
              <strong>{selectedSector.relativeStrength}</strong>
            </div>

            <div>
              <span>Market Breadth</span>
              <strong>{selectedSector.breadth}</strong>
            </div>

            <div>
              <span>Advance / Decline</span>
              <strong>{selectedSector.advanceDecline}</strong>
            </div>

            <div>
              <span>Sector P/E</span>
              <strong>{selectedSector.pe}</strong>
            </div>

            <div>
              <span>Approx. Market Cap</span>
              <strong>{selectedSector.marketCap}</strong>
            </div>
          </div>
        </section>

        <section className="rbr-srt-detail-columns">
          <div className="rbr-srt-panel">
            <div className="rbr-srt-panel-header">
              <div>
                <h3>Performance</h3>
              </div>
            </div>

            <div className="rbr-srt-detail-performance-list">
              {[
                ["1 Day", selectedSector.oneDay],
                ["5 Days", selectedSector.fiveDay],
                ["1 Month", selectedSector.oneMonth],
                ["3 Months", selectedSector.threeMonth],
                ["6 Months", selectedSector.sixMonth],
                ["1 Year", selectedSector.oneYear],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong className={getMovementClass(value)}>
                    {formatPercent(value)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div className="rbr-srt-panel">
            <div className="rbr-srt-panel-header">
              <div>
                <h3>Stocks Driving Movement</h3>
              </div>
            </div>

            <div className="rbr-srt-stock-driver-list">
              {drivers.map((stock, index) => (
                <div key={stock.name}>
                  <span className="rbr-srt-stock-rank">
                    {index + 1}
                  </span>

                  <strong>{stock.name}</strong>

                  <b className="rbr-srt-positive">
                    {stock.contribution}
                  </b>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <>
      <style>{`
        .rbr-srt-page {
          --rbr-ink: #1d2735;
          --rbr-muted: #697586;
          --rbr-border: #e5e9ef;
          --rbr-soft: #f7f9fb;
          --rbr-blue: #1769d2;
          --rbr-blue-dark: #1155ad;
          --rbr-green: #15845b;
          --rbr-green-soft: #eaf7f1;
          --rbr-blue-soft: #edf4ff;
          --rbr-orange: #a36b14;
          --rbr-orange-soft: #fff5e6;
          --rbr-red: #bd4c4c;
          --rbr-red-soft: #fff0f0;

          min-height: 100vh;
          background: #f6f8fa;
          color: var(--rbr-ink);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
          text-align: left;
        }

        .rbr-srt-page * {
          box-sizing: border-box;
        }

        .rbr-srt-container {
          width: min(1220px, calc(100% - 36px));
          margin: 0 auto;
        }

        .rbr-srt-page-header {
          background: #ffffff;
          border-bottom: 1px solid var(--rbr-border);
        }

        .rbr-srt-header-inner {
          padding: 26px 0 0;
        }

        .rbr-srt-breadcrumb {
          font-size: 12px;
          color: #7b8593;
          margin-bottom: 22px;
        }

        .rbr-srt-breadcrumb b {
          color: #4c5969;
          font-weight: 500;
        }

        .rbr-srt-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 30px;
          padding-bottom: 22px;
        }

        .rbr-srt-title-row h1 {
          margin: 0;
          font-size: clamp(27px, 3vw, 38px);
          line-height: 1.1;
          letter-spacing: -0.035em;
          font-weight: 720;
        }

        .rbr-srt-title-row p {
          margin: 8px 0 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--rbr-muted);
        }

        .rbr-srt-update-box {
          flex: 0 0 auto;
          text-align: right;
        }

        .rbr-srt-update-box strong {
          display: block;
          font-size: 13px;
        }

        .rbr-srt-update-box span {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          color: var(--rbr-muted);
        }

        .rbr-srt-live {
          display: inline-flex !important;
          align-items: center;
          gap: 7px;
          margin-bottom: 6px;
          color: #327154 !important;
        }

        .rbr-srt-live::before {
          content: "";
          width: 7px;
          height: 7px;
          background: #24a66a;
          border-radius: 50%;
        }

        .rbr-srt-main-tabs {
          display: flex;
          overflow-x: auto;
          gap: 3px;
          scrollbar-width: none;
        }

        .rbr-srt-main-tabs::-webkit-scrollbar {
          display: none;
        }

        .rbr-srt-main-tab {
          position: relative;
          flex: 0 0 auto;
          padding: 13px 17px 14px;
          border: 0;
          background: transparent;
          color: #657184;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        .rbr-srt-main-tab:hover {
          color: var(--rbr-blue);
        }

        .rbr-srt-main-tab.active {
          color: var(--rbr-blue);
        }

        .rbr-srt-main-tab.active::after {
          content: "";
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0;
          height: 3px;
          border-radius: 3px 3px 0 0;
          background: var(--rbr-blue);
        }

        .rbr-srt-tab-premium {
          margin-left: 5px;
          font-size: 9px;
          color: #9aa4b1;
        }

        .rbr-srt-body {
          padding: 22px 0 84px;
        }

        .rbr-srt-sample-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 16px;
          padding: 11px 14px;
          border: 1px solid #ead8a3;
          background: #fffbed;
          border-radius: 5px;
          font-size: 12px;
          line-height: 1.5;
          color: #725f27;
        }

        .rbr-srt-sample-notice strong {
          flex: 0 0 auto;
        }

        .rbr-srt-market-overview,
        .rbr-srt-panel {
          background: #ffffff;
          border: 1px solid var(--rbr-border);
          border-radius: 5px;
          margin-bottom: 16px;
        }

        .rbr-srt-market-overview {
          padding: 21px;
        }

        .rbr-srt-section-title-row,
        .rbr-srt-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .rbr-srt-section-title-row {
          margin-bottom: 20px;
        }

        .rbr-srt-panel-header {
          padding: 19px 20px 15px;
          border-bottom: 1px solid var(--rbr-border);
        }

        .rbr-srt-kicker {
          display: block;
          margin-bottom: 5px;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.08em;
          color: #7b8798;
        }

        .rbr-srt-section-title-row h2,
        .rbr-srt-panel-header h3 {
          margin: 0;
          letter-spacing: -0.02em;
        }

        .rbr-srt-section-title-row h2 {
          font-size: 21px;
        }

        .rbr-srt-panel-header h3 {
          font-size: 18px;
        }

        .rbr-srt-panel-header p {
          margin: 5px 0 0;
          font-size: 12px;
          color: var(--rbr-muted);
        }

        .rbr-srt-market-condition {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: #3f6e57;
        }

        .rbr-srt-market-condition-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #28a16a;
        }

        .rbr-srt-market-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border: 1px solid var(--rbr-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .rbr-srt-market-group {
          min-width: 0;
          border-right: 1px solid var(--rbr-border);
        }

        .rbr-srt-market-group:last-child {
          border-right: 0;
        }

        .rbr-srt-market-group-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 13px;
          background: var(--rbr-soft);
          border-bottom: 1px solid var(--rbr-border);
          font-size: 11px;
        }

        .rbr-srt-market-group-header strong {
          flex: 1;
          font-size: 11px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .rbr-srt-market-group-header > span:last-child {
          color: #8791a0;
        }

        .rbr-srt-market-dot,
        .rbr-srt-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex: 0 0 auto;
        }

        .rbr-srt-market-dot.rbr-srt-status-leading,
        .rbr-srt-status-leading .rbr-srt-status-dot {
          background: var(--rbr-green);
        }

        .rbr-srt-market-dot.rbr-srt-status-improving,
        .rbr-srt-status-improving .rbr-srt-status-dot {
          background: var(--rbr-blue);
        }

        .rbr-srt-market-dot.rbr-srt-status-weakening,
        .rbr-srt-status-weakening .rbr-srt-status-dot {
          background: #d7932d;
        }

        .rbr-srt-market-dot.rbr-srt-status-lagging,
        .rbr-srt-status-lagging .rbr-srt-status-dot {
          background: var(--rbr-red);
        }

        .rbr-srt-market-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 11px 13px;
          border-bottom: 1px solid #edf0f4;
        }

        .rbr-srt-market-row:last-child {
          border-bottom: 0;
        }

        .rbr-srt-market-row > div {
          min-width: 0;
        }

        .rbr-srt-market-row > div strong {
          display: inline-block;
          margin-right: 7px;
          font-size: 13px;
        }

        .rbr-srt-market-row > div span {
          font-size: 11px;
          color: #8993a1;
        }

        .rbr-srt-market-row > span {
          font-size: 10px;
          font-weight: 650;
        }

        .rbr-srt-positive {
          color: #15845b !important;
        }

        .rbr-srt-negative {
          color: #c04c4c !important;
        }

        .rbr-srt-neutral {
          color: #697586 !important;
        }

        .rbr-srt-insight-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .rbr-srt-insight-card {
          padding: 15px 16px;
          background: #ffffff;
          border: 1px solid var(--rbr-border);
          border-radius: 5px;
        }

        .rbr-srt-insight-card > span:first-child {
          display: block;
          margin-bottom: 12px;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.07em;
          color: #838e9e;
        }

        .rbr-srt-insight-main {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        .rbr-srt-insight-main strong {
          min-width: 0;
          font-size: 20px;
          letter-spacing: -0.025em;
        }

        .rbr-srt-insight-main b {
          font-size: 20px;
          font-weight: 650;
        }

        .rbr-srt-mini-label {
          font-size: 11px !important;
          color: var(--rbr-muted);
        }

        .rbr-srt-insight-sub {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
          font-size: 10px;
          color: var(--rbr-muted);
        }

        .rbr-srt-timeframes {
          display: flex;
          align-items: center;
          overflow-x: auto;
          border: 1px solid var(--rbr-border);
          border-radius: 4px;
          background: #fff;
        }

        .rbr-srt-timeframes button {
          padding: 7px 9px;
          border: 0;
          border-right: 1px solid var(--rbr-border);
          background: transparent;
          color: #667285;
          cursor: pointer;
          font-size: 10px;
          font-weight: 650;
          white-space: nowrap;
        }

        .rbr-srt-timeframes button:last-child {
          border-right: 0;
        }

        .rbr-srt-timeframes button.active {
          color: var(--rbr-blue);
          background: #edf4ff;
        }

        .rbr-srt-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .rbr-srt-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
        }

        .rbr-srt-table th {
          padding: 10px 14px;
          background: #f8f9fb;
          border-bottom: 1px solid var(--rbr-border);
          color: #778292;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.045em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rbr-srt-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #edf0f4;
          font-size: 11px;
          color: #465365;
          white-space: nowrap;
          vertical-align: middle;
        }

        .rbr-srt-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .rbr-srt-table tbody tr:hover {
          background: #fafbfd;
        }

        .rbr-srt-sector-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rbr-srt-sector-name-cell > span {
          width: 18px;
          color: #9aa4b2;
          font-size: 10px;
        }

        .rbr-srt-sector-name-cell strong {
          color: #293545;
          font-size: 12px;
        }

        .rbr-srt-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 7px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 650;
        }

        .rbr-srt-status-badge.rbr-srt-status-leading {
          color: #176a4b;
          background: var(--rbr-green-soft);
        }

        .rbr-srt-status-badge.rbr-srt-status-improving {
          color: #235da4;
          background: var(--rbr-blue-soft);
        }

        .rbr-srt-status-badge.rbr-srt-status-weakening {
          color: #8f6119;
          background: var(--rbr-orange-soft);
        }

        .rbr-srt-status-badge.rbr-srt-status-lagging {
          color: #a84949;
          background: var(--rbr-red-soft);
        }

        .rbr-srt-score-display {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .rbr-srt-score-display strong {
          width: 22px;
          font-size: 11px;
        }

        .rbr-srt-score-track {
          width: 70px;
          height: 4px;
          overflow: hidden;
          border-radius: 5px;
          background: #e9edf2;
        }

        .rbr-srt-score-progress {
          height: 100%;
          border-radius: inherit;
        }

        .rbr-srt-score-progress.rbr-srt-status-leading {
          background: var(--rbr-green);
        }

        .rbr-srt-score-progress.rbr-srt-status-improving {
          background: var(--rbr-blue);
        }

        .rbr-srt-score-progress.rbr-srt-status-weakening {
          background: #d7932d;
        }

        .rbr-srt-score-progress.rbr-srt-status-lagging {
          background: var(--rbr-red);
        }

        .rbr-srt-sparkline {
          display: block;
          width: 78px;
          height: 25px;
        }

        .rbr-srt-sparkline.rbr-srt-status-leading polyline {
          stroke: var(--rbr-green);
        }

        .rbr-srt-sparkline.rbr-srt-status-improving polyline {
          stroke: var(--rbr-blue);
        }

        .rbr-srt-sparkline.rbr-srt-status-weakening polyline {
          stroke: #d18b23;
        }

        .rbr-srt-sparkline.rbr-srt-status-lagging polyline {
          stroke: var(--rbr-red);
        }

        .rbr-srt-locked-table-row {
          position: relative;
          filter: blur(3.2px);
          user-select: none;
          opacity: 0.43;
        }

        .rbr-srt-table-unlock {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 18px;
          border-top: 1px solid var(--rbr-border);
          background: #fbfcfd;
        }

        .rbr-srt-table-unlock > div strong,
        .rbr-srt-table-unlock > div span {
          display: block;
        }

        .rbr-srt-table-unlock > div strong {
          margin-bottom: 3px;
          font-size: 12px;
        }

        .rbr-srt-table-unlock > div span {
          font-size: 10px;
          color: var(--rbr-muted);
        }

        .rbr-srt-table-unlock button,
        .rbr-srt-watch-action button,
        .rbr-srt-subscription-button,
        .rbr-srt-modal-primary {
          border: 1px solid var(--rbr-blue);
          background: var(--rbr-blue);
          color: #ffffff;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 650;
        }

        .rbr-srt-table-unlock button {
          padding: 9px 12px;
          font-size: 10px;
        }

        .rbr-srt-table-unlock button:hover,
        .rbr-srt-watch-action button:hover,
        .rbr-srt-subscription-button:hover,
        .rbr-srt-modal-primary:hover {
          background: var(--rbr-blue-dark);
        }

        .rbr-srt-heatmap {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-auto-rows: 92px;
          gap: 3px;
          padding: 4px;
          background: #f0f2f5;
        }

        .rbr-srt-heatmap-tile {
          min-width: 0;
          padding: 11px;
          border: 0;
          border-radius: 2px;
          text-align: left;
          cursor: pointer;
          transition:
            transform 0.12s ease,
            filter 0.12s ease;
        }

        .rbr-srt-heatmap-tile:hover {
          filter: brightness(0.98);
          transform: translateY(-1px);
        }

        .rbr-srt-heatmap-tile.large {
          grid-column: span 2;
        }

        .rbr-srt-heatmap-tile.rbr-srt-status-leading {
          background: #dff3e8;
          color: #155d42;
        }

        .rbr-srt-heatmap-tile.rbr-srt-status-improving {
          background: #e4efff;
          color: #21599c;
        }

        .rbr-srt-heatmap-tile.rbr-srt-status-weakening {
          background: #fff0d8;
          color: #895a15;
        }

        .rbr-srt-heatmap-tile.rbr-srt-status-lagging {
          background: #f9dfdf;
          color: #984343;
        }

        .rbr-srt-heatmap-tile strong,
        .rbr-srt-heatmap-tile span,
        .rbr-srt-heatmap-tile b {
          display: block;
        }

        .rbr-srt-heatmap-tile strong {
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
        }

        .rbr-srt-heatmap-tile span {
          margin-bottom: 8px;
          opacity: 0.72;
          font-size: 9px;
        }

        .rbr-srt-heatmap-tile b {
          font-size: 13px;
        }

        .rbr-srt-today-watch {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 130px 210px;
          gap: 24px;
          align-items: center;
          margin-bottom: 16px;
          padding: 19px 21px;
          border: 1px solid #dce5f0;
          border-left: 4px solid var(--rbr-blue);
          border-radius: 5px;
          background: #ffffff;
        }

        .rbr-srt-watch-left h3 {
          margin: 0 0 7px;
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .rbr-srt-watch-left p {
          margin: 0;
          color: var(--rbr-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .rbr-srt-watch-score {
          padding-left: 18px;
          border-left: 1px solid var(--rbr-border);
        }

        .rbr-srt-watch-score span,
        .rbr-srt-watch-score strong,
        .rbr-srt-watch-score b {
          display: block;
        }

        .rbr-srt-watch-score span {
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 0.07em;
          color: #8490a1;
        }

        .rbr-srt-watch-score strong {
          margin: 2px 0;
          font-size: 27px;
          font-weight: 650;
        }

        .rbr-srt-watch-score b {
          font-size: 11px;
        }

        .rbr-srt-watch-action {
          text-align: right;
        }

        .rbr-srt-watch-action button {
          width: 100%;
          padding: 9px 12px;
          font-size: 10px;
        }

        .rbr-srt-watch-action span {
          display: block;
          margin-top: 6px;
          font-size: 9px;
          color: var(--rbr-muted);
        }

        .rbr-srt-subscription-bar {
          position: sticky;
          bottom: 12px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          width: min(980px, calc(100% - 24px));
          margin: 30px auto 0;
          padding: 12px 14px 12px 18px;
          border: 1px solid #d5dce6;
          border-radius: 7px;
          background: rgba(255,255,255,0.97);
          box-shadow: 0 10px 35px rgba(30, 46, 67, 0.13);
          backdrop-filter: blur(10px);
        }

        .rbr-srt-subscription-copy strong,
        .rbr-srt-subscription-copy span {
          display: block;
        }

        .rbr-srt-subscription-copy strong {
          margin-bottom: 2px;
          font-size: 12px;
        }

        .rbr-srt-subscription-copy span {
          font-size: 9px;
          color: var(--rbr-muted);
        }

        .rbr-srt-subscription-price {
          margin-left: auto;
          text-align: right;
        }

        .rbr-srt-subscription-price strong {
          font-size: 17px;
        }

        .rbr-srt-subscription-price span {
          font-size: 10px;
          color: var(--rbr-muted);
        }

        .rbr-srt-subscription-button {
          padding: 9px 14px;
          font-size: 10px;
          white-space: nowrap;
        }

        .rbr-srt-methodology {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 42px;
          margin-top: 32px;
          padding: 26px 4px;
          border-top: 1px solid #dfe4eb;
        }

        .rbr-srt-methodology h3 {
          margin: 0;
          font-size: 16px;
        }

        .rbr-srt-methodology p {
          margin: 0 0 10px;
          color: var(--rbr-muted);
          font-size: 10px;
          line-height: 1.7;
        }

        .rbr-srt-disclaimer {
          padding-top: 10px;
          border-top: 1px solid #e2e6ec;
          font-size: 9px !important;
          color: #8a94a3 !important;
        }

        /* ============================
           ROTATION MAP
        ============================ */

        .rbr-srt-premium-panel {
          position: relative;
          padding-bottom: 20px;
        }

        .rbr-srt-rrg {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 510px;
          margin: 44px 34px 0;
          border: 1px solid var(--rbr-border);
          background: #ffffff;
        }

        .rbr-srt-rrg::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #cbd3dd;
          z-index: 2;
        }

        .rbr-srt-rrg::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #cbd3dd;
          z-index: 2;
        }

        .rbr-srt-rrg-quadrant {
          position: relative;
          min-width: 0;
          overflow: hidden;
        }

        .rbr-srt-rrg-quadrant.improving {
          background: #f7faff;
        }

        .rbr-srt-rrg-quadrant.leading {
          background: #f7fcf9;
        }

        .rbr-srt-rrg-quadrant.lagging {
          background: #fffafa;
        }

        .rbr-srt-rrg-quadrant.weakening {
          background: #fffaf2;
        }

        .rbr-srt-rrg-title {
          position: absolute;
          top: 16px;
          left: 18px;
        }

        .rbr-srt-rrg-title strong,
        .rbr-srt-rrg-title span {
          display: block;
        }

        .rbr-srt-rrg-title strong {
          font-size: 10px;
          letter-spacing: 0.06em;
        }

        .rbr-srt-rrg-title span {
          margin-top: 3px;
          color: #8c96a5;
          font-size: 8px;
        }

        .rbr-srt-rrg-point {
          position: absolute;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 5px;
          transform: translate(-50%, -50%);
          font-size: 9px;
          font-weight: 650;
          white-space: nowrap;
        }

        .rbr-srt-rrg-point i {
          width: 10px;
          height: 10px;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
        }

        .rbr-srt-rrg-point.leading i {
          background: var(--rbr-green);
        }

        .rbr-srt-rrg-point.improving i {
          background: var(--rbr-blue);
        }

        .rbr-srt-rrg-point.weakening i {
          background: #d7932d;
        }

        .rbr-srt-rrg-point.lagging i {
          background: var(--rbr-red);
        }

        .rbr-srt-rrg-x-label,
        .rbr-srt-rrg-axis-label {
          color: #8993a2;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .rbr-srt-rrg-x-label {
          margin-top: 10px;
          text-align: center;
        }

        .rbr-srt-rrg-y-label {
          position: absolute;
          top: 47%;
          left: 7px;
          transform: rotate(-90deg);
          transform-origin: left top;
        }

        .rbr-srt-rotation-history {
          margin: 35px 20px 0;
          border: 1px solid var(--rbr-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .rbr-srt-rotation-history h4 {
          margin: 0;
          padding: 13px 14px;
          border-bottom: 1px solid var(--rbr-border);
          font-size: 12px;
        }

        /* ============================
           RANKING
        ============================ */

        .rbr-srt-full-ranking {
          min-width: 980px;
        }

        .rbr-srt-rank {
          color: #8490a0;
          font-weight: 650;
        }

        .rbr-srt-sector-link {
          border: 0;
          padding: 0;
          background: transparent;
          color: #215f9f;
          cursor: pointer;
          font-size: 11px;
          font-weight: 650;
        }

        .rbr-srt-sector-link:hover {
          text-decoration: underline;
        }

        /* ============================
           PERFORMANCE
        ============================ */

        .rbr-srt-performance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--rbr-border);
        }

        .rbr-srt-performance-card {
          border: 0;
          padding: 17px;
          background: #ffffff;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .rbr-srt-performance-card:hover {
          background: #fbfcfd;
        }

        .rbr-srt-performance-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .rbr-srt-performance-card-top > div > strong {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .rbr-srt-performance-score {
          font-size: 19px;
          font-weight: 650;
        }

        .rbr-srt-performance-card .rbr-srt-sparkline {
          width: 100%;
          height: 42px;
          margin: 5px 0 15px;
        }

        .rbr-srt-performance-periods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--rbr-border);
        }

        .rbr-srt-performance-periods div span,
        .rbr-srt-performance-periods div b {
          display: block;
        }

        .rbr-srt-performance-periods div span {
          margin-bottom: 3px;
          color: #8a95a4;
          font-size: 8px;
        }

        .rbr-srt-performance-periods div b {
          font-size: 10px;
        }

        /* ============================
           DETAILS
        ============================ */

        .rbr-srt-sector-picker {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 19px;
          border-bottom: 1px solid var(--rbr-border);
          background: #fafbfd;
        }

        .rbr-srt-sector-picker span {
          font-size: 10px;
          color: var(--rbr-muted);
        }

        .rbr-srt-sector-picker select {
          min-width: 210px;
          padding: 7px 28px 7px 9px;
          border: 1px solid #d8dee7;
          border-radius: 4px;
          background: white;
          color: #334153;
          font-size: 10px;
        }

        .rbr-srt-sector-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          padding: 23px 20px;
        }

        .rbr-srt-sector-detail-header h2 {
          margin: 0 0 10px;
          font-size: 27px;
          letter-spacing: -0.03em;
        }

        .rbr-srt-sector-detail-status {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .rbr-srt-sector-detail-status > span:last-child {
          font-size: 10px;
          color: var(--rbr-muted);
        }

        .rbr-srt-big-score {
          min-width: 150px;
          text-align: right;
        }

        .rbr-srt-big-score span,
        .rbr-srt-big-score strong,
        .rbr-srt-big-score b {
          display: block;
        }

        .rbr-srt-big-score span {
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 0.06em;
          color: #8792a2;
        }

        .rbr-srt-big-score strong {
          margin: 2px 0;
          font-size: 42px;
          line-height: 1;
          font-weight: 620;
        }

        .rbr-srt-big-score b {
          font-size: 11px;
        }

        .rbr-srt-sector-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-top: 1px solid var(--rbr-border);
          background: #fafbfd;
        }

        .rbr-srt-sector-stats > div {
          padding: 14px 15px;
          border-right: 1px solid var(--rbr-border);
        }

        .rbr-srt-sector-stats > div:last-child {
          border-right: 0;
        }

        .rbr-srt-sector-stats span,
        .rbr-srt-sector-stats strong {
          display: block;
        }

        .rbr-srt-sector-stats span {
          margin-bottom: 4px;
          font-size: 8px;
          color: #8590a0;
        }

        .rbr-srt-sector-stats strong {
          font-size: 10px;
          color: #344153;
        }

        .rbr-srt-detail-columns {
          display: grid;
          grid-template-columns: 0.8fr 1.2fr;
          gap: 16px;
        }

        .rbr-srt-detail-performance-list {
          padding: 0 18px 10px;
        }

        .rbr-srt-detail-performance-list > div {
          display: flex;
          justify-content: space-between;
          padding: 11px 0;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
        }

        .rbr-srt-detail-performance-list > div:last-child {
          border-bottom: 0;
        }

        .rbr-srt-detail-performance-list span {
          color: #667385;
        }

        .rbr-srt-stock-driver-list {
          padding: 0 18px 10px;
        }

        .rbr-srt-stock-driver-list > div {
          display: grid;
          grid-template-columns: 25px 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #edf0f4;
          font-size: 10px;
        }

        .rbr-srt-stock-driver-list > div:last-child {
          border-bottom: 0;
        }

        .rbr-srt-stock-rank {
          color: #8c96a5;
        }

        /* ============================
           MODALS
        ============================ */

        .rbr-srt-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(20, 31, 45, 0.58);
        }

        .rbr-srt-modal {
          width: min(420px, 100%);
          padding: 25px;
          border-radius: 7px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15, 28, 44, 0.25);
        }

        .rbr-srt-modal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 6px;
          background: #edf4ff;
          color: var(--rbr-blue);
          font-size: 16px;
          font-weight: 750;
        }

        .rbr-srt-modal h3 {
          margin: 16px 0 7px;
          font-size: 20px;
          letter-spacing: -0.025em;
        }

        .rbr-srt-modal > p {
          margin: 0;
          color: var(--rbr-muted);
          font-size: 11px;
          line-height: 1.6;
        }

        .rbr-srt-modal-price {
          margin-top: 17px;
          padding: 14px;
          border: 1px solid var(--rbr-border);
          border-radius: 5px;
          background: #f8fafc;
        }

        .rbr-srt-modal-price strong {
          font-size: 24px;
        }

        .rbr-srt-modal-price span {
          font-size: 11px;
          color: var(--rbr-muted);
        }

        .rbr-srt-modal-features {
          margin: 16px 0 0;
          padding: 0;
          list-style: none;
        }

        .rbr-srt-modal-features li {
          position: relative;
          padding: 5px 0 5px 18px;
          color: #586678;
          font-size: 10px;
        }

        .rbr-srt-modal-features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: var(--rbr-green);
          font-weight: 700;
        }

        .rbr-srt-modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 21px;
        }

        .rbr-srt-modal-secondary,
        .rbr-srt-modal-primary {
          flex: 1;
          padding: 9px 11px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 650;
        }

        .rbr-srt-modal-secondary {
          border: 1px solid var(--rbr-border);
          background: #ffffff;
          color: #445163;
        }

        .rbr-srt-modal-primary {
          border: 1px solid var(--rbr-blue);
        }

        .rbr-srt-modal-note {
          margin-top: 10px !important;
          color: #8d6c2e !important;
          font-size: 9px !important;
        }

        @media (max-width: 980px) {
          .rbr-srt-market-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .rbr-srt-market-group:nth-child(2) {
            border-right: 0;
          }

          .rbr-srt-market-group:nth-child(-n + 2) {
            border-bottom: 1px solid var(--rbr-border);
          }

          .rbr-srt-insight-strip {
            grid-template-columns: repeat(2, 1fr);
          }

          .rbr-srt-heatmap {
            grid-template-columns: repeat(4, 1fr);
          }

          .rbr-srt-today-watch {
            grid-template-columns: 1fr 120px;
          }

          .rbr-srt-watch-action {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            gap: 10px;
            text-align: left;
          }

          .rbr-srt-watch-action button {
            width: auto;
          }

          .rbr-srt-performance-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .rbr-srt-sector-stats {
            grid-template-columns: repeat(3, 1fr);
          }

          .rbr-srt-sector-stats > div {
            border-bottom: 1px solid var(--rbr-border);
          }

          .rbr-srt-sector-stats > div:nth-child(3n) {
            border-right: 0;
          }
        }

        @media (max-width: 720px) {
          .rbr-srt-container {
            width: min(100% - 20px, 1220px);
          }

          .rbr-srt-header-inner {
            padding-top: 18px;
          }

          .rbr-srt-title-row {
            flex-direction: column;
            gap: 13px;
          }

          .rbr-srt-update-box {
            text-align: left;
          }

          .rbr-srt-section-title-row,
          .rbr-srt-panel-header {
            flex-direction: column;
          }

          .rbr-srt-market-grid {
            grid-template-columns: 1fr;
          }

          .rbr-srt-market-group {
            border-right: 0;
            border-bottom: 1px solid var(--rbr-border);
          }

          .rbr-srt-market-group:last-child {
            border-bottom: 0;
          }

          .rbr-srt-insight-strip {
            grid-template-columns: 1fr 1fr;
          }

          .rbr-srt-heatmap {
            grid-template-columns: repeat(2, 1fr);
          }

          .rbr-srt-heatmap-tile.large {
            grid-column: span 1;
          }

          .rbr-srt-today-watch {
            grid-template-columns: 1fr;
          }

          .rbr-srt-watch-score {
            padding-left: 0;
            padding-top: 12px;
            border-left: 0;
            border-top: 1px solid var(--rbr-border);
          }

          .rbr-srt-watch-action {
            display: block;
          }

          .rbr-srt-watch-action button {
            width: 100%;
          }

          .rbr-srt-subscription-bar {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px 12px;
          }

          .rbr-srt-subscription-price {
            grid-row: 1;
            grid-column: 2;
          }

          .rbr-srt-subscription-button {
            grid-column: 1 / -1;
          }

          .rbr-srt-methodology {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .rbr-srt-rrg {
            height: 410px;
            margin-left: 20px;
            margin-right: 20px;
          }

          .rbr-srt-rrg-title span {
            display: none;
          }

          .rbr-srt-performance-grid {
            grid-template-columns: 1fr;
          }

          .rbr-srt-sector-detail-header {
            flex-direction: column;
          }

          .rbr-srt-big-score {
            text-align: left;
          }

          .rbr-srt-sector-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .rbr-srt-sector-stats > div:nth-child(3n) {
            border-right: 1px solid var(--rbr-border);
          }

          .rbr-srt-sector-stats > div:nth-child(2n) {
            border-right: 0;
          }

          .rbr-srt-detail-columns {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .rbr-srt-title-row h1 {
            font-size: 27px;
          }

          .rbr-srt-insight-strip {
            grid-template-columns: 1fr;
          }

          .rbr-srt-market-overview {
            padding: 14px;
          }

          .rbr-srt-panel-header {
            padding: 15px;
          }

          .rbr-srt-heatmap {
            grid-auto-rows: 82px;
          }

          .rbr-srt-sector-stats {
            grid-template-columns: 1fr;
          }

          .rbr-srt-sector-stats > div {
            border-right: 0 !important;
          }

          .rbr-srt-sector-picker {
            align-items: flex-start;
            flex-direction: column;
          }

          .rbr-srt-sector-picker select {
            width: 100%;
          }
        }
      `}</style>

      <main className="rbr-srt-page">
        <header className="rbr-srt-page-header">
          <div className="rbr-srt-container rbr-srt-header-inner">
            <div className="rbr-srt-breadcrumb">
              Home / Markets / <b>India Sector Rotation Tracker</b>
            </div>

            <div className="rbr-srt-title-row">
              <div>
                <h1>India Sector Rotation Tracker</h1>

                <p>
                  Track sector leadership, relative strength and momentum
                  across Indian equities.
                </p>
              </div>

              <div className="rbr-srt-update-box">
                <span className="rbr-srt-live">
                  Daily market intelligence
                </span>

                <strong>Updates every day at 10:00 AM IST</strong>

                <span>
                  Rotation scores, performance and sector positioning
                </span>
              </div>
            </div>

            <nav
              className="rbr-srt-main-tabs"
              aria-label="Sector rotation tracker sections"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`rbr-srt-main-tab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab.label}

                  {tab.premium && !hasSubscription && (
                    <span className="rbr-srt-tab-premium">◆</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="rbr-srt-container rbr-srt-body">
          {CONFIG.showSampleDataNotice && (
            <div className="rbr-srt-sample-notice">
              <strong>Preview:</strong>

              <span>
                The values currently displayed are sample data used while we
                build the tracker. Live market data will replace these values
                before the paid service is activated.
              </span>
            </div>
          )}

          {activeTab === "overview" && renderOverview()}

          {activeTab === "rotation" &&
            hasSubscription &&
            renderRotationMap()}

          {activeTab === "ranking" &&
            hasSubscription &&
            renderRanking()}

          {activeTab === "performance" &&
            hasSubscription &&
            renderPerformance()}

          {activeTab === "details" &&
            hasSubscription &&
            renderDetails()}

          {!hasSubscription && (
            <div className="rbr-srt-subscription-bar">
              <div className="rbr-srt-subscription-copy">
                <strong>India Sector Rotation Tracker</strong>

                <span>
                  Complete rankings, rotation map, history and sector
                  intelligence
                </span>
              </div>

              <div className="rbr-srt-subscription-price">
                <strong>₹{CONFIG.monthlyPrice}</strong>
                <span> / month</span>
              </div>

              <button
                type="button"
                className="rbr-srt-subscription-button"
                onClick={handlePremiumAction}
              >
                Unlock Full Tracker
              </button>
            </div>
          )}

          <section className="rbr-srt-methodology">
            <div>
              <span className="rbr-srt-kicker">ABOUT THE TRACKER</span>
              <h3>Understanding sector rotation</h3>
            </div>

            <div>
              <p>
                <strong>Leading</strong> sectors display comparatively strong
                relative strength and momentum. <strong>Improving</strong>{" "}
                sectors are gaining momentum and may be moving toward
                leadership.
              </p>

              <p>
                <strong>Weakening</strong> sectors may still have relative
                strength but are losing momentum. <strong>Lagging</strong>{" "}
                sectors currently show comparatively weaker relative strength
                and momentum.
              </p>

              <p className="rbr-srt-disclaimer">
                The India Sector Rotation Tracker is provided for informational
                and research purposes only. It does not constitute investment
                advice, a securities recommendation or a solicitation to buy
                or sell any security. Market conditions may change rapidly,
                and past performance does not guarantee future results.
              </p>
            </div>
          </section>
        </div>
      </main>

      {modal === "login" && (
        <div
          className="rbr-srt-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="rbr-srt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rbr-srt-modal-icon">→</div>

            <h3>Sign in to continue</h3>

            <p>
              Sign in to your Rajan Business Reports account to access or
              subscribe to the complete India Sector Rotation Tracker.
            </p>

            <div className="rbr-srt-modal-actions">
              <button
                type="button"
                className="rbr-srt-modal-secondary"
                onClick={() => setModal(null)}
              >
                Not now
              </button>

              <button
                type="button"
                className="rbr-srt-modal-primary"
                onClick={() => {
                  /*
                    TEMPORARY.

                    Later we will connect this directly to your existing
                    RBR login flow.

                    For now, taking the visitor to the main RBR page
                    gives them access to the existing login interface.
                  */
                  window.location.href = "/";
                }}
              >
                Sign in
              </button>
            </div>

            <p className="rbr-srt-modal-note">
              Existing RBR login integration will be connected directly in a
              later step.
            </p>
          </div>
        </div>
      )}

      {modal === "subscribe" && (
        <div
          className="rbr-srt-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="rbr-srt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rbr-srt-modal-icon">◆</div>

            <h3>Unlock the full tracker</h3>

            <p>
              Get complete daily sector rotation intelligence across Indian
              equities.
            </p>

            <div className="rbr-srt-modal-price">
              <strong>₹{CONFIG.monthlyPrice}</strong>
              <span> / month</span>
            </div>

            <ul className="rbr-srt-modal-features">
              <li>Complete sector rotation map</li>
              <li>Full sector ranking and rotation scores</li>
              <li>1D, 5D, 1M, 3M, 6M and 1Y comparisons</li>
              <li>Sector-level deep dives</li>
              <li>Stocks driving sector movement</li>
              <li>Rotation history</li>
              <li>Daily update at 10:00 AM IST</li>
            </ul>

            <div className="rbr-srt-modal-actions">
              <button
                type="button"
                className="rbr-srt-modal-secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="rbr-srt-modal-primary"
                onClick={() => {
                  /*
                    RAZORPAY SUBSCRIPTION FLOW WILL BE CONNECTED HERE.
                  */
                }}
              >
                Subscribe
              </button>
            </div>

            <p className="rbr-srt-modal-note">
              Subscription checkout is not enabled yet. We will connect this
              button after the page design and live market-data feed are
              finalized.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default IndiaSectorRotationTracker;

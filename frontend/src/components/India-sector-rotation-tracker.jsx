import React, { useMemo, useState } from "react";

/*
  ============================================================
  RAJAN BUSINESS REPORTS
  INDIA SECTOR ROTATION TRACKER
  ============================================================

  CURRENT VERSION
  - Finance-portal inspired visual design
  - Strong sector heatmap
  - Compact / dense market presentation
  - Public overview
  - Premium tabs
  - Sample data only
  - No external npm package required

  TEMPORARY TEST:
  Change previewAsSubscriber to true to inspect premium tabs.

  LATER:
  1. Connect existing RBR login state.
  2. Connect ₹199/month subscription entitlement.
  3. Connect live 10 AM market-data API.
*/

const CONFIG = {
  previewAsSubscriber: false,
  showSampleDataNotice: true,
  monthlyPrice: 199,
};

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
    heatSize: "xl",
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
    heatSize: "lg",
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
    heatSize: "xl",
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
    heatSize: "md",
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
    heatSize: "lg",
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
    heatSize: "md",
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
    heatSize: "md",
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
    heatSize: "sm",
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
    heatSize: "sm",
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
    heatSize: "md",
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
    heatSize: "sm",
    sparkline: [53, 51, 48, 46, 44, 42, 39, 37, 36, 34, 33, 31],
  },
  {
    id: "consumer",
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
    heatSize: "sm",
    sparkline: [47, 45, 43, 41, 39, 37, 35, 34, 33, 34, 34, 35],
  },
];

const ROTATION_HISTORY = [
  {
    sector: "IT",
    old1: "Lagging",
    old2: "Improving",
    old3: "Improving",
    previous: "Improving",
    current: "Improving",
    change: 9,
  },
  {
    sector: "Auto",
    old1: "Improving",
    old2: "Leading",
    old3: "Leading",
    previous: "Leading",
    current: "Leading",
    change: 5,
  },
  {
    sector: "Metal",
    old1: "Improving",
    old2: "Leading",
    old3: "Leading",
    previous: "Leading",
    current: "Leading",
    change: 2,
  },
  {
    sector: "Pharma",
    old1: "Leading",
    old2: "Leading",
    old3: "Weakening",
    previous: "Weakening",
    current: "Weakening",
    change: -8,
  },
  {
    sector: "Realty",
    old1: "Lagging",
    old2: "Improving",
    old3: "Improving",
    previous: "Improving",
    current: "Improving",
    change: 7,
  },
];

const STOCK_DRIVERS = {
  Auto: [
    { name: "Mahindra & Mahindra", move: 1.7 },
    { name: "Maruti Suzuki", move: 1.2 },
    { name: "Bajaj Auto", move: 0.9 },
    { name: "Eicher Motors", move: 0.6 },
  ],
  IT: [
    { name: "Infosys", move: 1.8 },
    { name: "TCS", move: 1.4 },
    { name: "HCL Technologies", move: 1.1 },
    { name: "Tech Mahindra", move: 0.8 },
  ],
  Metal: [
    { name: "Tata Steel", move: 1.3 },
    { name: "Hindalco", move: 1.1 },
    { name: "JSW Steel", move: 0.8 },
    { name: "Vedanta", move: 0.6 },
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
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function movementClass(value) {
  if (value > 0) return "srt-positive";
  if (value < 0) return "srt-negative";
  return "srt-neutral";
}

function statusClass(status) {
  return `srt-${status.toLowerCase()}`;
}

function Sparkline({ values, status }) {
  const width = 104;
  const height = 30;
  const padding = 2;

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
      className={`srt-sparkline ${statusClass(status)}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`srt-status ${statusClass(status)}`}>
      <i />
      {status}
    </span>
  );
}

function IndiaSectorRotationTracker() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("1M");
  const [heatMetric, setHeatMetric] = useState("rotation");
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

  const leading = SECTORS.filter((x) => x.status === "Leading");
  const improving = SECTORS.filter((x) => x.status === "Improving");
  const weakening = SECTORS.filter((x) => x.status === "Weakening");
  const lagging = SECTORS.filter((x) => x.status === "Lagging");

  const strongest = sortedSectors[0];

  const fastestImproving = [...SECTORS].sort(
    (a, b) => b.scoreChange - a.scoreChange
  )[0];

  const fastestDeclining = [...SECTORS].sort(
    (a, b) => a.scoreChange - b.scoreChange
  )[0];

  const strengtheningCount = leading.length + improving.length;

  const getTimeValue = (sector) => {
    if (timeframe === "1D") return sector.oneDay;
    if (timeframe === "5D") return sector.fiveDay;
    if (timeframe === "1M") return sector.oneMonth;
    if (timeframe === "3M") return sector.threeMonth;
    if (timeframe === "6M") return sector.sixMonth;
    return sector.oneYear;
  };

  const getHeatValue = (sector) => {
    if (heatMetric === "1D") return formatPercent(sector.oneDay);
    if (heatMetric === "5D") return formatPercent(sector.fiveDay);
    if (heatMetric === "1M") return formatPercent(sector.oneMonth);
    return `${sector.score}`;
  };

  const getHeatTileClass = (sector) => {
    if (heatMetric === "rotation") {
      return statusClass(sector.status);
    }

    const value =
      heatMetric === "1D"
        ? sector.oneDay
        : heatMetric === "5D"
        ? sector.fiveDay
        : sector.oneMonth;

    if (value >= 2) return "srt-heat-strong-positive";
    if (value > 0) return "srt-heat-positive";
    if (value <= -2) return "srt-heat-strong-negative";
    if (value < 0) return "srt-heat-negative";

    return "srt-heat-neutral";
  };

  const requestPremium = () => {
    if (!isLoggedIn) {
      setModal("login");
      return;
    }

    setModal("subscribe");
  };

  const handleTab = (tab) => {
    if (!tab.premium || hasSubscription) {
      setActiveTab(tab.id);
      return;
    }

    requestPremium();
  };

  const renderSummaryStrip = () => (
    <div className="srt-summary-strip">
      <div className="srt-summary-item">
        <span>TOP SECTOR</span>

        <div>
          <strong>{strongest.shortName}</strong>
          <b>{strongest.score}</b>
          <em className="srt-positive">
            ▲ {strongest.scoreChange}
          </em>
        </div>
      </div>

      <div className="srt-summary-item">
        <span>FASTEST IMPROVING</span>

        <div>
          <strong>{fastestImproving.shortName}</strong>
          <b>{fastestImproving.score}</b>
          <em className="srt-positive">
            ▲ {fastestImproving.scoreChange}
          </em>
        </div>
      </div>

      <div className="srt-summary-item">
        <span>LOSING MOMENTUM</span>

        <div>
          <strong>{fastestDeclining.shortName}</strong>
          <b>{fastestDeclining.score}</b>
          <em className="srt-negative">
            ▼ {Math.abs(fastestDeclining.scoreChange)}
          </em>
        </div>
      </div>

      <div className="srt-summary-item">
        <span>MARKET BREADTH</span>

        <div>
          <strong>{strengtheningCount} / {SECTORS.length}</strong>
          <em className="srt-positive">Positive</em>
        </div>
      </div>
    </div>
  );

  const renderHeatmap = () => (
    <section className="srt-card srt-heatmap-card">
      <div className="srt-card-header">
        <div>
          <h2>Sector Heatmap</h2>
          <p>
            Quickly identify market leadership and relative sector strength.
          </p>
        </div>

        <div className="srt-selector">
          {[
            ["rotation", "Rotation"],
            ["1D", "1D"],
            ["5D", "5D"],
            ["1M", "1M"],
          ].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={heatMetric === id ? "active" : ""}
              onClick={() => setHeatMetric(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="srt-heatmap">
        {SECTORS.map((sector) => (
          <button
            key={sector.id}
            type="button"
            className={`
              srt-heat-tile
              ${sector.heatSize}
              ${getHeatTileClass(sector)}
            `}
            onClick={() => {
              if (!hasSubscription) {
                requestPremium();
                return;
              }

              setSelectedSectorId(sector.id);
              setActiveTab("details");
            }}
          >
            <div className="srt-heat-top">
              <strong>{sector.shortName}</strong>

              <span
                className={
                  sector.scoreChange >= 0
                    ? "srt-positive"
                    : "srt-negative"
                }
              >
                {sector.scoreChange >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(sector.scoreChange)}
              </span>
            </div>

            <span className="srt-heat-status">
              {heatMetric === "rotation"
                ? sector.status
                : `${heatMetric} performance`}
            </span>

            <b className="srt-heat-number">
              {heatMetric === "rotation"
                ? `Score ${sector.score}`
                : getHeatValue(sector)}
            </b>
          </button>
        ))}
      </div>
    </section>
  );

  const renderPublicLeaderboard = () => (
    <section className="srt-card">
      <div className="srt-card-header">
        <div>
          <h2>Sector Leaderboard</h2>
          <p>
            Ranking by current rotation score and market momentum.
          </p>
        </div>

        <div className="srt-selector">
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

      <div className="srt-table-scroll">
        <table className="srt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sector</th>
              <th>Status</th>
              <th>1D</th>
              <th>5D</th>
              <th>1M</th>
              <th>Score</th>
              <th>Change</th>
              <th>Momentum</th>
              <th>Trend</th>
            </tr>
          </thead>

          <tbody>
            {sortedSectors.slice(0, 5).map((sector, index) => (
              <tr key={sector.id}>
                <td className="srt-rank">{index + 1}</td>

                <td>
                  <strong className="srt-sector-name">
                    {sector.name}
                  </strong>
                </td>

                <td>
                  <StatusBadge status={sector.status} />
                </td>

                <td className={movementClass(sector.oneDay)}>
                  {formatPercent(sector.oneDay)}
                </td>

                <td className={movementClass(sector.fiveDay)}>
                  {formatPercent(sector.fiveDay)}
                </td>

                <td className={movementClass(sector.oneMonth)}>
                  {formatPercent(sector.oneMonth)}
                </td>

                <td>
                  <div className="srt-score">
                    <strong>{sector.score}</strong>

                    <span>
                      <i
                        className={statusClass(sector.status)}
                        style={{ width: `${sector.score}%` }}
                      />
                    </span>
                  </div>
                </td>

                <td
                  className={
                    sector.scoreChange >= 0
                      ? "srt-positive"
                      : "srt-negative"
                  }
                >
                  <strong>
                    {sector.scoreChange > 0 ? "+" : ""}
                    {sector.scoreChange}
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
                  key={sector.id}
                  className="srt-teaser-row"
                >
                  <td className="srt-rank">{index + 6}</td>

                  <td>
                    <strong className="srt-sector-name">
                      {sector.name}
                    </strong>
                  </td>

                  <td>
                    <StatusBadge status={sector.status} />
                  </td>

                  <td>••••</td>
                  <td>••••</td>
                  <td>••••</td>
                  <td>••</td>
                  <td>••</td>
                  <td>Subscriber</td>
                  <td>••••••</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!hasSubscription && (
        <div className="srt-table-footer">
          <div>
            <strong>Show all {SECTORS.length} sectors</strong>

            <span>
              Complete scores, performance, momentum and rotation history.
            </span>
          </div>

          <button type="button" onClick={requestPremium}>
            Full tracker ₹{CONFIG.monthlyPrice}/month
          </button>
        </div>
      )}
    </section>
  );

  const renderMarketGroups = () => {
    const groups = [
      ["Leading", leading],
      ["Improving", improving],
      ["Weakening", weakening],
      ["Lagging", lagging],
    ];

    return (
      <section className="srt-card">
        <div className="srt-card-header srt-compact-heading">
          <div>
            <h2>Market Rotation</h2>

            <p>
              Current position of major Indian equity sectors.
            </p>
          </div>

          <span className="srt-market-positive">
            ● Market breadth positive
          </span>
        </div>

        <div className="srt-group-grid">
          {groups.map(([title, sectors]) => (
            <div
              className={`srt-group-column ${statusClass(title)}`}
              key={title}
            >
              <div className="srt-group-title">
                <div>
                  <i />
                  <strong>{title}</strong>
                </div>

                <span>{sectors.length}</span>
              </div>

              {sectors.map((sector) => (
                <div className="srt-group-sector" key={sector.id}>
                  <div>
                    <strong>{sector.shortName}</strong>
                    <span>Score {sector.score}</span>
                  </div>

                  <b
                    className={
                      sector.scoreChange >= 0
                        ? "srt-positive"
                        : "srt-negative"
                    }
                  >
                    {sector.scoreChange >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(sector.scoreChange)}
                  </b>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderRotationWatch = () => (
    <section className="srt-watch">
      <div className="srt-watch-copy">
        <span>TODAY'S ROTATION WATCH</span>

        <h2>IT is gaining momentum toward market leadership</h2>

        <p>
          IT currently has the strongest positive change in rotation
          score among the tracked sectors.
        </p>
      </div>

      <div className="srt-watch-metric">
        <span>ROTATION SCORE</span>
        <strong>79</strong>
        <b className="srt-positive">▲ 9</b>
      </div>

      <button type="button" onClick={requestPremium}>
        Why is IT improving?
        <span>Subscriber analysis</span>
      </button>
    </section>
  );

  const renderOverview = () => (
    <>
      {renderSummaryStrip()}

      <div className="srt-overview-grid">
        <div className="srt-overview-main">
          {renderHeatmap()}
        </div>

        <div className="srt-overview-side">
          {renderMarketGroups()}
        </div>
      </div>

      {renderPublicLeaderboard()}

      {renderRotationWatch()}
    </>
  );

  const renderRotationMap = () => (
    <>
      <section className="srt-card">
        <div className="srt-card-header">
          <div>
            <h2>Sector Rotation Map</h2>

            <p>
              Relative strength versus momentum across the four rotation
              phases.
            </p>
          </div>
        </div>

        <div className="srt-rrg-wrapper">
          <div className="srt-y-label">MOMENTUM ↑</div>

          <div className="srt-rrg">
            <div className="srt-quadrant improving">
              <div className="srt-quadrant-title">
                <strong>IMPROVING</strong>
                <span>Momentum rising</span>
              </div>

              {improving.map((sector, index) => (
                <div
                  key={sector.id}
                  className="srt-rrg-point improving"
                  style={{
                    left: `${22 + index * 17}%`,
                    top: `${40 + (index % 2) * 22}%`,
                  }}
                >
                  <i />
                  <span>{sector.shortName}</span>
                </div>
              ))}
            </div>

            <div className="srt-quadrant leading">
              <div className="srt-quadrant-title">
                <strong>LEADING</strong>
                <span>Strong relative momentum</span>
              </div>

              {leading.map((sector, index) => (
                <div
                  key={sector.id}
                  className="srt-rrg-point leading"
                  style={{
                    left: `${40 + index * 28}%`,
                    top: `${38 + index * 20}%`,
                  }}
                >
                  <i />
                  <span>{sector.shortName}</span>
                </div>
              ))}
            </div>

            <div className="srt-quadrant lagging">
              <div className="srt-quadrant-title">
                <strong>LAGGING</strong>
                <span>Relative weakness</span>
              </div>

              {lagging.map((sector, index) => (
                <div
                  key={sector.id}
                  className="srt-rrg-point lagging"
                  style={{
                    left: `${22 + index * 19}%`,
                    top: `${38 + index * 17}%`,
                  }}
                >
                  <i />
                  <span>{sector.shortName}</span>
                </div>
              ))}
            </div>

            <div className="srt-quadrant weakening">
              <div className="srt-quadrant-title">
                <strong>WEAKENING</strong>
                <span>Momentum falling</span>
              </div>

              {weakening.map((sector, index) => (
                <div
                  key={sector.id}
                  className="srt-rrg-point weakening"
                  style={{
                    left: `${28 + index * 22}%`,
                    top: `${40 + index * 18}%`,
                  }}
                >
                  <i />
                  <span>{sector.shortName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="srt-x-label">
            RELATIVE STRENGTH →
          </div>
        </div>
      </section>

      <section className="srt-card">
        <div className="srt-card-header">
          <div>
            <h2>Recent Rotation History</h2>

            <p>
              How selected sectors have moved through rotation phases.
            </p>
          </div>
        </div>

        <div className="srt-table-scroll">
          <table className="srt-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>5 sessions ago</th>
                <th>4 sessions ago</th>
                <th>3 sessions ago</th>
                <th>Previous</th>
                <th>Current</th>
                <th>Score change</th>
              </tr>
            </thead>

            <tbody>
              {ROTATION_HISTORY.map((item) => (
                <tr key={item.sector}>
                  <td>
                    <strong>{item.sector}</strong>
                  </td>
                  <td>{item.old1}</td>
                  <td>{item.old2}</td>
                  <td>{item.old3}</td>
                  <td>{item.previous}</td>

                  <td>
                    <StatusBadge status={item.current} />
                  </td>

                  <td
                    className={
                      item.change >= 0
                        ? "srt-positive"
                        : "srt-negative"
                    }
                  >
                    <strong>
                      {item.change >= 0 ? "+" : ""}
                      {item.change}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderRanking = () => (
    <section className="srt-card">
      <div className="srt-card-header">
        <div>
          <h2>Complete Sector Ranking</h2>
          <p>
            Compare rotation score, trend and multi-period performance.
          </p>
        </div>

        <div className="srt-selector">
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

      <div className="srt-table-scroll">
        <table className="srt-table srt-full-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sector</th>
              <th>Status</th>
              <th>1D</th>
              <th>5D</th>
              <th>1M</th>
              <th>3M</th>
              <th>Rotation score</th>
              <th>Change</th>
              <th>Momentum</th>
              <th>Trend</th>
            </tr>
          </thead>

          <tbody>
            {sortedSectors.map((sector, index) => (
              <tr key={sector.id}>
                <td className="srt-rank">{index + 1}</td>

                <td>
                  <button
                    type="button"
                    className="srt-sector-link"
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

                <td className={movementClass(sector.oneDay)}>
                  {formatPercent(sector.oneDay)}
                </td>

                <td className={movementClass(sector.fiveDay)}>
                  {formatPercent(sector.fiveDay)}
                </td>

                <td className={movementClass(sector.oneMonth)}>
                  {formatPercent(sector.oneMonth)}
                </td>

                <td className={movementClass(sector.threeMonth)}>
                  {formatPercent(sector.threeMonth)}
                </td>

                <td>
                  <div className="srt-score">
                    <strong>{sector.score}</strong>

                    <span>
                      <i
                        className={statusClass(sector.status)}
                        style={{ width: `${sector.score}%` }}
                      />
                    </span>
                  </div>
                </td>

                <td
                  className={
                    sector.scoreChange >= 0
                      ? "srt-positive"
                      : "srt-negative"
                  }
                >
                  {sector.scoreChange > 0 ? "+" : ""}
                  {sector.scoreChange}
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
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderPerformance = () => (
    <section className="srt-card">
      <div className="srt-card-header">
        <div>
          <h2>Sector Performance</h2>
          <p>
            Multi-period performance alongside current rotation position.
          </p>
        </div>
      </div>

      <div className="srt-performance-grid">
        {sortedSectors.map((sector) => (
          <button
            type="button"
            key={sector.id}
            className="srt-performance-tile"
            onClick={() => {
              setSelectedSectorId(sector.id);
              setActiveTab("details");
            }}
          >
            <div className="srt-performance-heading">
              <div>
                <strong>{sector.shortName}</strong>
                <StatusBadge status={sector.status} />
              </div>

              <b>{sector.score}</b>
            </div>

            <Sparkline
              values={sector.sparkline}
              status={sector.status}
            />

            <div className="srt-performance-values">
              <div>
                <span>1D</span>
                <strong className={movementClass(sector.oneDay)}>
                  {formatPercent(sector.oneDay)}
                </strong>
              </div>

              <div>
                <span>1M</span>
                <strong className={movementClass(sector.oneMonth)}>
                  {formatPercent(sector.oneMonth)}
                </strong>
              </div>

              <div>
                <span>3M</span>
                <strong className={movementClass(sector.threeMonth)}>
                  {formatPercent(sector.threeMonth)}
                </strong>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );

  const renderDetails = () => {
    const drivers =
      STOCK_DRIVERS[selectedSector.shortName] || STOCK_DRIVERS.IT;

    return (
      <>
        <section className="srt-card">
          <div className="srt-sector-picker">
            <span>SELECT SECTOR</span>

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

          <div className="srt-detail-header">
            <div>
              <span className="srt-label">SECTOR DEEP DIVE</span>

              <h1>{selectedSector.name}</h1>

              <div className="srt-detail-status">
                <StatusBadge status={selectedSector.status} />

                <span>
                  Momentum:
                  <strong> {selectedSector.momentum}</strong>
                </span>
              </div>
            </div>

            <div className="srt-big-score">
              <span>RBR ROTATION SCORE</span>
              <strong>{selectedSector.score}</strong>

              <b
                className={
                  selectedSector.scoreChange >= 0
                    ? "srt-positive"
                    : "srt-negative"
                }
              >
                {selectedSector.scoreChange >= 0 ? "▲" : "▼"}{" "}
                {Math.abs(selectedSector.scoreChange)}
              </b>
            </div>
          </div>

          <div className="srt-detail-metrics">
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

        <div className="srt-detail-grid">
          <section className="srt-card">
            <div className="srt-card-header">
              <h2>Performance</h2>
            </div>

            <div className="srt-detail-list">
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

                  <strong className={movementClass(value)}>
                    {formatPercent(value)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section className="srt-card">
            <div className="srt-card-header">
              <h2>Stocks Driving Movement</h2>
            </div>

            <div className="srt-driver-list">
              {drivers.map((stock, index) => (
                <div key={stock.name}>
                  <span>{index + 1}</span>
                  <strong>{stock.name}</strong>

                  <b className={movementClass(stock.move)}>
                    {formatPercent(stock.move)}
                  </b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  };

  return (
    <>
      <style>{`
        .srt-page {
          --ink: #202b38;
          --muted: #697687;
          --border: #dde3ea;
          --soft: #f5f7f9;
          --blue: #1670cf;
          --blue-dark: #0e59ad;
          --green: #17835c;
          --red: #bd4d4d;
          --amber: #a66b13;

          background: #f4f6f8;
          min-height: 100vh;
          color: var(--ink);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;
          text-align: left;
        }

        .srt-page * {
          box-sizing: border-box;
        }

        .srt-container {
          width: min(1240px, calc(100% - 32px));
          margin: 0 auto;
        }

        /* HEADER */

        .srt-header {
          background: #fff;
          border-bottom: 1px solid var(--border);
        }

        .srt-header-inner {
          padding-top: 20px;
        }

        .srt-breadcrumb {
          color: #758192;
          font-size: 11px;
          margin-bottom: 16px;
        }

        .srt-breadcrumb strong {
          color: #465365;
          font-weight: 600;
        }

        .srt-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          padding-bottom: 17px;
        }

        .srt-title-row h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: -0.035em;
          font-weight: 730;
        }

        .srt-title-row p {
          margin: 6px 0 0;
          color: var(--muted);
          font-size: 13px;
        }

        .srt-update {
          text-align: right;
        }

        .srt-update span,
        .srt-update strong {
          display: block;
        }

        .srt-update span:first-child {
          margin-bottom: 4px;
          color: var(--green);
          font-size: 10px;
          font-weight: 650;
        }

        .srt-update strong {
          font-size: 12px;
        }

        .srt-update span:last-child {
          margin-top: 3px;
          color: var(--muted);
          font-size: 9px;
        }

        .srt-tabs {
          display: flex;
          gap: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .srt-tabs::-webkit-scrollbar {
          display: none;
        }

        .srt-tabs button {
          position: relative;
          border: 0;
          background: transparent;
          padding: 11px 15px 13px;
          color: #5e6b7d;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .srt-tabs button:hover,
        .srt-tabs button.active {
          color: var(--blue);
        }

        .srt-tabs button.active::after {
          content: "";
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 0;
          height: 3px;
          background: var(--blue);
        }

        .srt-tabs small {
          margin-left: 5px;
          color: #9ba5b2;
          font-size: 8px;
        }

        /* BODY */

        .srt-body {
          padding: 15px 0 70px;
        }

        .srt-preview-notice {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 10px;
          padding: 9px 12px;
          background: #fff9e7;
          border: 1px solid #e7d7a0;
          border-radius: 3px;
          color: #6f5e28;
          font-size: 10px;
        }

        /* SUMMARY BAR */

        .srt-summary-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          margin-bottom: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: #fff;
          overflow: hidden;
        }

        .srt-summary-item {
          padding: 12px 15px;
          border-right: 1px solid var(--border);
        }

        .srt-summary-item:last-child {
          border-right: 0;
        }

        .srt-summary-item > span {
          display: block;
          margin-bottom: 7px;
          color: #778394;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .07em;
        }

        .srt-summary-item > div {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .srt-summary-item strong {
          font-size: 17px;
        }

        .srt-summary-item b {
          color: #465365;
          font-size: 14px;
        }

        .srt-summary-item em {
          margin-left: auto;
          font-size: 10px;
          font-style: normal;
          font-weight: 650;
        }

        .srt-positive {
          color: var(--green) !important;
        }

        .srt-negative {
          color: var(--red) !important;
        }

        .srt-neutral {
          color: var(--muted) !important;
        }

        /* OVERVIEW GRID */

        .srt-overview-grid {
          display: grid;
          grid-template-columns: 1.45fr .75fr;
          gap: 10px;
          align-items: stretch;
        }

        .srt-card {
          margin-bottom: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: #fff;
          overflow: hidden;
        }

        .srt-overview-grid .srt-card {
          height: calc(100% - 10px);
        }

        .srt-card-header {
          min-height: 59px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 13px 15px;
          border-bottom: 1px solid var(--border);
        }

        .srt-card-header h2 {
          margin: 0;
          font-size: 16px;
          letter-spacing: -0.015em;
        }

        .srt-card-header p {
          margin: 3px 0 0;
          color: var(--muted);
          font-size: 9px;
        }

        .srt-selector {
          display: flex;
          border: 1px solid #dce2e9;
          border-radius: 3px;
          overflow: hidden;
          background: #fff;
        }

        .srt-selector button {
          border: 0;
          border-right: 1px solid #dce2e9;
          padding: 6px 9px;
          background: #fff;
          color: #5f6b7b;
          font-size: 9px;
          font-weight: 650;
          cursor: pointer;
        }

        .srt-selector button:last-child {
          border-right: 0;
        }

        .srt-selector button.active {
          background: #eaf3ff;
          color: var(--blue);
        }

        /* HEATMAP */

        .srt-heatmap {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-auto-rows: 92px;
          gap: 3px;
          padding: 4px;
          background: #e9edf2;
        }

        .srt-heat-tile {
          border: 0;
          border-radius: 2px;
          padding: 11px;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          transition:
            transform .1s ease,
            filter .1s ease;
        }

        .srt-heat-tile:hover {
          filter: brightness(.97);
          transform: translateY(-1px);
        }

        .srt-heat-tile.xl {
          grid-column: span 2;
          grid-row: span 2;
        }

        .srt-heat-tile.lg {
          grid-column: span 2;
        }

        .srt-heat-tile.md {
          grid-column: span 1;
        }

        .srt-heat-tile.sm {
          grid-column: span 1;
        }

        .srt-heat-tile.srt-leading {
          background: #cdebdc;
          color: #125b40;
        }

        .srt-heat-tile.srt-improving {
          background: #cfe2fb;
          color: #174e8e;
        }

        .srt-heat-tile.srt-weakening {
          background: #f8e4b8;
          color: #80540f;
        }

        .srt-heat-tile.srt-lagging {
          background: #efc8c8;
          color: #8e3838;
        }

        .srt-heat-strong-positive {
          background: #acdcbf;
          color: #0f5c39;
        }

        .srt-heat-positive {
          background: #d5eddf;
          color: #175e40;
        }

        .srt-heat-negative {
          background: #efd4d4;
          color: #903e3e;
        }

        .srt-heat-strong-negative {
          background: #e9b7b7;
          color: #843030;
        }

        .srt-heat-neutral {
          background: #e9edf1;
          color: #596677;
        }

        .srt-heat-top {
          display: flex;
          justify-content: space-between;
          gap: 7px;
        }

        .srt-heat-top strong {
          font-size: 14px;
        }

        .srt-heat-top span {
          font-size: 9px;
          font-weight: 700;
        }

        .srt-heat-status {
          display: block;
          margin-top: 3px;
          font-size: 9px;
          opacity: .75;
        }

        .srt-heat-number {
          display: block;
          margin-top: 11px;
          font-size: 15px;
        }

        .srt-heat-tile.xl .srt-heat-top strong {
          font-size: 21px;
        }

        .srt-heat-tile.xl .srt-heat-number {
          margin-top: 18px;
          font-size: 23px;
        }

        /* MARKET GROUPS */

        .srt-compact-heading {
          min-height: 59px;
        }

        .srt-market-positive {
          color: var(--green);
          font-size: 8px;
          font-weight: 600;
        }

        .srt-group-grid {
          display: grid;
          grid-template-columns: 1fr;
        }

        .srt-group-column {
          border-bottom: 1px solid var(--border);
        }

        .srt-group-column:last-child {
          border-bottom: 0;
        }

        .srt-group-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 11px;
          background: #f7f9fb;
          border-bottom: 1px solid #e8ecf1;
        }

        .srt-group-title > div {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .srt-group-title i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .srt-group-title strong {
          font-size: 9px;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .srt-group-title > span {
          color: #8791a0;
          font-size: 9px;
        }

        .srt-group-column.srt-leading .srt-group-title i {
          background: var(--green);
        }

        .srt-group-column.srt-improving .srt-group-title i {
          background: var(--blue);
        }

        .srt-group-column.srt-weakening .srt-group-title i {
          background: #d4962e;
        }

        .srt-group-column.srt-lagging .srt-group-title i {
          background: var(--red);
        }

        .srt-group-sector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 11px;
          border-bottom: 1px solid #edf0f4;
        }

        .srt-group-sector:last-child {
          border-bottom: 0;
        }

        .srt-group-sector > div {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }

        .srt-group-sector strong {
          font-size: 11px;
        }

        .srt-group-sector span {
          color: #8a95a3;
          font-size: 8px;
        }

        .srt-group-sector b {
          font-size: 8px;
        }

        /* TABLE */

        .srt-table-scroll {
          overflow-x: auto;
        }

        .srt-table {
          width: 100%;
          min-width: 900px;
          border-collapse: collapse;
        }

        .srt-table th {
          padding: 9px 11px;
          border-bottom: 1px solid var(--border);
          background: #f6f8fa;
          color: #758192;
          text-align: left;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .srt-table td {
          padding: 10px 11px;
          border-bottom: 1px solid #edf0f3;
          color: #485669;
          font-size: 10px;
          white-space: nowrap;
          vertical-align: middle;
        }

        .srt-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .srt-table tbody tr:hover {
          background: #fafbfd;
        }

        .srt-rank {
          width: 35px;
          color: #8994a3 !important;
        }

        .srt-sector-name {
          color: #263445;
          font-size: 11px;
        }

        .srt-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 650;
        }

        .srt-status i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .srt-status.srt-leading {
          background: #e5f4ec;
          color: #17674a;
        }

        .srt-status.srt-leading i {
          background: var(--green);
        }

        .srt-status.srt-improving {
          background: #e7f0fc;
          color: #205b9d;
        }

        .srt-status.srt-improving i {
          background: var(--blue);
        }

        .srt-status.srt-weakening {
          background: #fff1d8;
          color: #875a15;
        }

        .srt-status.srt-weakening i {
          background: #d4962e;
        }

        .srt-status.srt-lagging {
          background: #f8e3e3;
          color: #994343;
        }

        .srt-status.srt-lagging i {
          background: var(--red);
        }

        .srt-score {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .srt-score strong {
          width: 20px;
        }

        .srt-score > span {
          width: 55px;
          height: 4px;
          background: #e6ebef;
          border-radius: 5px;
          overflow: hidden;
        }

        .srt-score > span i {
          display: block;
          height: 100%;
        }

        .srt-score i.srt-leading {
          background: var(--green);
        }

        .srt-score i.srt-improving {
          background: var(--blue);
        }

        .srt-score i.srt-weakening {
          background: #d4962e;
        }

        .srt-score i.srt-lagging {
          background: var(--red);
        }

        .srt-sparkline {
          display: block;
          width: 68px;
          height: 22px;
        }

        .srt-sparkline.srt-leading polyline {
          stroke: var(--green);
        }

        .srt-sparkline.srt-improving polyline {
          stroke: var(--blue);
        }

        .srt-sparkline.srt-weakening polyline {
          stroke: #c68523;
        }

        .srt-sparkline.srt-lagging polyline {
          stroke: var(--red);
        }

        .srt-teaser-row {
          position: relative;
          opacity: .44;
          filter: blur(2.4px);
          user-select: none;
        }

        .srt-table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 11px 14px;
          background: #fafbfd;
          border-top: 1px solid var(--border);
        }

        .srt-table-footer strong,
        .srt-table-footer span {
          display: block;
        }

        .srt-table-footer strong {
          font-size: 10px;
        }

        .srt-table-footer span {
          margin-top: 2px;
          color: var(--muted);
          font-size: 8px;
        }

        .srt-table-footer button,
        .srt-watch button,
        .srt-subscribe-bar button,
        .srt-modal-primary {
          border: 1px solid var(--blue);
          border-radius: 3px;
          background: var(--blue);
          color: #fff;
          cursor: pointer;
          font-weight: 650;
        }

        .srt-table-footer button {
          padding: 7px 11px;
          font-size: 9px;
        }

        /* WATCH */

        .srt-watch {
          display: grid;
          grid-template-columns: 1fr 120px 190px;
          align-items: center;
          gap: 20px;
          padding: 14px 16px;
          margin-bottom: 10px;
          border: 1px solid var(--border);
          border-left: 4px solid var(--blue);
          border-radius: 4px;
          background: #fff;
        }

        .srt-watch-copy > span {
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .07em;
          color: #758192;
        }

        .srt-watch-copy h2 {
          margin: 4px 0;
          font-size: 15px;
        }

        .srt-watch-copy p {
          margin: 0;
          color: var(--muted);
          font-size: 9px;
        }

        .srt-watch-metric {
          padding-left: 16px;
          border-left: 1px solid var(--border);
        }

        .srt-watch-metric span,
        .srt-watch-metric strong,
        .srt-watch-metric b {
          display: block;
        }

        .srt-watch-metric span {
          color: #7b8695;
          font-size: 7px;
          font-weight: 750;
        }

        .srt-watch-metric strong {
          font-size: 27px;
          line-height: 1.05;
        }

        .srt-watch-metric b {
          font-size: 9px;
        }

        .srt-watch button {
          padding: 8px 10px;
          font-size: 9px;
        }

        .srt-watch button span {
          display: block;
          margin-top: 2px;
          opacity: .72;
          font-size: 7px;
        }

        /* PREMIUM STICKY BAR */

        .srt-subscribe-bar {
          position: sticky;
          z-index: 30;
          bottom: 10px;
          display: flex;
          align-items: center;
          gap: 20px;
          width: min(920px, calc(100% - 20px));
          margin: 24px auto 0;
          padding: 10px 12px 10px 15px;
          border: 1px solid #cfd7e1;
          border-radius: 5px;
          background: rgba(255, 255, 255, .97);
          box-shadow: 0 8px 25px rgba(25, 40, 60, .13);
          backdrop-filter: blur(8px);
        }

        .srt-subscribe-copy {
          flex: 1;
        }

        .srt-subscribe-copy strong,
        .srt-subscribe-copy span {
          display: block;
        }

        .srt-subscribe-copy strong {
          font-size: 10px;
        }

        .srt-subscribe-copy span {
          margin-top: 2px;
          color: var(--muted);
          font-size: 8px;
        }

        .srt-subscribe-price strong {
          font-size: 16px;
        }

        .srt-subscribe-price span {
          color: var(--muted);
          font-size: 8px;
        }

        .srt-subscribe-bar button {
          padding: 7px 12px;
          font-size: 9px;
        }

        /* RRG */

        .srt-rrg-wrapper {
          position: relative;
          padding: 30px 30px 17px 48px;
        }

        .srt-rrg {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 470px;
          border: 1px solid #ced6df;
        }

        .srt-rrg::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          z-index: 4;
          background: #bec8d3;
        }

        .srt-rrg::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          z-index: 4;
          background: #bec8d3;
        }

        .srt-quadrant {
          position: relative;
          overflow: hidden;
        }

        .srt-quadrant.improving {
          background: #edf5ff;
        }

        .srt-quadrant.leading {
          background: #edf9f3;
        }

        .srt-quadrant.lagging {
          background: #fff1f1;
        }

        .srt-quadrant.weakening {
          background: #fff6e5;
        }

        .srt-quadrant-title {
          position: absolute;
          left: 13px;
          top: 12px;
          z-index: 5;
        }

        .srt-quadrant-title strong,
        .srt-quadrant-title span {
          display: block;
        }

        .srt-quadrant-title strong {
          font-size: 9px;
          letter-spacing: .06em;
        }

        .srt-quadrant-title span {
          margin-top: 2px;
          color: #7d8998;
          font-size: 7px;
        }

        .srt-rrg-point {
          position: absolute;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 5px;
          transform: translate(-50%, -50%);
          font-size: 9px;
          font-weight: 650;
        }

        .srt-rrg-point i {
          width: 10px;
          height: 10px;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 1px rgba(0,0,0,.1);
        }

        .srt-rrg-point.leading i {
          background: var(--green);
        }

        .srt-rrg-point.improving i {
          background: var(--blue);
        }

        .srt-rrg-point.weakening i {
          background: #d4962e;
        }

        .srt-rrg-point.lagging i {
          background: var(--red);
        }

        .srt-y-label,
        .srt-x-label {
          color: #7e8997;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .06em;
        }

        .srt-y-label {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: rotate(-90deg);
        }

        .srt-x-label {
          padding-top: 8px;
          text-align: center;
        }

        /* PERFORMANCE */

        .srt-performance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
        }

        .srt-performance-tile {
          border: 0;
          padding: 14px;
          background: #fff;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .srt-performance-tile:hover {
          background: #fafbfd;
        }

        .srt-performance-heading {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .srt-performance-heading > div > strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }

        .srt-performance-heading > b {
          font-size: 19px;
        }

        .srt-performance-tile .srt-sparkline {
          width: 100%;
          height: 38px;
          margin: 5px 0 11px;
        }

        .srt-performance-values {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          padding-top: 9px;
          border-top: 1px solid var(--border);
        }

        .srt-performance-values span,
        .srt-performance-values strong {
          display: block;
        }

        .srt-performance-values span {
          color: #84909f;
          font-size: 7px;
        }

        .srt-performance-values strong {
          margin-top: 2px;
          font-size: 9px;
        }

        /* DETAILS */

        .srt-sector-picker {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-bottom: 1px solid var(--border);
          background: #f7f9fb;
        }

        .srt-sector-picker span {
          color: #778393;
          font-size: 8px;
          font-weight: 700;
        }

        .srt-sector-picker select {
          min-width: 200px;
          border: 1px solid #d7dee6;
          border-radius: 3px;
          padding: 6px 7px;
          background: #fff;
          color: #354355;
          font-size: 9px;
        }

        .srt-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 18px 15px;
        }

        .srt-label {
          color: #7b8695;
          font-size: 8px;
          font-weight: 750;
          letter-spacing: .07em;
        }

        .srt-detail-header h1 {
          margin: 3px 0 8px;
          font-size: 26px;
        }

        .srt-detail-status {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .srt-detail-status > span {
          color: var(--muted);
          font-size: 9px;
        }

        .srt-big-score {
          text-align: right;
        }

        .srt-big-score span,
        .srt-big-score strong,
        .srt-big-score b {
          display: block;
        }

        .srt-big-score span {
          color: #7b8695;
          font-size: 7px;
          font-weight: 750;
        }

        .srt-big-score strong {
          font-size: 40px;
          line-height: 1;
        }

        .srt-big-score b {
          margin-top: 2px;
          font-size: 10px;
        }

        .srt-detail-metrics {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-top: 1px solid var(--border);
          background: #f9fafb;
        }

        .srt-detail-metrics div {
          padding: 10px 12px;
          border-right: 1px solid var(--border);
        }

        .srt-detail-metrics div:last-child {
          border-right: 0;
        }

        .srt-detail-metrics span,
        .srt-detail-metrics strong {
          display: block;
        }

        .srt-detail-metrics span {
          color: #808c9b;
          font-size: 7px;
        }

        .srt-detail-metrics strong {
          margin-top: 3px;
          font-size: 9px;
        }

        .srt-detail-grid {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 10px;
        }

        .srt-detail-list,
        .srt-driver-list {
          padding: 0 13px 8px;
        }

        .srt-detail-list > div {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid #edf0f3;
          font-size: 9px;
        }

        .srt-driver-list > div {
          display: grid;
          grid-template-columns: 25px 1fr auto;
          align-items: center;
          padding: 9px 0;
          border-bottom: 1px solid #edf0f3;
          font-size: 9px;
        }

        .srt-detail-list > div:last-child,
        .srt-driver-list > div:last-child {
          border-bottom: 0;
        }

        .srt-detail-list span,
        .srt-driver-list > div > span {
          color: #7c8796;
        }

        .srt-sector-link {
          border: 0;
          padding: 0;
          background: transparent;
          color: #1765ac;
          font-size: 10px;
          font-weight: 650;
          cursor: pointer;
        }

        /* METHODOLOGY */

        .srt-methodology {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 35px;
          padding: 22px 3px 10px;
          margin-top: 22px;
          border-top: 1px solid #d9dfe6;
        }

        .srt-methodology h3 {
          margin: 0;
          font-size: 14px;
        }

        .srt-methodology p {
          margin: 0 0 8px;
          color: var(--muted);
          font-size: 9px;
          line-height: 1.6;
        }

        .srt-methodology .srt-disclaimer {
          padding-top: 8px;
          border-top: 1px solid #dfe4ea;
          color: #8791a0;
          font-size: 8px;
        }

        /* MODAL */

        .srt-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: rgba(17, 29, 45, .58);
        }

        .srt-modal {
          width: min(410px, 100%);
          padding: 23px;
          border-radius: 6px;
          background: #fff;
          box-shadow: 0 20px 70px rgba(0,0,0,.24);
        }

        .srt-modal h3 {
          margin: 0 0 7px;
          font-size: 20px;
        }

        .srt-modal p {
          margin: 0;
          color: var(--muted);
          font-size: 10px;
          line-height: 1.6;
        }

        .srt-modal-price {
          margin-top: 16px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: #f8fafc;
        }

        .srt-modal-price strong {
          font-size: 23px;
        }

        .srt-modal-price span {
          color: var(--muted);
          font-size: 10px;
        }

        .srt-modal ul {
          margin: 15px 0 0;
          padding: 0;
          list-style: none;
        }

        .srt-modal li {
          padding: 4px 0;
          color: #586577;
          font-size: 9px;
        }

        .srt-modal li::before {
          content: "✓";
          margin-right: 7px;
          color: var(--green);
          font-weight: 700;
        }

        .srt-modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 18px;
        }

        .srt-modal-actions button {
          flex: 1;
          padding: 8px 9px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 9px;
          font-weight: 650;
        }

        .srt-modal-secondary {
          border: 1px solid var(--border);
          background: #fff;
          color: #465365;
        }

        .srt-modal-primary {
          border: 1px solid var(--blue);
        }

        .srt-modal-note {
          margin-top: 9px !important;
          color: #8c6d30 !important;
          font-size: 8px !important;
        }

        /* RESPONSIVE */

        @media (max-width: 1050px) {
          .srt-overview-grid {
            grid-template-columns: 1fr;
          }

          .srt-group-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .srt-group-column {
            border-right: 1px solid var(--border);
            border-bottom: 0;
          }

          .srt-group-column:last-child {
            border-right: 0;
          }

          .srt-performance-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 820px) {
          .srt-summary-strip {
            grid-template-columns: repeat(2, 1fr);
          }

          .srt-summary-item:nth-child(2) {
            border-right: 0;
          }

          .srt-summary-item:nth-child(-n + 2) {
            border-bottom: 1px solid var(--border);
          }

          .srt-group-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .srt-group-column:nth-child(2) {
            border-right: 0;
          }

          .srt-group-column:nth-child(-n + 2) {
            border-bottom: 1px solid var(--border);
          }

          .srt-heatmap {
            grid-template-columns: repeat(4, 1fr);
          }

          .srt-watch {
            grid-template-columns: 1fr 100px;
          }

          .srt-watch button {
            grid-column: 1 / -1;
          }

          .srt-detail-metrics {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 650px) {
          .srt-container {
            width: min(100% - 18px, 1240px);
          }

          .srt-title-row {
            flex-direction: column;
            gap: 11px;
          }

          .srt-update {
            text-align: left;
          }

          .srt-title-row h1 {
            font-size: 27px;
          }

          .srt-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .srt-selector {
            max-width: 100%;
            overflow-x: auto;
          }

          .srt-heatmap {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 88px;
          }

          .srt-heat-tile.xl,
          .srt-heat-tile.lg,
          .srt-heat-tile.md,
          .srt-heat-tile.sm {
            grid-column: span 1;
            grid-row: span 1;
          }

          .srt-heat-tile.xl .srt-heat-top strong {
            font-size: 14px;
          }

          .srt-heat-tile.xl .srt-heat-number {
            margin-top: 11px;
            font-size: 15px;
          }

          .srt-group-grid {
            grid-template-columns: 1fr;
          }

          .srt-group-column {
            border-right: 0;
            border-bottom: 1px solid var(--border);
          }

          .srt-watch {
            grid-template-columns: 1fr;
          }

          .srt-watch-metric {
            padding: 9px 0 0;
            border-left: 0;
            border-top: 1px solid var(--border);
          }

          .srt-subscribe-bar {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
          }

          .srt-subscribe-bar button {
            grid-column: 1 / -1;
          }

          .srt-performance-grid {
            grid-template-columns: 1fr;
          }

          .srt-detail-header {
            flex-direction: column;
          }

          .srt-big-score {
            text-align: left;
          }

          .srt-detail-metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .srt-detail-grid {
            grid-template-columns: 1fr;
          }

          .srt-methodology {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .srt-rrg {
            height: 390px;
          }
        }

        @media (max-width: 430px) {
          .srt-summary-strip {
            grid-template-columns: 1fr;
          }

          .srt-summary-item {
            border-right: 0;
            border-bottom: 1px solid var(--border);
          }

          .srt-summary-item:last-child {
            border-bottom: 0;
          }

          .srt-detail-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="srt-page">
        <header className="srt-header">
          <div className="srt-container srt-header-inner">
            <div className="srt-breadcrumb">
              Home / Markets /{" "}
              <strong>India Sector Rotation Tracker</strong>
            </div>

            <div className="srt-title-row">
              <div>
                <h1>India Sector Rotation Tracker</h1>

                <p>
                  Track sector leadership, relative strength and momentum
                  across Indian equities.
                </p>
              </div>

              <div className="srt-update">
                <span>● DAILY MARKET INTELLIGENCE</span>

                <strong>
                  Updates every day at 10:00 AM IST
                </strong>

                <span>
                  Sector rotation, performance and momentum
                </span>
              </div>
            </div>

            <nav className="srt-tabs">
              {TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => handleTab(tab)}
                >
                  {tab.label}

                  {tab.premium && !hasSubscription && (
                    <small>◆</small>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <div className="srt-container srt-body">
          {CONFIG.showSampleDataNotice && (
            <div className="srt-preview-notice">
              <strong>Preview:</strong>

              <span>
                Values shown below are sample data while the tracker is
                being built. Live market data will replace them before
                paid access is activated.
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
            <div className="srt-subscribe-bar">
              <div className="srt-subscribe-copy">
                <strong>
                  Unlock the complete India Sector Rotation Tracker
                </strong>

                <span>
                  Rotation map · complete rankings · history · sector
                  details
                </span>
              </div>

              <div className="srt-subscribe-price">
                <strong>₹{CONFIG.monthlyPrice}</strong>
                <span> / month</span>
              </div>

              <button type="button" onClick={requestPremium}>
                Unlock Full Tracker
              </button>
            </div>
          )}

          <section className="srt-methodology">
            <div>
              <h3>Understanding sector rotation</h3>
            </div>

            <div>
              <p>
                <strong>Leading</strong> sectors show comparatively
                strong relative strength and momentum.{" "}
                <strong>Improving</strong> sectors are gaining momentum
                and may be moving toward leadership.
              </p>

              <p>
                <strong>Weakening</strong> sectors may still have
                relative strength but are losing momentum.{" "}
                <strong>Lagging</strong> sectors currently show
                comparatively weaker relative strength and momentum.
              </p>

              <p className="srt-disclaimer">
                This tracker is provided for informational and research
                purposes only. It does not constitute investment advice,
                a recommendation or a solicitation to buy or sell any
                security. Market conditions may change rapidly and past
                performance does not guarantee future results.
              </p>
            </div>
          </section>
        </div>
      </main>

      {modal === "login" && (
        <div
          className="srt-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="srt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Sign in to continue</h3>

            <p>
              Sign in to your Rajan Business Reports account to access
              the complete India Sector Rotation Tracker.
            </p>

            <div className="srt-modal-actions">
              <button
                type="button"
                className="srt-modal-secondary"
                onClick={() => setModal(null)}
              >
                Not now
              </button>

              <button
                type="button"
                className="srt-modal-primary"
                onClick={() => {
                  /*
                    Later:
                    Replace this with your existing RBR login modal /
                    login action.
                  */

                  window.location.href = "/";
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "subscribe" && (
        <div
          className="srt-modal-backdrop"
          onClick={() => setModal(null)}
        >
          <div
            className="srt-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Unlock the full tracker</h3>

            <p>
              Access complete daily sector rotation intelligence across
              Indian equities.
            </p>

            <div className="srt-modal-price">
              <strong>₹{CONFIG.monthlyPrice}</strong>
              <span> / month</span>
            </div>

            <ul>
              <li>Complete sector rotation map</li>
              <li>Full sector leaderboard</li>
              <li>1D, 5D, 1M, 3M, 6M and 1Y performance</li>
              <li>Sector deep dives</li>
              <li>Stocks driving sector movement</li>
              <li>Historical rotation tracking</li>
              <li>Daily update at 10:00 AM IST</li>
            </ul>

            <div className="srt-modal-actions">
              <button
                type="button"
                className="srt-modal-secondary"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="srt-modal-primary"
                onClick={() => {
                  /*
                    Razorpay subscription will be connected here.
                  */
                }}
              >
                Subscribe
              </button>
            </div>

            <p className="srt-modal-note">
              Subscription checkout is not active yet.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default IndiaSectorRotationTracker;

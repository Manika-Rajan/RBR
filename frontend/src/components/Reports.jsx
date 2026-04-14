import React from "react";
import Navbar from "./Navbar";
import ReportsMobile from "./ReportsMobile";

const Reports = () => {
  return (
    <>
      <Navbar reports />

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
          }}
        >
          <ReportsMobile />
        </div>
      </div>
    </>
  );
};

export default Reports;

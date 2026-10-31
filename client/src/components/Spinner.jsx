import React from "react";

function Spinner() {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="fixed top-0 inset-x-0 h-0.5 overflow-hidden z-[2000]"
    >
      <div className="loading-bar h-full w-1/4 bg-accent"></div>
    </div>
  );
}

export default Spinner;

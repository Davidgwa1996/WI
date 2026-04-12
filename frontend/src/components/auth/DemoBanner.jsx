import React from "react";
import { Link } from "react-router-dom";

const DemoBanner = () => {
  return (
    <div className="sticky top-0 z-50 bg-amber-500/90 py-2 text-center text-sm font-medium text-black backdrop-blur-sm">
      🔍 You are in preview mode.{" "}
      <Link to="/register" className="underline hover:no-underline">
        Sign up
      </Link>{" "}
      to create your own workspace and take actions.
    </div>
  );
};

export default DemoBanner;
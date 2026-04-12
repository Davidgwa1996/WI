import React from "react";
import { Link } from "react-router-dom";

const DemoBanner = () => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-center text-sm font-medium text-white shadow-lg backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-center gap-2 px-4">
        <span className="inline-block animate-pulse">🔍</span>
        <span>You are in preview mode – browse all features without an account.</span>
        <Link
          to="/register"
          className="ml-2 rounded-lg bg-white px-3 py-1 text-amber-600 transition hover:bg-amber-50"
        >
          Sign up free
        </Link>
        <span>or</span>
        <Link
          to="/login"
          className="rounded-lg bg-white/20 px-3 py-1 text-white transition hover:bg-white/30"
        >
          Log in
        </Link>
        <span>to take actions like creating invites, projects, and watchlists.</span>
      </div>
    </div>
  );
};

export default DemoBanner;
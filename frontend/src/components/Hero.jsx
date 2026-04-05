import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function Hero() {
  const appName = import.meta.env.VITE_APP_NAME || "Web3 Intel Platform";

  return (
    <section className="hero container">
      <StatusBadge label="Real-time AI-powered intelligence" active />
      <h1>{appName}</h1>
      <p>
        Track emerging Web3 opportunities, monitor live market and community signals,
        score projects with AI, and stream updates instantly through a production-style dashboard.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        <Link className="btn btn-primary" to="/dashboard">
          Open Live Dashboard
        </Link>
        <a className="btn btn-secondary" href="#features">
          Explore Features
        </a>
      </div>
    </section>
  );
}
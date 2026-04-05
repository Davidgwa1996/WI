import { Link } from "react-router-dom";

export default function Navbar() {
  const appName = import.meta.env.VITE_APP_NAME || "Web3 Intel Platform";

  return (
    <div className="container navbar">
      <div style={{ fontWeight: 800, fontSize: "1.25rem" }}>{appName}</div>

      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <Link className="btn btn-secondary" to="/dashboard">
          Live Dashboard
        </Link>
      </div>
    </div>
  );
}
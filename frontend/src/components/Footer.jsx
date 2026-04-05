export default function Footer() {
  return (
    <footer className="container" style={{ padding: "32px 0 52px" }}>
      <div
        className="card"
        style={{
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <div>
          <strong>Web3 Intel Platform</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            Real-time AI-powered intelligence for Web3 markets, projects, and signals.
          </div>
        </div>
        <div className="muted">Built with React, FastAPI, Redis, Celery, Railway, Netlify, and Docker.</div>
      </div>
    </footer>
  );
}
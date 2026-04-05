import SectionHeader from "./SectionHeader";

const features = [
  {
    title: "Live Web3 Intelligence",
    text: "Stream updates from major Web3 signals and surface meaningful insights without manual refresh."
  },
  {
    title: "AI Project Scoring",
    text: "Combine sentiment, momentum, funding probability, and market signals into one actionable score."
  },
  {
    title: "Community + Developer Signals",
    text: "Track traction through X, Discord, GitHub, CoinGecko, and DefiLlama in one unified view."
  },
  {
    title: "Real-Time Alerts",
    text: "Detect anomalies, sudden momentum spikes, and AI-generated alerts as soon as they happen."
  },
  {
    title: "Recruiter-Ready Architecture",
    text: "Structured like a real SaaS product with React, FastAPI, WebSockets, Redis, Celery, Docker, Railway, and Netlify."
  },
  {
    title: "Scalable API-first Backend",
    text: "Consume a versioned API and stream updates through WebSockets using a clean separation of frontend and backend."
  }
];

export default function Features() {
  return (
    <section id="features" className="section container">
      <SectionHeader
        eyebrow="Core capabilities"
        title="Built like a modern data product"
        subtitle="Designed to look strong in production, strong in interviews, and strong in a recruiter demo."
      />

      <div className="grid grid-3">
        {features.map((item) => (
          <div key={item.title} className="card" style={{ padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>{item.title}</h3>
            <p className="muted">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
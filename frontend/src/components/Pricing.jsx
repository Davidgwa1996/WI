import SectionHeader from "./SectionHeader";

export default function Pricing() {
  return (
    <section id="pricing" className="section container">
      <SectionHeader
        eyebrow="Monetisation"
        title="Pricing that fits the product story"
        subtitle="Simple SaaS packaging that supports your recruiter and investor narrative."
      />

      <div className="grid grid-3">
        <div className="card" style={{ padding: 24 }}>
          <h3>Free</h3>
          <div className="metric-big">$0</div>
          <p className="muted">Basic dashboard access, limited project views, and public intelligence snapshots.</p>
        </div>

        <div
          className="card"
          style={{
            padding: 24,
            border: "1px solid rgba(96, 165, 250, 0.35)"
          }}
        >
          <h3>Pro</h3>
          <div className="metric-big">$29/mo</div>
          <p className="muted">Full analytics, AI insights, alerts, and advanced project tracking.</p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3>Enterprise</h3>
          <div className="metric-big">Custom</div>
          <p className="muted">API access, custom integrations, priority support, and team workflows.</p>
        </div>
      </div>
    </section>
  );
}
export default function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {eyebrow ? (
        <div className="badge" style={{ marginBottom: 12 }}>
          {eyebrow}
        </div>
      ) : null}
      <h2 style={{ margin: 0, fontSize: "2rem" }}>{title}</h2>
      {subtitle ? (
        <p className="muted" style={{ marginTop: 10, maxWidth: 700 }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
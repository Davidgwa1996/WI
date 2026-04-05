export default function EmptyState({ title = "No data", message = "Nothing to show yet." }) {
  return (
    <div className="state-box">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
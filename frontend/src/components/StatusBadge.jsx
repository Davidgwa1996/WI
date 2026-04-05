export default function StatusBadge({ label, active = false }) {
  return (
    <span
      className="badge"
      style={{
        background: active
          ? "rgba(16, 185, 129, 0.12)"
          : "rgba(148, 163, 184, 0.1)",
        color: active ? "#34d399" : "#cbd5e1",
        borderColor: active
          ? "rgba(52, 211, 153, 0.25)"
          : "rgba(148, 163, 184, 0.16)"
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active ? "#34d399" : "#94a3b8",
          display: "inline-block"
        }}
      />
      {label}
    </span>
  );
}
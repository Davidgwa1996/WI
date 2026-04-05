export default function LoadingState({ message = "Loading..." }) {
  return (
    <div className="state-box">
      <h3 style={{ marginTop: 0 }}>Loading</h3>
      <p className="muted">{message}</p>
    </div>
  );
}
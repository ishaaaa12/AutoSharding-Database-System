export default function StatusBadge({ status }) {
  const colors = {
    UP: "green",
    NEAR_CAPACITY: "orange",
    FULL: "red",
    DOWN: "gray",
  };

  return (
    <span
      style={{
        backgroundColor: colors[status],
        color: "white",
        padding: "4px 8px",
        borderRadius: "6px",
      }}
    >
      {status}
    </span>
  );
}

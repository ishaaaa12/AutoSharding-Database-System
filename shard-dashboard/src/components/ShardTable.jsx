import StatusBadge from "./StatusBadge";

function RlBadge({ action, time }) {
  if (!action || action === "NONE") {
    return <span style={{ color: "#9ca3af" }}>—</span>;
  }

  const styles = {
    SPLIT: { color: "#dc2626", fontWeight: 600 },
    REBALANCE: { color: "#f59e0b", fontWeight: 600 },
  };

  return (
    <span style={styles[action]} title={time}>
      {action === "SPLIT" ? "🔪 Split" : "⚖️ Rebalance"}
    </span>
  );
}

export default function ShardTable({ shards }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Shard</th>
          <th>Range</th>
          <th>Users</th>
          <th>Utilization</th>
          <th>Status</th>
          <th>RL Action</th>
        </tr>
      </thead>
      <tbody>
        {shards.map((s) => (
          <tr key={s.shardId}>
            <td>{s.name}</td>
            <td>
              {s.rangeStart} – {s.rangeEnd}
            </td>
            <td>{s.userCount}</td>
            <td>{s.utilization}%</td>
            <td>
              <StatusBadge status={s.status} />
            </td>
            <td>
              <RlBadge
                action={s.lastRlAction}
                time={s.lastRlActionAt}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";

export default function UtilizationChart({ shards }) {
  const getBarColor = (util) => {
    if (util >= 90) return "#ef4444"; // red
    if (util >= 70) return "#fbbf24"; // amber
    return "#22c55e"; // green
    // green
  };

  return (
    <div style={{ marginBottom: "40px" }}>
      <h2>Shard Utilization (%)</h2>

      <BarChart width={750} height={320} data={shards}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />

        {/* Capacity threshold */}
        <ReferenceLine y={100} stroke="#000" strokeDasharray="4 4" />

        <Bar dataKey="utilization">
          {shards.map((s) => (
            <Cell key={s.shardId} fill={getBarColor(s.utilization)} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}

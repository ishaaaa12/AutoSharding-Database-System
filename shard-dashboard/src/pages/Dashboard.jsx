import { useEffect, useState } from "react";
import { fetchShardStats } from "../api/shardApi";
import ShardTable from "../components/ShardTable";
import UtilizationChart from "../components/UtilizationChart";

export default function Dashboard() {
  const [shards, setShards] = useState([]);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);
  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }
  async function loadData() {
    try {
      const data = await fetchShardStats();
      setShards(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalShards = shards.length;
  const fullShards = shards.filter((s) => s.status === "FULL").length;
  const avgUtilization =
    shards.length > 0
      ? Math.round(
          shards.reduce((sum, s) => sum + s.utilization, 0) / shards.length
        )
      : 0;

  const nextAction = shards.some((s) => s.status === "FULL")
    ? "Auto-split active"
    : "System stable";

  return (
    <div className="container">
      <div className="top-bar">
        <h1>Shard Monitoring Dashboard</h1>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard title="Total Shards" value={totalShards} />
        <SummaryCard title="Full Shards" value={fullShards} />
        <SummaryCard title="Avg Utilization" value={`${avgUtilization}%`} />
        <SummaryCard title="Next Action" value={nextAction} />
      </div>

      <UtilizationChart shards={shards} />
      <ShardTable shards={shards} />
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="summary-card">
      <p className="summary-title">{title}</p>
      <p className="summary-value">{value}</p>
    </div>
  );
}

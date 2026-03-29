const BASE_URL = "http://localhost:3000";

export async function fetchShardStats() {
  const res = await fetch(`${BASE_URL}/admin/shards/stats`);
  if (!res.ok) {
    throw new Error("Failed to fetch shard stats");
  }
  return res.json();
}

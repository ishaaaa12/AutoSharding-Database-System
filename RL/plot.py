import matplotlib.pyplot as plt

# Load RL rewards
with open("rl_rewards.txt") as f:
    rl_rewards = [float(line.strip()) for line in f]

episodes = list(range(len(rl_rewards)))

# Baseline reward (constant)
baseline_reward = -38.59  # from your baseline run
baseline_line = [baseline_reward] * len(episodes)

plt.figure(figsize=(10, 5))
plt.plot(episodes, rl_rewards, label="RL Policy", alpha=0.7)
plt.plot(episodes, baseline_line, "--", label="Baseline (Threshold)")

plt.xlabel("Episode")
plt.ylabel("Total Reward per Episode")
plt.title("RL-based Shard Scaling vs Threshold Baseline")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()

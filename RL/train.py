import json
from env import ShardEnv
from agent import QAgent

env = ShardEnv()
agent = QAgent()

episodes = 2000
episode_rewards = []

for ep in range(episodes):
    state = env.reset()
    total_reward = 0

    while True:
        action = agent.choose_action(state)
        next_state, reward, done = env.step(action)
        agent.learn(state, action, reward, next_state)

        state = next_state
        total_reward += reward

        if done:
            break

    episode_rewards.append(total_reward)

    if ep % 200 == 0:
        print(f"Episode {ep}, reward: {round(total_reward, 2)}")

# Save rewards for plotting
with open("rl_rewards.txt", "w") as f:
    for r in episode_rewards:
        f.write(f"{r}\n")
policy = agent.extract_policy()

print("\nLearned Policy (state -> action):")
for state, (action, value) in policy.items():
    print(f"{state} -> action {action} (Q={round(value, 2)})")

serializable_policy = {
    str(state): action_value[0]   # store only action, not Q-value
    for state, action_value in policy.items()
}

with open("policy.json", "w") as f:
    json.dump(serializable_policy, f, indent=2)

print("Policy saved to policy.json")
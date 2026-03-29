from env import ShardEnv

env = ShardEnv()
state = env.reset()
reward_sum = 0

while True:
    # Threshold policy
    action = 1 if env.shards[-1] >= 1000 else 0
    state, reward, done = env.step(action)
    reward_sum += reward
    if done:
        break

print("Baseline total reward:", reward_sum)

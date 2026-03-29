import random
from config import SHARD_MAX_ROWS, SPLIT_COST, REBALANCE_COST, HOT_SHARD_PENALTY

class ShardEnv:
    def __init__(self):
        self.reset()

    def reset(self):
        self.shards = [0]   # shard user counts
        self.time = 0
        return self._get_state()

    def _get_state(self):
        curr = self.shards[-1] / SHARD_MAX_ROWS
        prev = self.shards[-2] / SHARD_MAX_ROWS if len(self.shards) > 1 else 0
        return (round(curr, 1), round(prev, 1), len(self.shards))

    def step(self, action):
        reward = 0

        # Simulate inserts
        inserts = random.randint(50, 150)
        self.shards[-1] += inserts

        # Hot shard penalty
        if self.shards[-1] > SHARD_MAX_ROWS:
            reward -= HOT_SHARD_PENALTY

        # Action effects
        if action == 1:  # SPLIT
            reward -= SPLIT_COST
            overflow = max(0, self.shards[-1] - SHARD_MAX_ROWS)
            self.shards[-1] = SHARD_MAX_ROWS
            self.shards.append(overflow)

        elif action == 2 and len(self.shards) > 1:  # REBALANCE
            reward -= REBALANCE_COST
            move = int(0.2 * self.shards[-2])
            self.shards[-2] -= move
            self.shards[-1] += move

        # Balance reward
        variance = max(self.shards) - min(self.shards)
        reward += 1.0 / (1 + variance)

        self.time += 1
        done = self.time > 200

        return self._get_state(), reward, done

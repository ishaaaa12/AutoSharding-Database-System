import random
from config import ALPHA, GAMMA, EPSILON

class QAgent:
    def __init__(self):
        self.q = {}

    def get_q(self, state, action):
        return self.q.get((state, action), 0.0)

    def choose_action(self, state):
        import random
        if random.random() < EPSILON:
            return random.choice([0, 1, 2])
        qs = [self.get_q(state, a) for a in [0, 1, 2]]
        return qs.index(max(qs))

    def learn(self, state, action, reward, next_state):
        max_next = max(self.get_q(next_state, a) for a in [0, 1, 2])
        old = self.get_q(state, action)
        self.q[(state, action)] = old + ALPHA * (reward + GAMMA * max_next - old)

    # 🔥 NEW: extract policy
    def extract_policy(self):
        policy = {}
        for (state, action), value in self.q.items():
            if state not in policy or value > policy[state][1]:
                policy[state] = (action, value)
        return policy


from fastapi import FastAPI
import json

app = FastAPI()

with open("policy.json") as f:
    POLICY = json.load(f)

@app.post("/decide")
def decide(state: dict):
    key = str((
        round(float(state["currUtil"]), 1),
        round(float(state["nextUtil"]), 1),
        state["shardCount"]
    ))

    action = POLICY.get(key, 0)  # default: DO_NOTHING

    return {"action": action}

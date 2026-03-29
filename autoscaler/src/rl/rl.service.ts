import axios, { AxiosResponse } from "axios";
import { Injectable } from "@nestjs/common";
import {
  ScalingAction,
  RlState,
  RlDecisionResponse,
} from "./rl.types";

@Injectable()
export class RlService {
  private readonly RL_URL = "http://localhost:8001/decide";

  async decide(state: RlState): Promise<ScalingAction> {
    try {
      console.log(`[RlService] Requesting decision for state:`, state);
      const res: AxiosResponse<RlDecisionResponse> =
        await axios.post(this.RL_URL, state);

      console.log(`[RlService] Response:`, res.data);
      return res.data.action;
    } catch (err) {
      console.error('[RlService] Failed to contact RL server:', err.message);
      // FAIL-SAFE: RL must never break backend
      return ScalingAction.DO_NOTHING;
    }
  }
}

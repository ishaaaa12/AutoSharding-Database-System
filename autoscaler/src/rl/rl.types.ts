export interface RlState {
  currUtil: number;
  nextUtil: number;
  shardCount: number;
}

export interface RlDecisionResponse {
  action: ScalingAction;
}

export enum ScalingAction {
  DO_NOTHING = 0,
  SPLIT = 1,
  REBALANCE = 2,
}

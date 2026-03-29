import { Injectable } from '@nestjs/common';
import { ShardConnectionManager } from '../sharding/shard-connection.manager';
import { ShardStatsDto, ShardStatus } from './dto/shard-stats.dto';
import { ScalingAction } from '../rl/rl.types';

/**
 * Safely maps RL enum → DTO literal union
 * This avoids TypeScript incompatibility errors
 */
function mapRlAction(
  action: ScalingAction | null,
): 'SPLIT' | 'REBALANCE' | 'NONE' {
  if (action === ScalingAction.SPLIT) return 'SPLIT';
  if (action === ScalingAction.REBALANCE) return 'REBALANCE';
  return 'NONE';
}

@Injectable()
export class ShardMetricsService {
  constructor(private readonly router: ShardConnectionManager) {}

  async getShardStats(): Promise<ShardStatsDto[]> {
    const ranges = await this.router.getAllRanges();
    const maxRows = Number(process.env.SHARD_MAX_ROWS ?? 1000);

    // Last RL decision is global (scaling-level)
    const rlInfo = this.router.getLastRlDecision();

    return Promise.all(
      ranges.map(async (range) => {
        const shardId = range.shard_id;

        let userCount = 0;
        let isHealthy = true;

        try {
          userCount = await this.router.getShardUserCount(shardId);
        } catch {
          isHealthy = false;
        }

        const utilization = (userCount / maxRows) * 100;

        let status: ShardStatus;

        if (!isHealthy) {
          status = ShardStatus.DOWN;
        } else if (userCount >= maxRows) {
          status = ShardStatus.FULL;
        } else if (userCount >= 0.8 * maxRows) {
          status = ShardStatus.NEAR_CAPACITY;
        } else {
          status = ShardStatus.UP;
        }

        return {
          shardId,
          name: range.shard.name,
          rangeStart: range.range_start,
          rangeEnd: range.range_end,
          rangeSize: range.range_end - range.range_start + 1,

          userCount,
          utilization: Math.round(utilization * 100) / 100,

          canAcceptWrites: isHealthy && userCount < maxRows,
          isHealthy,
          status,

          // ✅ RL observability (type-safe)
          lastRlAction: mapRlAction(rlInfo?.action ?? null),
          lastRlActionAt: rlInfo
            ? new Date(rlInfo.at).toISOString()
            : null,

          lastCheckedAt: new Date().toISOString(),
        };
      }),
    );
  }
}

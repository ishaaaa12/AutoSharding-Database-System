import { Controller, Get } from '@nestjs/common';
import { ShardMetricsService } from './shard-metrics.service';

@Controller('admin/shards')
export class ShardMetricsController {
  constructor(private readonly metrics: ShardMetricsService) {}

  @Get('stats')
  async stats() {
    return this.metrics.getShardStats();
  }
}

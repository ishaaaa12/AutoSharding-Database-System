import { Module } from '@nestjs/common';
import { ShardMetricsController } from './shard-metrics.controller';
import { ShardMetricsService } from './shard-metrics.service';
import { ShardingModule } from '../sharding/sharding.module';

@Module({
  imports: [ShardingModule],
  controllers: [ShardMetricsController],
  providers: [ShardMetricsService],
})
export class MetricsModule {}

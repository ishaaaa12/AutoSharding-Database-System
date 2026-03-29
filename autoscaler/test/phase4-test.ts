import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/user/user.service';
import { MetricsService } from '../src/metrics/metrics.service';
import { AutoShardingService } from '../src/sharding/auto-sharding.service';
import { MetadataService } from '../src/metadata/metadata.service';
import { ShardConnectionService } from '../src/sharding/shard-connection.service';
import { User } from '../src/user/entity/user.entity';
import { DataSource } from 'typeorm';


async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userService = app.get(UserService);
  const metricsService = app.get(MetricsService);
  const autoShardingService = app.get(AutoShardingService);
  const metadataService = app.get(MetadataService);
  const shardConnectionService = app.get(ShardConnectionService);

  console.log('--- Phase 4 Test: Seeding Users ---');

  const threshold = 1000; // auto-shard threshold
  const shardId = 1;      // pick an existing shard
  const startId = 5000;

  // Insert enough users to exceed threshold
  for (let i = startId; i < startId + threshold + 10; i++) {
    await userService.createUser({
      id: i,
      name: `User${i}`,
      email: `user${i}@test.com`,
    });
  }

  console.log(`Inserted ${threshold + 10} users into shard ${shardId}`);

  console.log('--- Collecting Metrics ---');
  await metricsService.collectMetrics();

  console.log('--- Triggering Auto-Sharding ---');
  await autoShardingService.checkAndRebalance(threshold);

  console.log('--- Verifying User Distribution Across Shards ---');
  await metadataService.refresh();
  const shards = metadataService.getShards();

  for (const shard of shards) {
    const ds: DataSource = await shardConnectionService.getConnectionForShardId(shard.shard_id);
    const count = await ds.getRepository(User).count();
    console.log(`Shard ${shard.shard_name} has ${count} users`);
  }

  console.log('--- Phase 4 Test Completed ---');
  await app.close();
}

bootstrap();

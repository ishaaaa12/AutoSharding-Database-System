import { DatabaseModule } from './database/database.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShardingModule } from './sharding/sharding.module';
import { UserModule } from './user/user.module';
import { MigrationModule } from './migration/migration.module';
import { MetricsModule } from './metrics/metrics.module';
import { RlModule } from './rl/rl.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ShardingModule,
    MigrationModule,
    UserModule,
    MetricsModule,
    RlModule
  ],
})
export class AppModule {}

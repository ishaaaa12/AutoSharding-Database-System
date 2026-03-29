import { forwardRef, Module } from '@nestjs/common';
import { ShardAdminService } from './shard-admin.service';
import { ShardConnectionManager } from './shard-connection.manager';
import { DatabaseModule } from '../database/database.module';
import { ShardAdminController } from './shard-admin.controller';
import { MigrationModule } from '../migration/migration.module';
import { RlModule } from '../rl/rl.module';

@Module({
  imports: [DatabaseModule, forwardRef(()=>MigrationModule), RlModule],
  controllers:[ShardAdminController],
  providers: [ShardAdminService, ShardConnectionManager],
  exports: [ShardAdminService, ShardConnectionManager],
})
export class ShardingModule {}

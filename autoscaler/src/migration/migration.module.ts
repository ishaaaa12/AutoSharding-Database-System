import { forwardRef, Module } from '@nestjs/common';
import { ShardingModule } from '../sharding/sharding.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [forwardRef(()=>ShardingModule)],  // <-- IMPORTANT
  providers: [MigrationService],
  exports: [MigrationService], // <-- if autosplit service needs it
})
export class MigrationModule {}

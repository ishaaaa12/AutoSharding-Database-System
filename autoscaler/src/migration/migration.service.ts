import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ShardConnectionManager } from '../sharding/shard-connection.manager';
import { User } from '../user/entity/user.entity';
import { Between } from 'typeorm';

@Injectable()
export class MigrationService {
  constructor(
    @Inject(forwardRef(() => ShardConnectionManager))
    private readonly router: ShardConnectionManager,
  ) {}

  async migrateUsers(oldRange, newRange) {
    console.log(
      `➡️ Migrating users from shard ${oldRange.shard_id} → shard ${newRange.shard_id}`
    );

    const oldRepo = this.router
      .getDataSourceForShardId(oldRange.shard_id)
      .getRepository(User);

    const newRepo = this.router
      .getDataSourceForShardId(newRange.shard_id)
      .getRepository(User);

    const BATCH_SIZE = 500;
    let migrated = 0;

    while (true) {
      const batch = await oldRepo.find({
        where: {
          id: Between(newRange.range_start, newRange.range_end),
        },
        take: BATCH_SIZE,
      });

      if (batch.length === 0) break;

      for (const user of batch) {
        await newRepo.save(user);
        await oldRepo.delete(user.id);
      }

      migrated += batch.length;
    }

    console.log(`✔ Migration complete: ${migrated} users moved`);
  }
}

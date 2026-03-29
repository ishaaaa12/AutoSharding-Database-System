import { Injectable } from '@nestjs/common';
import { ShardConnectionManager } from '../sharding/shard-connection.manager';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly router: ShardConnectionManager) { }

  /**
   * Create a single user
   * Shard selection + auto-split is handled by the router
   */
  async createUser(dto: CreateUserDto) {
    const range = this.router.getRangeForKey(dto.id);

    if (!range) {
      throw new Error(`ID ${dto.id} does not belong to any shard range`);
    }

    const ds = this.router.getDataSourceForShardId(range.shard_id);

    const repo = ds.getRepository(User);

    const user = repo.create(dto);
    return repo.save(user);
  }

  /**
   * Bulk insert users (production-style ingestion)
   */
  async bulkInsert(total: number) {
    const BATCH_SIZE = 500;
    let inserted = 0;

    // 1. Find the current highest ID globally
    let nextId = 1;
    const ranges = await this.router.getAllRanges();

    if (ranges.length > 0) {
      // Sort ranges to find the one with highest capability
      ranges.sort((a, b) => Number(b.range_end) - Number(a.range_end));
      const lastRange = ranges[0];

      try {
        const ds = this.router.getDataSourceForShardId(lastRange.shard_id);
        const lastUser = await ds.getRepository(User).findOne({
          where: {},
          order: { id: 'DESC' }
        });

        if (lastUser) {
          nextId = lastUser.id + 1;
        }
      } catch (e) {
        console.warn('Could not determine max ID from last shard, starting from 1', e);
      }
    }

    while (inserted < total) {
      const batch: User[] = [];

      for (let i = 0; i < BATCH_SIZE && inserted < total; i++) {
        const id = nextId++;

        batch.push({
          id,
          email: `user${id}@test.com`,
          username: `user_${id}`,
        } as User);

        inserted++;
      }

      for (const user of batch) {
        // RL CHECK: Every 50 users, check if we need to scale
        if (inserted % 50 === 0) {
          await this.router.getWritableShard();
        }

        let range = this.router.getRangeForKey(user.id);

        if (!range) {
          // If range is missing, it might be time to split/create a new shard
          // We call getWritableShard() which triggers the split logic if needed
          await this.router.getWritableShard();

          // Retry getting the range
          range = this.router.getRangeForKey(user.id);

          if (!range) {
            throw new Error(`No shard range for ID ${user.id}`);
          }
        }

        const ds = this.router.getDataSourceForShardId(range.shard_id);
        await ds.getRepository(User).save(user);
      }
    }

    return { message: 'Bulk insert completed', inserted };
  }


  /**
   * Read user by id (uses range-based routing)
   */
  async getUser(id: number) {
    const ds = this.router.getDataSourceForKey(id);
    return ds.getRepository(User).findOne({ where: { id } });
  }
}

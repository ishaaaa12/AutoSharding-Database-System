import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Shard } from './entity/shard.entity';
import { ShardRange } from './entity/shard-range.entity';
import { encrypt } from '../utils/crypto.util';

@Injectable()
export class ShardAdminService {
  constructor(
    @InjectDataSource('METADATA') private metadata: DataSource,
  ) {}

  async createShard(options: {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  }) {
    const shardRepo = this.metadata.getRepository(Shard);
    const rangeRepo = this.metadata.getRepository(ShardRange);

    // Prevent multiple initial shards
    const existingRange = await rangeRepo.findOne({
      where: { is_active: true },
    });

    if (existingRange) {
      throw new Error(
        'Initial shard already exists. Use auto-splitting for new shards.'
      );
    }

    // Create physical database
    await this.metadata.query(`CREATE DATABASE ${options.database}`);

    const encryptedPassword = encrypt(options.password);

    const shard = shardRepo.create({
      name: options.name,
      host: options.host,
      port: options.port,
      username: options.username,
      encryptedPassword,
      database: options.database,
      isActive: true,
    });

    const savedShard = await shardRepo.save(shard);

    const initialRangeSize = Number(process.env.SHARD_MAX_ROWS ?? 1000);

    const range = rangeRepo.create({
      shard_id: savedShard.id,
      range_start: 1,
      range_end: initialRangeSize,
      is_active: true,
    });

    await rangeRepo.save(range);

    return {
      message: 'Initial shard created successfully',
      shard: savedShard,
      range,
    };
  }
}

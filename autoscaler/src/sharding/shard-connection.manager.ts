import {
  Injectable,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { Shard } from './entity/shard.entity';
import { ShardRange } from './entity/shard-range.entity';
import { decrypt, encrypt } from '../utils/crypto.util';
import { User } from '../user/entity/user.entity';
import { MigrationService } from '../migration/migration.service';

import { ScalingAction } from '../rl/rl.types';
import { RlService } from '../rl/rl.service';

const SHARD_MAX_ROWS = Number(process.env.SHARD_MAX_ROWS ?? 1000);

@Injectable()
export class ShardConnectionManager implements OnModuleInit {
  constructor(
    @InjectDataSource('METADATA')
    private readonly metadataDataSource: DataSource,

    @Inject(forwardRef(() => MigrationService))
    private readonly migrationService: MigrationService,

    private readonly rlService: RlService,
  ) { }

  /* -------------------- STATE -------------------- */

  private shardConnections = new Map<number, DataSource>();
  private shardRanges: ShardRange[] = [];

  /* -------------------- RL SAFETY -------------------- */

  private lastScalingActionAt = 0;
  private readonly SCALING_COOLDOWN_MS = 60_000;

  private lastRlDecision: {
    action: ScalingAction;
    at: number;
  } | null = null;

  /* -------------------- INIT -------------------- */

  async onModuleInit() {
    await this.loadShards();
  }
  private nextUserId = 1;
  allocateUserId(): number {
    return this.nextUserId++;
  }


  /* -------------------- LOAD SHARDS -------------------- */

  async loadShards() {
    this.shardConnections.clear();

    const shardRepo = this.metadataDataSource.getRepository(Shard);
    const rangeRepo = this.metadataDataSource.getRepository(ShardRange);

    const shards = await shardRepo.find({ where: { isActive: true } });

    this.shardRanges = await rangeRepo.find({
      where: { is_active: true },
      relations: ['shard'],
    });

    for (const shard of shards) {
      if (this.shardConnections.has(shard.id)) continue;

      const decryptedPassword = decrypt(shard.encryptedPassword);

      const ds = new DataSource({
        type: 'mysql',
        host: shard.host,
        port: shard.port,
        username: shard.username,
        password: decryptedPassword,
        database: shard.database,
        entities: [User],
        synchronize: true,
      });

      try {
        await ds.initialize();
        this.shardConnections.set(shard.id, ds);
        console.log(`Connected to shard: ${shard.name}`);
      } catch {
        console.warn(
          `⚠️ Could not connect to shard ${shard.name}. Database may not exist yet.`,
        );
      }
    }
  }

  /* -------------------- HELPERS -------------------- */

  private canScale(): boolean {
    return (
      Date.now() - this.lastScalingActionAt >=
      this.SCALING_COOLDOWN_MS
    );
  }

  recordRlDecision(action: ScalingAction) {
    this.lastRlDecision = {
      action,
      at: Date.now(),
    };
  }

  getLastRlDecision() {
    return this.lastRlDecision;
  }

  /* -------------------- ROUTING -------------------- */

  private findShardRange(key: number): ShardRange | null {
    return (
      this.shardRanges.find(
        r =>
          key >= Number(r.range_start) &&
          key <= Number(r.range_end),
      ) ?? null
    );
  }

  getRangeForKey(key: number) {
    return this.findShardRange(key);
  }

  getDataSourceForShardId(shardId: number): DataSource {
    const ds = this.shardConnections.get(shardId);
    if (!ds) {
      throw new Error(`Shard ${shardId} has no connection`);
    }
    return ds;
  }

  /* -------------------- RL-DRIVEN WRITE PATH -------------------- */

  async getShardUserCount(shardId: number): Promise<number> {
    return this.getDataSourceForShardId(shardId)
      .getRepository(User)
      .count();
  }

  async getWritableShard(): Promise<ShardRange> {
    const ranges = this.shardRanges
      .filter(r => r.is_active)
      .sort((a, b) => Number(a.range_start) - Number(b.range_start));

    const current = ranges[ranges.length - 1];

    const currCount = await this.getShardUserCount(current.shard_id);

    // 🚨 HARD INVARIANT — NO EXCEPTIONS
    if (currCount >= SHARD_MAX_ROWS) {
      console.log('🚨 Shard full. Forced split (hard guardrail).');
      const split = await this.autoSplitShard(current);
      return split.newRange;
    }

    // -------- RL DECISION (SOFT) --------
    const currUtil = currCount / SHARD_MAX_ROWS;

    const prev = ranges[ranges.length - 2];
    const prevUtil = prev
      ? (await this.getShardUserCount(prev.shard_id)) / SHARD_MAX_ROWS
      : 0;

    if (currUtil >= 0.8) {
      if (this.canScale()) {
        console.log(`[ShardManager] Triggering RL. Util: ${currUtil}`);
        const action = await this.rlService.decide({
          currUtil: Number(currUtil.toFixed(1)),
          nextUtil: Number(prevUtil.toFixed(1)),
          shardCount: ranges.length,
        });

        console.log(`[ShardManager] RL Decision: ${action}`);
        this.recordRlDecision(action);

        if (action === ScalingAction.SPLIT) {
          console.log('🤖 RL decided: SPLIT');
          this.lastScalingActionAt = Date.now();
          const split = await this.autoSplitShard(current);
          return split.newRange;
        }
      } else {
        console.log('[ShardManager] Skipping RL: Cooldown active');
      }
    } else {
      // console.log(`[ShardManager] Skipping RL: Util ${currUtil} < 0.8`);
    }

    return current;
  }


  async getDataSourceForInsert(): Promise<DataSource> {
    const range = await this.getWritableShard();
    return this.getDataSourceForShardId(range.shard_id);
  }

  /* -------------------- AUTO SPLIT -------------------- */

  async autoSplitShard(range: ShardRange) {
    const rangeRepo =
      this.metadataDataSource.getRepository(ShardRange);

    const start = Number(range.range_start);

    const newShard = await this.createNewShard();

    const oldEnd = start + SHARD_MAX_ROWS - 1;
    const newStart = oldEnd + 1;

    range.range_end = oldEnd;
    await rangeRepo.save(range);

    const newRange = rangeRepo.create({
      shard_id: newShard.id,
      range_start: newStart,
      range_end: newStart + SHARD_MAX_ROWS - 1,
      is_active: true,
    });

    await rangeRepo.save(newRange);

    await this.loadShards();
    await this.migrationService.migrateUsers(range, newRange);

    return { newRange };
  }

  /* -------------------- SHARD CREATION -------------------- */

  async createNewShard() {
    const name = `shard_${Date.now()}`;
    const db = `${name}_db`;

    await this.metadataDataSource.query(`CREATE DATABASE ${db}`);

    const repo = this.metadataDataSource.getRepository(Shard);
    return repo.save(
      repo.create({
        name,
        host: process.env.DEFAULT_SHARD_HOST,
        port: Number(process.env.DEFAULT_SHARD_PORT),
        username: process.env.DEFAULT_SHARD_USERNAME,
        encryptedPassword: encrypt(
          process.env.DEFAULT_SHARD_PASSWORD!,
        ),
        database: db,
        isActive: true,
      }),
    );
  }

  async getAllRanges() {
    return this.metadataDataSource
      .getRepository(ShardRange)
      .find({ where: { is_active: true }, relations: ['shard'] });
  }
  getDataSourceForKey(key: number | string): DataSource {
    const numericKey = Number(key);

    if (isNaN(numericKey)) {
      throw new Error(`Invalid shard key: ${key}`);
    }

    const range = this.findShardRange(numericKey);

    if (!range) {
      throw new Error(`No shard range found for key ${numericKey}`);
    }

    return this.getDataSourceForShardId(range.shard_id);
  }

}

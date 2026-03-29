import { Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShardAdminService } from './shard-admin.service';

@Controller('shard-admin')
export class ShardAdminController {
  constructor(
    private shardAdmin: ShardAdminService,
    private config: ConfigService
  ) {}

 @Post('create-default-shard')
async createDefaultShard() {
  return this.shardAdmin.createShard({
    name: this.config.get<string>('DEFAULT_SHARD_NAME') ?? 'shard_1',
    host: this.config.get<string>('DEFAULT_SHARD_HOST') ?? 'localhost',
    port: Number(this.config.get<string>('DEFAULT_SHARD_PORT') ?? 3307),
    username: this.config.get<string>('DEFAULT_SHARD_USERNAME') ?? 'root',
    password: this.config.get<string>('DEFAULT_SHARD_PASSWORD') ?? '',
    database: this.config.get<string>('DEFAULT_SHARD_DATABASE') ?? 'shard1_db',
  });
}


}

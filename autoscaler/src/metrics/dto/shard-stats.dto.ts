import { IsBoolean, IsNumber, IsString, IsOptional } from 'class-validator';

export enum ShardStatus {
  UP = 'UP',
  NEAR_CAPACITY = 'NEAR_CAPACITY',
  FULL = 'FULL',
  DOWN = 'DOWN',
}

export class ShardStatsDto {
  @IsNumber()
  shardId: number;

  @IsString()
  name: string;

  @IsNumber()
  rangeStart: number;

  @IsNumber()
  rangeEnd: number;

  @IsNumber()
  rangeSize: number;

  @IsNumber()
  userCount: number;

  @IsNumber()
  utilization: number;

  @IsBoolean()
  canAcceptWrites: boolean;

  @IsBoolean()
  isHealthy: boolean;

  @IsString()
  status: ShardStatus;

  @IsOptional()
  @IsString()
  lastRlAction?: 'SPLIT' | 'REBALANCE' | 'NONE';

  // ✅ ALLOW null
  @IsOptional()
  @IsString()
  lastRlActionAt?: string | null;

  @IsString()
  lastCheckedAt: string;
}

// shard-range.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Shard } from './shard.entity';

@Entity('shard_range')
export class ShardRange {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shard)
  @JoinColumn({ name: 'shard_id' })
  shard: Shard;

  @Column('int')
  shard_id: number;

  @Column('int')
  range_start: number;

  @Column('int')
  range_end: number;

  @Column({ default: true })
  is_active: boolean;
}

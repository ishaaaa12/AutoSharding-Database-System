// shard.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shard')
export class Shard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;         // e.g. shard_1

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  encryptedPassword: string; // stored encrypted

  @Column()
  database: string;

  @Column({ default: true })
  isActive: boolean;
}

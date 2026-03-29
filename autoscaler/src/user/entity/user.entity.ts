import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;
}

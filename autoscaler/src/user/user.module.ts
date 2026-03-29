import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ShardingModule } from '../sharding/sharding.module';

@Module({
  imports: [ShardingModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

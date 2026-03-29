import { Module } from '@nestjs/common';
import { RlService } from './rl.service';

@Module({
  providers: [RlService],
  exports: [RlService],
})
export class RlModule {}


import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shard } from '../sharding/entity/shard.entity';
import { ShardRange } from '../sharding/entity/shard-range.entity';
import { DataSource } from 'typeorm';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        name: 'METADATA',
        type: 'mysql',
        host: configService.get<string>('METADATA_DB_HOST') || 'localhost',
        port: Number(configService.get<string>('METADATA_DB_PORT') || 3306),
        username: configService.get<string>('METADATA_DB_USER') || 'root',
        password: configService.get<string>('METADATA_DB_PASSWORD'),
        database: configService.get<string>('METADATA_DB_NAME'),
        entities: [Shard, ShardRange],
        synchronize: true,
        logging: true,
      }),
    }),
  ],
  providers: [
    {
      provide: 'METADATADataSource',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [DataSource],
    },
  ],
  exports: ['METADATADataSource'],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config/env.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', { infer: true }),
        port: config.get('POSTGRES_PORT', { infer: true }),
        username: config.get('POSTGRES_USER', { infer: true }),
        password: config.get('POSTGRES_PASSWORD', { infer: true }),
        database: config.get('POSTGRES_DB', { infer: true }),
        // The schema changes only through migrations (docs/reference/conventions.md).
        synchronize: false,
        // bigint IDs and count(*) come back as numbers instead of strings.
        // IDs stay far below Number.MAX_SAFE_INTEGER, so no precision is lost.
        parseInt8: true,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}

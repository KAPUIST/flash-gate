import { once } from 'node:events';
import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

@Global()
@Module({
  providers: [
    {
      provide: Redis,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>) => {
        const host = config.get('REDIS_HOST', { infer: true });
        const port = config.get('REDIS_PORT', { infer: true });
        // Connect during startup so a wrong address stops the boot instead of failing the first request.
        const client = new Redis({ host, port, lazyConnect: true });
        try {
          await client.connect();
        } catch (error) {
          // Stop the background reconnect loop before giving up.
          client.disconnect();
          throw new Error(`Cannot connect to Redis at ${host}:${port}`, {
            cause: error,
          });
        }
        return client;
      },
    },
  ],
  exports: [Redis],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(Redis) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    // quit() resolves on the server's reply; wait for the socket to close as well.
    const ended = once(this.redis, 'end');
    await this.redis.quit();
    await ended;
  }
}

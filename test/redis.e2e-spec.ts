import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { AppModule } from '../src/app.module.js';

async function startApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe('Redis 연결 (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('앱이 실제 Redis에 연결되어 명령을 실행한다', async () => {
    await expect(app.get(Redis).ping()).resolves.toBe('PONG');
  });
});

describe('Redis 연결 종료 (e2e)', () => {
  it('앱을 닫으면 Redis 연결도 닫힌다', async () => {
    const app = await startApp();
    const redis = app.get(Redis);

    await app.close();

    expect(redis.status).toBe('end');
  });
});

describe('Redis 주소 오류 (e2e)', () => {
  const original = process.env.REDIS_PORT;

  afterEach(() => {
    if (original === undefined) delete process.env.REDIS_PORT;
    else process.env.REDIS_PORT = original;
    vi.resetModules();
  });

  it('Redis에 연결하지 못하면 앱이 시작되지 않는다', async () => {
    // Port 1 is reserved and nothing listens on it locally.
    process.env.REDIS_PORT = '1';
    // ConfigModule.forRoot reads the environment when app.module.js is first evaluated.
    vi.resetModules();

    const build = async () => {
      const { AppModule } = await import('../src/app.module.js');
      return Test.createTestingModule({ imports: [AppModule] }).compile();
    };

    await expect(build()).rejects.toThrow(/^Cannot connect to Redis at .+:1$/);
  });
});

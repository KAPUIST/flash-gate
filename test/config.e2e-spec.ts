import { Test } from '@nestjs/testing';

describe('환경 변수 검증 (e2e)', () => {
  const original = process.env.POSTGRES_USER;

  afterEach(() => {
    if (original === undefined) delete process.env.POSTGRES_USER;
    else process.env.POSTGRES_USER = original;
    vi.resetModules();
  });

  it('필수 값이 비어 있으면 앱 모듈이 만들어지지 않는다', async () => {
    // process.env takes precedence over .env, so an empty value overrides the file.
    process.env.POSTGRES_USER = '';
    // ConfigModule.forRoot validates when app.module.js is first evaluated,
    // so load a fresh copy after changing the environment.
    vi.resetModules();

    const build = async () => {
      const { AppModule } = await import('../src/app.module.js');
      return Test.createTestingModule({ imports: [AppModule] }).compile();
    };

    await expect(build()).rejects.toThrow(/POSTGRES_USER/);
  });
});

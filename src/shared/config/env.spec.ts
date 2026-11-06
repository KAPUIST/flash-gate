import { validateEnv } from './env.js';

const complete = {
  POSTGRES_PORT: '15432',
  POSTGRES_USER: 'flashgate',
  POSTGRES_PASSWORD: 'flashgate',
  POSTGRES_DB: 'flashgate',
  REDIS_PORT: '16379',
};

describe('validateEnv', () => {
  it('필수 값이 모두 있으면 포트를 숫자로 바꿔 돌려준다', () => {
    const env = validateEnv(complete);

    expect(env.POSTGRES_PORT).toBe(15432);
    expect(env.REDIS_PORT).toBe(16379);
    expect(env.POSTGRES_DB).toBe('flashgate');
  });

  it('선택 값이 없으면 기본값을 쓴다', () => {
    const env = validateEnv(complete);

    expect(env.PORT).toBe(3000);
    expect(env.POSTGRES_HOST).toBe('localhost');
    expect(env.REDIS_HOST).toBe('localhost');
  });

  it('필수 값이 빠지면 빠진 이름을 모두 에러 메시지에 담는다', () => {
    const { POSTGRES_USER: _user, REDIS_PORT: _redis, ...missing } = complete;

    expect(() => validateEnv(missing)).toThrow(
      /POSTGRES_USER[\s\S]*REDIS_PORT/,
    );
  });

  it('포트가 숫자가 아니면 실패한다', () => {
    expect(() => validateEnv({ ...complete, POSTGRES_PORT: 'abc' })).toThrow(
      /POSTGRES_PORT/,
    );
  });

  it('포트가 1~65535 밖이면 실패한다', () => {
    expect(() => validateEnv({ ...complete, REDIS_PORT: '70000' })).toThrow(
      /REDIS_PORT/,
    );
  });
});

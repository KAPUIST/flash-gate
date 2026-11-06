import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

describe('PostgreSQL 연결 (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('앱이 실제 PostgreSQL에 연결되어 쿼리를 실행한다', async () => {
    const rows: { one: number }[] = await dataSource.query('SELECT 1 AS one');

    expect(rows).toEqual([{ one: 1 }]);
  });

  it('e2e 테스트는 개발 DB가 아니라 테스트 DB를 쓴다', async () => {
    const [{ name }]: { name: string }[] = await dataSource.query(
      'SELECT current_database() AS name',
    );

    expect(name).toBe(process.env.POSTGRES_TEST_DB);
    expect(name).not.toBe('flashgate');
  });
});

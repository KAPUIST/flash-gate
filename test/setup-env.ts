import { existsSync } from 'node:fs';

// e2e tests run against the test database, never the development one.
// Values already in the environment (for example from CI) win over the .env file.
if (existsSync('.env')) process.loadEnvFile('.env');

const testDb = process.env.POSTGRES_TEST_DB;
if (!testDb) throw new Error('POSTGRES_TEST_DB must be set for e2e tests');
process.env.POSTGRES_DB = testDb;

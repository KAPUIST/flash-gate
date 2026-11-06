import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535);
const required = z.string().min(1);

const envSchema = z.object({
  PORT: port.default(3000),
  POSTGRES_HOST: required.default('localhost'),
  POSTGRES_PORT: port,
  POSTGRES_USER: required,
  POSTGRES_PASSWORD: required,
  POSTGRES_DB: required,
  REDIS_HOST: required.default('localhost'),
  REDIS_PORT: port,
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process environment at startup. Passed to ConfigModule.forRoot({ validate }),
 * so the app refuses to start with a missing or malformed value instead of failing later.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (result.success) return result.data;

  const problems = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${problems}`);
}

// Mirror the runtime environment (server/src/app.ts loads dotenv) so JWT
// signing/verification, CORS origin, and port use the same values as real runs.
import 'dotenv/config';

// DB-backed integration tests target a throwaway database. Prefer an explicit
// TEST_DATABASE_URL, but fall back to deriving a "<dbname>_test" database from
// DATABASE_URL so a plain `npm test` runs them locally without setting anything.
// The integration suite force-resets its database, so it must never target the
// real dev database directly.
function deriveTestDatabaseUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const slashIndex = url.lastIndexOf('/');
  if (slashIndex === -1) return undefined;
  const db = url.slice(slashIndex + 1);
  if (!db || db.endsWith('_test')) return undefined;
  return `${url.slice(0, slashIndex + 1)}${db}_test`;
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? deriveTestDatabaseUrl(process.env.DATABASE_URL);

if (testDatabaseUrl) {
  process.env.TEST_DATABASE_URL = testDatabaseUrl;
  process.env.DATABASE_URL = testDatabaseUrl;
}
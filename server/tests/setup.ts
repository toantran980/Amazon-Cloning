// DB-backed integration tests are opt-in: set TEST_DATABASE_URL to point at a
// throwaway PostgreSQL database. When unset, those tests are skipped and only
// pure unit tests (order math, parity checks, status lifecycle) run.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
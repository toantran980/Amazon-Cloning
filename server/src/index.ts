import 'dotenv/config';
import app from './app';
import logger from './logger';
import { startRefreshTokenCleanup } from './tokenCleanup';

// Fail fast in production instead of silently signing tokens with an
// insecure fallback secret.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error('JWT_SECRET must be set when NODE_ENV=production. Refusing to start.');
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

startRefreshTokenCleanup();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
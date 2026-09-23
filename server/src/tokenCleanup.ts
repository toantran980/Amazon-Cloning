import prisma from './prismaClient';
import logger from './logger';

const PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

// Keeps the RefreshToken table from growing without bound: removes rows that
// are already revoked or past their expiry.
export async function pruneExpiredRefreshTokens(): Promise<number> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
      },
    });
    if (result.count > 0) {
      logger.info(`Pruned ${result.count} refresh token(s)`);
    }
    return result.count;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Refresh token prune failed: ${errorMsg}`);
    return 0;
  }
}

export function startRefreshTokenCleanup(): NodeJS.Timeout {
  // Prune once immediately at boot, then on an interval.
  void pruneExpiredRefreshTokens();

  const interval = setInterval(() => {
    void pruneExpiredRefreshTokens();
  }, PRUNE_INTERVAL_MS);

  // Don't keep the process alive just for the cleanup timer.
  interval.unref?.();
  return interval;
}
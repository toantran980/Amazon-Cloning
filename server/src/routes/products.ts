import { Router, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

// Simple in-memory cache for the (read-mostly) product catalog.
// Reset whenever the process restarts; fine for a demo/portfolio deployment.
interface CacheEntry {
  data: { items: unknown[]; page: number; pageSize: number; total: number };
  expiresAt: number;
}
const cacheTtlMs = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

function cacheGet(key: string): CacheEntry['data'] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function cacheSet(key: string, data: CacheEntry['data']): void {
  cache.set(key, { data, expiresAt: Date.now() + cacheTtlMs });
}

router.get('/', async (req, res: Response) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10) || DEFAULT_PAGE_SIZE)
  );

  const cacheKey = `${page}:${pageSize}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const [total, items] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = { items, page, pageSize, total };
  cacheSet(cacheKey, data);
  res.json(data);
});

export default router;

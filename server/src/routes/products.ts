import { Router, Response } from 'express';
import prisma from '../prismaClient';

const router = Router();

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

// Simple in-memory cache for the (read-mostly) product catalog.
// Reset whenever the process restarts; fine for a demo/portfolio deployment.
interface CacheEntry {
  data: unknown;
  expiresAt: number;
}
const cacheTtlMs = 60 * 1000; // 60 seconds
const cache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + cacheTtlMs });
}

// The catalog is small (<= MAX_PAGE_SIZE rows), so "search" runs server-side
// over the full cached list instead of copying client-side filter logic.
async function getAllProducts() {
  const cached = cacheGet<Awaited<ReturnType<typeof prisma.product.findMany>>>('all');
  if (cached) return cached;

  const items = await prisma.product.findMany({ take: MAX_PAGE_SIZE });
  cacheSet('all', items);
  return items;
}

router.get('/', async (req, res: Response) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10) || DEFAULT_PAGE_SIZE)
  );

  const search = String(req.query.search ?? '').trim().toLowerCase();

  if (search) {
    const all = await getAllProducts();
    const filtered = all.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        (product.keywords || []).some((keyword) => keyword.toLowerCase().includes(search))
    );

    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    res.json({ items, page, pageSize, total: filtered.length });
    return;
  }

  const cacheKey = `${page}:${pageSize}`;
  const cached = cacheGet<{ page: number; pageSize: number; total: number }>(cacheKey);
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
import { test, expect } from '@playwright/test';

// Full-stack browser tests that require the real backend:
//   - a backend running on :3001 (vite proxies /api -> localhost:3001)
//   - a throwaway PostgreSQL at TEST_DATABASE_URL shared by the server and the seed
// Run with:
//   set TEST_DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/amazon_clone_test
//   set E2E_LIVE=1
//   npx playwright test e2e/live.spec.ts
//
// Skipped by default so `npm run test:e2e` stays hermetic (static demo mode).
const runLive = process.env.E2E_LIVE === '1';

const SEED_PRODUCT_ID = 'live-e2e-widget';
const SEED_PRODUCT_NAME = 'Live E2E Widget';

let db: typeof import('../server/src/prismaClient').prisma;

const liveDescribe = runLive ? test.describe : test.describe.skip;
liveDescribe('Live backend flows', () => {
  test.beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error('E2E_LIVE requires TEST_DATABASE_URL to seed the fixture product');
    }
    // The server process must point at the same database.
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const { prisma } = await import('../server/src/prismaClient');
    db = prisma;

    await prisma.user.deleteMany();

    await prisma.product.upsert({
      where: { id: SEED_PRODUCT_ID },
      update: { stock: 3 },
      create: {
        id: SEED_PRODUCT_ID,
        image: 'images/products/athletic-cotton-socks-6-pairs.jpg',
        name: SEED_PRODUCT_NAME,
        ratingStars: 4.5,
        ratingCount: 12,
        priceCents: 1090,
        keywords: ['socks', 'live'],
        stock: 3,
      },
    });
  });

  test.afterAll(async () => {
    await db?.product.delete({ where: { id: SEED_PRODUCT_ID } }).catch(() => undefined);
    await db?.$disconnect();
  });

  test('searches the catalog via the live API', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder="Search"]').fill('socks');
    await page.locator('button[aria-label="Search"]').click();

    const mainContent = page.locator('main');
    await expect(mainContent).toContainText(SEED_PRODUCT_NAME);
  });

  test('shows the stock-limited badge and enables Add to Cart on the detail page', async ({ page }) => {
    await page.goto(`/product/${SEED_PRODUCT_ID}`);

    await expect(page.getByText(SEED_PRODUCT_NAME, { exact: true })).toBeVisible();
    await expect(page.getByText('Only 3 left in stock')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  test('adds the product to the cart from the detail page', async ({ page }) => {
    await page.goto(`/product/${SEED_PRODUCT_ID}`);

    await page.getByRole('button', { name: 'Add to Cart' }).click();
    const cartLink = page.locator('a[aria-label^="Cart,"]');
    await expect(cartLink).toHaveAttribute('aria-label', /Cart, 1/);
  });

  test('renders a real catalog product on its detail page', async ({ page, request }) => {
    const res = await request.get('/api/products?pageSize=1');
    expect(res.ok()).toBeTruthy();
    const { items } = (await res.json()) as { items: Array<{ id: string; name: string }> };
    expect(items.length).toBeGreaterThan(0);

    const product = items[0];
    await page.goto(`/product/${product.id}`);
    await expect(page.getByRole('heading', { name: product.name }).or(page.getByText(product.name, { exact: true }))).toBeVisible();
  });
});
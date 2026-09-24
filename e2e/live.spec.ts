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
  // All tests share the same throwaway database and seed product, so they must
  // run serially on a single worker (the config default is fullyParallel).
  test.describe.configure({ mode: 'serial' });

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

  test.beforeEach(async () => {
    // Reset fixture stock since checkout places real orders against it.
    await db!.product.update({ where: { id: SEED_PRODUCT_ID }, data: { stock: 3 } });
  });

  test.afterAll(async () => {
    await db?.orderItem.deleteMany({ where: { productId: SEED_PRODUCT_ID } }).catch(() => undefined);
    await db?.order.deleteMany({}).catch(() => undefined);
    await db?.product.delete({ where: { id: SEED_PRODUCT_ID } }).catch(() => undefined);
    await db?.$disconnect();
  });

  test('searches the catalog via the live API', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder="Search"]').fill('socks');
    await page.locator('button[aria-label="Search"]').click();

    await expect(page.locator('main')).toContainText(SEED_PRODUCT_NAME);
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
    await expect(
      page.getByRole('heading', { name: product.name }).or(page.getByText(product.name, { exact: true }))
    ).toBeVisible();
  });

  test('checks out as a guest using the demo payment card', async ({ page }) => {
    await page.goto(`/product/${SEED_PRODUCT_ID}`);
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.locator('a[aria-label^="Cart,"]').click();

    await expect(page.getByText(SEED_PRODUCT_NAME)).toBeVisible();

    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardName', 'Demo User');
    await page.fill('#expiry', '12/30');
    await page.fill('#cvc', '123');
    await page.getByRole('button', { name: 'Place your order' }).click();

    await expect(page).toHaveURL(/\/orders/);
    await expect(page.locator('main')).toContainText(SEED_PRODUCT_NAME);
  });

  test('moves a cart item to save for later and back', async ({ page }) => {
    await page.goto(`/product/${SEED_PRODUCT_ID}`);
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    const cartLink = page.locator('a[aria-label^="Cart,"]');
    await expect(cartLink).toHaveAttribute('aria-label', /Cart, 1/);
    await cartLink.click();

    await page.getByRole('button', { name: 'Save for later' }).click();
    await expect(page.getByRole('heading', { name: 'Saved for later' })).toBeVisible();

    await page.getByRole('button', { name: 'Move to cart' }).click();
    // Back in the active items list (the button only renders for active items).
    await expect(page.getByRole('button', { name: 'Save for later' })).toBeVisible();
  });

  test('logged-in user can change the order status from the orders page', async ({ page, request }) => {
    const email = `e2e-user-${Date.now()}@example.com`;
    const register = await request.post('/api/auth/register', {
      data: { email, password: 'password123' },
    });
    expect(register.ok()).toBeTruthy();
    const auth = (await register.json()) as { token: string; user: { id: string; email: string } };

    // Seed the browser session as the new user.
    await page.goto('/');
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('authUser', JSON.stringify(user));
      },
      { token: auth.token, user: auth.user }
    );
    await page.reload();

    // Place an order through the UI.
    await page.goto(`/product/${SEED_PRODUCT_ID}`);
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.locator('a[aria-label^="Cart,"]').click();
    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardName', 'Demo User');
    await page.fill('#expiry', '12/30');
    await page.fill('#cvc', '123');
    await page.getByRole('button', { name: 'Place your order' }).click();
    await expect(page).toHaveURL(/\/orders/);

    const select = page.locator('select[id^="status-"]');
    await expect(select).toHaveValue('preparing');
    await select.selectOption('shipped');
    await expect(select).toHaveValue('shipped');

    // Confirm the change is persisted server-side. The `request` fixture shares
    // the browser context but not localStorage, so pass the token explicitly.
    const list = await request.get('/api/orders?page=1&pageSize=1', {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const body = (await list.json()) as { orders: Array<{ id: string; items: Array<{ status: string }> }> };
    expect(body.orders.length).toBeGreaterThan(0);
    expect(body.orders[0].items[0].status).toBe('shipped');
  });
});
import { execSync } from 'node:child_process';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import prisma from '../src/prismaClient';
import app from '../src/app';

// DB-backed integration tests. Skipped unless TEST_DATABASE_URL points at a
// throwaway PostgreSQL database (see tests/setup.ts).
const hasTestDb = !!process.env.TEST_DATABASE_URL;

const TEST_PRODUCT_ID = 'test-product-1';

function parseRefreshCookie(res: request.Response): string {
  const cookies = (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
  const match = cookies.find((c) => c.startsWith('refreshToken='));
  if (!match) throw new Error('No refreshToken cookie returned');
  return match.split(';')[0];
}

describe.skipIf(!hasTestDb)('API integration (auth, cart merge, orders)', () => {
  beforeAll(async () => {
    // Make sure the test schema is in sync with prisma/schema.prisma.
    execSync('npx prisma db push --skip-generate --accept-data-loss --force-reset', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL! },
      stdio: 'pipe',
    });

    await prisma.user.deleteMany();

    await prisma.product.upsert({
      where: { id: TEST_PRODUCT_ID },
      update: { stock: 5 },
      create: {
        id: TEST_PRODUCT_ID,
        image: 'images/products/test.png',
        name: 'Test Widget',
        ratingStars: 4.5,
        ratingCount: 10,
        priceCents: 1000,
        keywords: ['widget'],
        stock: 5,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a user and returns a bearer token + refresh cookie', async () => {
    const email = `user-${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(parseRefreshCookie(res)).toContain('refreshToken=');
  });

  it('rotates refresh tokens and invalidates the old one', async () => {
    const email = `rotate-${Date.now()}@example.com`;
    const register = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    const firstRefresh = parseRefreshCookie(register);

    // First refresh: rotates, old cookie is revoked.
    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', firstRefresh);
    expect(rotated.status).toBe(200);
    expect(rotated.body.token).toBeTruthy();
    const secondRefresh = parseRefreshCookie(rotated);

    // Reusing the old (revoked) cookie must fail and kill the family.
    const reused = await request(app).post('/api/auth/refresh').set('Cookie', firstRefresh);
    expect(reused.status).toBe(401);

    // The freshly rotated cookie is part of the same family and now also dead.
    const familyRefreshed = await request(app).post('/api/auth/refresh').set('Cookie', secondRefresh);
    expect(familyRefreshed.status).toBe(401);
  });

  it('merges guest cart items into the server cart', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `merge-${Date.now()}@example.com`, password: 'password123' });
    const token = res.body.token;

    const merged = await request(app)
      .post('/api/cart/merge')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: TEST_PRODUCT_ID, quantity: 2, deliveryOptionId: '1' }] });

    expect(merged.status).toBe(200);
    expect(merged.body).toHaveLength(1);
    expect(merged.body[0]).toMatchObject({
      productId: TEST_PRODUCT_ID,
      quantity: 2,
    });
  });

  it('enforces stock limits when placing an order', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `stock-${Date.now()}@example.com`, password: 'password123' });
    const token = res.body.token;

    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: TEST_PRODUCT_ID, quantity: 99, deliveryOptionId: '1' }] });

    expect(placed.status).toBe(400);
    expect(placed.body.error).toContain('Insufficient stock');
  });

  it('creates an order idempotently: replay returns the same order, mismatch 409s', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `idem-${Date.now()}@example.com`, password: 'password123' });
    const token = res.body.token;

    const payload = { items: [{ productId: TEST_PRODUCT_ID, quantity: 1, deliveryOptionId: '1' }] };

    const first = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'test-key-1')
      .send(payload);

    expect(first.status).toBe(201);
    expect(first.body.totalCents).toBeGreaterThan(0);

    // Same key + same payload -> the original order, not a duplicate.
    const replay = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'test-key-1')
      .send(payload);
    expect(replay.status).toBe(200);
    expect(replay.body.id).toBe(first.body.id);

    // Same key + different payload -> 409.
    const mismatch = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'test-key-1')
      .send({ items: [{ productId: TEST_PRODUCT_ID, quantity: 3, deliveryOptionId: '1' }] });
    expect(mismatch.status).toBe(409);
  });

  it('advances order status via PATCH and reflects it in GET', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `status-${Date.now()}@example.com`, password: 'password123' });
    const token = res.body.token;

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: TEST_PRODUCT_ID, quantity: 1, deliveryOptionId: '1' }] });

    const patched = await request(app)
      .patch(`/api/orders/${created.body.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'shipped' });
    expect(patched.status).toBe(200);
    expect(patched.body.items.every((item: { status: string }) => item.status === 'shipped')).toBe(true);

    const fetched = await request(app)
      .get(`/api/orders/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.items[0].status).toBe('shipped');
  });
});
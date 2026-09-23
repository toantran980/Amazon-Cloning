import { Router, Response } from 'express';
import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { computeStatus } from '../orderStatus';
import { computeOrderTotals, computePayloadHash, estimateDeliveryDate } from '../orderTotals';

const router = Router();
router.use(requireAuth);

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

const OrderStatusSchema = z.enum(['preparing', 'shipped', 'delivered']);

function getIdempotentOrderId(userId: string, key: string): string {
  const digest = createHash('sha256').update(`${userId}:${key}`).digest('hex');
  return `idem_${digest.slice(0, 24)}`;
}

interface OrderRow {
  id: string;
  userId: string;
  orderDate: bigint;
  totalCents: number;
}

async function serializeOrder(order: OrderRow) {
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  return {
    id: order.id,
    userId: order.userId,
    orderDate: Number(order.orderDate),
    totalCents: order.totalCents,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceCents: productById.get(item.productId)?.priceCents ?? 0,
      deliveryOptionId: item.deliveryOptionId,
      estimatedDelivery: item.estimatedDeliveryDate,
      status: computeStatus(order.orderDate, item.status),
      product: productById.get(item.productId),
    })),
  };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(
      1,
      Number.parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10) || DEFAULT_PAGE_SIZE
    )
  );

  const where = { userId: req.userId! };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const serialized = await Promise.all(orders.map((order) => serializeOrder(order)));

  res.json({ orders: serialized, page, pageSize, total });
});

const OrderLineSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  deliveryOptionId: z.string(),
});

const PlaceOrderSchema = z.object({
  items: z.array(OrderLineSchema).min(1),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = PlaceOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const idempotencyKey = req.header('Idempotency-Key')?.trim();
  const idempotencyHash = idempotencyKey
    ? computePayloadHash(parsed.data.items)
    : null;
  const orderId = idempotencyKey ? getIdempotentOrderId(userId, idempotencyKey) : randomUUID();

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (existing) {
      // Reject replays whose payload differs from the original request.
      if (existing.idempotencyHash && existing.idempotencyHash !== idempotencyHash) {
        res.status(409).json({
          error: 'Idempotency-Key was already used for a different request',
        });
        return;
      }

      res.status(200).json(await serializeOrder(existing));
      return;
    }
  }

  const requestedProductIds = Array.from(new Set(parsed.data.items.map((item) => item.productId)));
  const products = await prisma.product.findMany({ where: { id: { in: requestedProductIds } } });
  const productById = new Map(products.map((product) => [product.id, product]));

  const missingProductIds = requestedProductIds.filter((id) => !productById.has(id));
  if (missingProductIds.length > 0) {
    res.status(400).json({ error: `Unknown productId: ${missingProductIds.join(', ')}` });
    return;
  }

  // Stock check: request cannot exceed what's available.
  const quantityByProductId = parsed.data.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
    return acc;
  }, {});

  const outOfStock = Object.entries(quantityByProductId).filter(([productId, quantity]) => {
    const product = productById.get(productId)!;
    return quantity > product.stock;
  });

  if (outOfStock.length > 0) {
    const detail = outOfStock
      .map(([productId, quantity]) => {
        const product = productById.get(productId)!;
        return `${product.name} (requested ${quantity}, available ${product.stock})`;
      })
      .join('; ');
    res.status(400).json({ error: `Insufficient stock: ${detail}` });
    return;
  }

  // Server-trusted totals: product cost + shipping + estimated tax.
  const totals = computeOrderTotals(
    parsed.data.items,
    (productId) => productById.get(productId)!.priceCents
  );

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        id: orderId,
        userId,
        orderDate: BigInt(Date.now()),
        totalCents: totals.totalCents,
        idempotencyHash,
      },
    });

    await tx.orderItem.createMany({
      data: parsed.data.items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        deliveryOptionId: item.deliveryOptionId,
        // Server-authoritative estimate; client-supplied dates are ignored.
        estimatedDeliveryDate: estimateDeliveryDate(item.deliveryOptionId),
      })),
    });

    // Decrement stock with an optimistic guard; any failed update rolls back
    // the whole order transaction.
    const decrements = await Promise.all(
      Object.entries(quantityByProductId).map(([productId, quantity]) =>
        tx.product.updateMany({
          where: { id: productId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        })
      )
    );

    if (decrements.some((result) => result.count === 0)) {
      throw new Error('Insufficient stock at decrement time');
    }

    await tx.cartItem.deleteMany({ where: { userId } });

    return createdOrder;
  });

  res.status(201).json(await serializeOrder(order));
});

// Update order status (advance fulfilling orders, e.g. mark shipped/delivered).
router.patch('/:orderId/status', async (req: AuthRequest, res: Response) => {
  const parsed = OrderStatusSchema.safeParse(req.body?.status);
  if (!parsed.success) {
    res.status(400).json({ error: 'status must be one of: preparing, shipped, delivered' });
    return;
  }

  const order = await prisma.order.findFirst({
    where: { id: req.params.orderId, userId: req.userId! },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  await prisma.orderItem.updateMany({
    where: { orderId: order.id },
    data: { status: parsed.data },
  });

  res.json(await serializeOrder(order));
});

// Fetch a single order (used by the tracking page while authenticated).
router.get('/:orderId', async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.orderId, userId: req.userId! },
  });

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json(await serializeOrder(order));
});

export default router;
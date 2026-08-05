import { Router, Response } from 'express';
import { createHash, randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { computeStatus } from '../orderStatus';

const router = Router();
router.use(requireAuth);

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

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

  const orderIds = orders.map((order) => order.id);
  const orderItems = orderIds.length
    ? await prisma.orderItem.findMany({ where: { orderId: { in: orderIds } } })
    : [];

  const productIds = Array.from(new Set(orderItems.map((item) => item.productId)));
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];

  const productById = new Map(products.map((product) => [product.id, product]));
  const itemsByOrderId = new Map<string, typeof orderItems>();

  for (const item of orderItems) {
    const list = itemsByOrderId.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrderId.set(item.orderId, list);
  }

  const response = orders.map((order) => {
    const normalizedItems = (itemsByOrderId.get(order.id) ?? []).map((item) => {
      const product = productById.get(item.productId);
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        priceCents: product?.priceCents ?? 0,
        deliveryOptionId: item.deliveryOptionId,
        estimatedDelivery: item.estimatedDeliveryDate,
        status: computeStatus(order.orderDate, item.status),
        product,
      };
    });

    return {
      id: order.id,
      userId: order.userId,
      orderDate: Number(order.orderDate),
      totalCents: order.totalCents,
      items: normalizedItems,
    };
  });

  res.json({ orders: response, page, pageSize, total });
});

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  deliveryOptionId: z.string(),
  estimatedDelivery: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
});

const NormalizedOrderItemSchema = OrderItemSchema.transform((item) => ({
  productId: item.productId,
  quantity: item.quantity,
  deliveryOptionId: item.deliveryOptionId,
  estimatedDeliveryDate: item.estimatedDeliveryDate ?? item.estimatedDelivery ?? '',
})).refine((item) => item.estimatedDeliveryDate.length > 0, {
  message: 'estimatedDeliveryDate is required',
});

const PlaceOrderSchema = z.object({
  items: z.array(NormalizedOrderItemSchema).min(1),
});

function getIdempotentOrderId(userId: string, key: string): string {
  const digest = createHash('sha256').update(`${userId}:${key}`).digest('hex');
  return `idem_${digest.slice(0, 24)}`;
}

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = PlaceOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const idempotencyKey = req.header('Idempotency-Key')?.trim();
  const orderId = idempotencyKey ? getIdempotentOrderId(userId, idempotencyKey) : randomUUID();

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (existing) {
      const existingItems = await prisma.orderItem.findMany({ where: { orderId: existing.id } });
      const productIds = Array.from(new Set(existingItems.map((item) => item.productId)));
      const products = productIds.length
        ? await prisma.product.findMany({ where: { id: { in: productIds } } })
        : [];
      const productById = new Map(products.map((product) => [product.id, product]));

      res.status(200).json({
        id: existing.id,
        userId: existing.userId,
        orderDate: Number(existing.orderDate),
        totalCents: existing.totalCents,
        items: existingItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          priceCents: productById.get(item.productId)?.priceCents ?? 0,
          deliveryOptionId: item.deliveryOptionId,
          estimatedDelivery: item.estimatedDeliveryDate,
          status: computeStatus(existing.orderDate, item.status),
          product: productById.get(item.productId),
        })),
      });
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

  const totalCents = parsed.data.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!;
    return sum + product.priceCents * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        id: orderId,
        userId,
        orderDate: BigInt(Date.now()),
        totalCents,
      },
    });

    await tx.orderItem.createMany({
      data: parsed.data.items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        deliveryOptionId: item.deliveryOptionId,
        estimatedDeliveryDate: item.estimatedDeliveryDate,
      })),
    });

    await tx.cartItem.deleteMany({ where: { userId } });

    return createdOrder;
  });

  const createdItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });

  res.status(201).json({
    id: order.id,
    userId: order.userId,
    orderDate: Number(order.orderDate),
    totalCents: order.totalCents,
    items: createdItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceCents: productById.get(item.productId)?.priceCents ?? 0,
      deliveryOptionId: item.deliveryOptionId,
      estimatedDelivery: item.estimatedDeliveryDate,
      status: computeStatus(order.orderDate, item.status),
      product: productById.get(item.productId),
    })),
  });
});

export default router;

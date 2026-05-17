import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prismaClient.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.userId! },
    include: { items: { include: { product: true } } },
    orderBy: { orderDate: 'desc' },
  });
  res.json(orders);
});

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  deliveryOptionId: z.string(),
  estimatedDelivery: z.string(),
});

const PlaceOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = PlaceOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const order = await prisma.order.create({
    data: {
      userId: req.userId!,
      orderDate: BigInt(Date.now()),
      items: {
        create: parsed.data.items,
      },
    },
    include: { items: { include: { product: true } } },
  });
  // Clear cart after placing order
  await prisma.cartItem.deleteMany({ where: { userId: req.userId! } });
  res.status(201).json(order);
});

export default router;

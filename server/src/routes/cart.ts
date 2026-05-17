import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prismaClient.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.userId! },
    include: { product: true },
  });
  res.json(items);
});

const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  deliveryOptionId: z.string().optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = CartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { productId, quantity, deliveryOptionId } = parsed.data;
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: req.userId!, productId } },
    update: { quantity: { increment: quantity }, deliveryOptionId: deliveryOptionId ?? '1' },
    create: { userId: req.userId!, productId, quantity, deliveryOptionId: deliveryOptionId ?? '1' },
    include: { product: true },
  });
  res.status(201).json(item);
});

const UpdateSchema = z.object({
  quantity: z.number().int().positive().optional(),
  deliveryOptionId: z.string().optional(),
});

router.patch('/:productId', async (req: AuthRequest, res: Response) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const item = await prisma.cartItem.update({
    where: { userId_productId: { userId: req.userId!, productId: req.params.productId } },
    data: parsed.data,
    include: { product: true },
  });
  res.json(item);
});

router.delete('/:productId', async (req: AuthRequest, res: Response) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.userId!, productId: req.params.productId },
  });
  res.status(204).send();
});

router.delete('/', async (req: AuthRequest, res: Response) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.userId! } });
  res.status(204).send();
});

export default router;

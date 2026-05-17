import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.userId! },
  });

  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];
  const productById = new Map(products.map((product) => [product.id, product]));

  res.json(
    items.map((item) => ({
      ...item,
      product: productById.get(item.productId) ?? null,
    }))
  );
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
  });
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
  res.status(201).json({ ...item, product });
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
  });
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
  res.json({ ...item, product });
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

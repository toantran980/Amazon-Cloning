import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  deliveryOptionId: z.string().optional(),
});

const MergeCartSchema = z.object({
  items: z.array(CartItemSchema).max(999),
});

// Merge a list of guest cart items into the user's server cart.
// Existing items have their quantities merged (summed); new items are created.
router.post('/merge', async (req: AuthRequest, res: Response) => {
  const parsed = MergeCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const userId = req.userId!;
  const items = parsed.data.items;

  if (items.length === 0) {
    const current = await prisma.cartItem.findMany({ where: { userId } });
    res.json(current);
    return;
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId: item.productId } },
        update: { quantity: { increment: item.quantity } },
        create: {
          userId,
          productId: item.productId,
          quantity: item.quantity,
          deliveryOptionId: item.deliveryOptionId ?? '1',
        },
      })
    )
  );

  const merged = await prisma.cartItem.findMany({ where: { userId } });
  res.json(merged);
});

export default router;

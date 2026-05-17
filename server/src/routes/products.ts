import { Router, Response } from 'express';
import prisma from '../prismaClient.js';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

export default router;

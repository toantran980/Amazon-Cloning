import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import logger from '../logger';

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion })
  : null;

const CreateIntentSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      deliveryOptionId: z.string().optional(),
    })
  ).min(1),
});

// Create Stripe PaymentIntent or Demo Sandbox Intent
router.post('/create-intent', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CreateIntentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const requestedProductIds = Array.from(new Set(parsed.data.items.map((item) => item.productId)));
  const products = await prisma.product.findMany({ where: { id: { in: requestedProductIds } } });
  const productById = new Map(products.map((p) => [p.id, p]));

  const missing = requestedProductIds.filter((id) => !productById.has(id));
  if (missing.length > 0) {
    res.status(400).json({ error: `Unknown productId(s): ${missing.join(', ')}` });
    return;
  }

  // Compute server-trusted total
  const itemsTotalCents = parsed.data.items.reduce((sum, item) => {
    const product = productById.get(item.productId)!;
    return sum + product.priceCents * item.quantity;
  }, 0);

  // Delivery options cost mapping (cents)
  const deliveryOptionCostMap: Record<string, number> = {
    '1': 0,    // Standard (FREE)
    '2': 499,  // Express ($4.99)
    '3': 999,  // Priority ($9.99)
  };

  const shippingTotalCents = parsed.data.items.reduce((sum, item) => {
    const cost = deliveryOptionCostMap[item.deliveryOptionId ?? '1'] ?? 0;
    return sum + cost;
  }, 0);

  const totalCents = itemsTotalCents + shippingTotalCents;

  if (stripe) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: 'usd',
        metadata: {
          userId: req.userId!,
          itemCount: String(parsed.data.items.length),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalCents,
        currency: 'usd',
        demoMode: false,
      });
      return;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Stripe paymentIntent creation error: ${errorMsg}`);
      res.status(500).json({ error: 'Failed to create payment intent with gateway' });
      return;
    }
  }

  // Sandbox fallback when STRIPE_SECRET_KEY is not configured
  const mockIntentId = `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  logger.info(`STRIPE_SECRET_KEY not set. Using Demo Payment Intent: ${mockIntentId}`);

  res.json({
    clientSecret: `${mockIntentId}_secret_demo`,
    paymentIntentId: mockIntentId,
    amount: totalCents,
    currency: 'usd',
    demoMode: true,
  });
});

// Stripe Webhook Endpoint (handles payment_intent.succeeded)
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Stripe Webhook Signature verification failed: ${msg}`);
      res.status(400).send(`Webhook Error: ${msg}`);
      return;
    }
  } else {
    // Demo mode or unverified mock event for testing
    event = req.body as Stripe.Event;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    logger.info(`PaymentIntent succeeded: ${paymentIntent.id}`);

    await prisma.order.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { paymentStatus: 'paid' },
    });
  }

  res.json({ received: true });
});

export default router;

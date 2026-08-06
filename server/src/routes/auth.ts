import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '../prismaClient';
import logger from '../logger';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

router.use(authLimiter);

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function createAndSetTokens(res: Response, userId: string) {
  const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';

  // Short-lived access token (15 mins)
  const token = jwt.sign({ userId }, secret, { expiresIn: '15m' });

  // Long-lived refresh token
  const refreshTokenValue = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  res.cookie('refreshToken', refreshTokenValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth',
  });

  return token;
}

router.post('/register', async (req: Request, res: Response) => {
  const parsed = AuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash: hashed } });
  const token = await createAndSetTokens(res, user.id);

  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = AuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = await createAndSetTokens(res, user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

// Refresh token rotation endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'Refresh token cookie missing' });
    return;
  }

  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!tokenRecord) {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  // Token reuse detection: if token is already revoked, breach mitigation invalidates all user tokens
  if (tokenRecord.revoked) {
    logger.warn(`Security warning: Revoked refresh token reuse attempt for user ${tokenRecord.userId}`);
    await prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.userId },
      data: { revoked: true },
    });
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(401).json({ error: 'Refresh token revoked due to reuse detection' });
    return;
  }

  if (tokenRecord.expiresAt < new Date()) {
    res.status(401).json({ error: 'Refresh token expired' });
    return;
  }

  // Revoke old token and issue new token pair (rotation)
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  const newToken = await createAndSetTokens(res, tokenRecord.userId);
  const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });

  res.json({ token: newToken, user: user ? { id: user.id, email: user.email } : null });
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out successfully' });
});

export default router;

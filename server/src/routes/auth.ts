import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();
const credentials = z.object({ email: z.string().trim().email().max(191), password: z.string().min(10).max(128) });
const registerSchema = credentials.extend({ name: z.string().trim().min(2).max(80) });
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
function issueSession(userId: string, res: import('express').Response) {
  const token = jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: '7d' });
  res.cookie('lifetrack_session', token, cookieOptions);
}

// This personal-use bootstrap route allows the first account only. Disable registration after setup for a single-user deployment.
authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existingCount = await prisma.user.count();
    if (existingCount > 0) return res.status(403).json({ error: 'Registration is closed after the first account is created.' });
    const email = input.email.toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { name: input.name, email, passwordHash } });
    issueSession(user.id, res);
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, timezone: user.timezone } });
  } catch (error) { next(error); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    issueSession(user.id, res);
    res.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, timezone: user.timezone } });
  } catch (error) { next(error); }
});

authRouter.post('/logout', (_req, res) => { res.clearCookie('lifetrack_session', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/' }); res.json({ ok: true }); });
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, name: true, email: true, currency: true, timezone: true } }); if (!user) return res.status(401).json({ error: 'Account not found.' }); res.json({ user }); }
  catch (error) { next(error); }
});

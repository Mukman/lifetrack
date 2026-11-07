import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
export const preferencesRouter = Router();
preferencesRouter.use(requireAuth);
const prefs = z.object({ currency: z.string().length(3).optional(), timezone: z.string().min(1).max(64).optional(), monthlyBudget: z.number().finite().positive().max(999999999).optional(), savingsGoal: z.number().finite().positive().max(999999999).optional(), savedAmount: z.number().finite().min(0).max(999999999).optional() });
preferencesRouter.get('/', async (req, res, next) => { try { const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { currency: true, timezone: true, monthlyBudget: true, savingsGoal: true, savedAmount: true } }); if (!user) return res.status(404).json({ error: 'Account not found.' }); res.json({ preferences: user }); } catch (e) { next(e); } });
preferencesRouter.patch('/', async (req, res, next) => { try { const input = prefs.parse(req.body); const preferences = await prisma.user.update({ where: { id: req.userId }, data: input, select: { currency: true, timezone: true, monthlyBudget: true, savingsGoal: true, savedAmount: true } }); res.json({ preferences }); } catch (e) { next(e); } });

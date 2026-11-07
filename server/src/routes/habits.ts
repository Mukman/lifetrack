import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
export const habitsRouter = Router();
habitsRouter.use(requireAuth);
const habitInput = z.object({ name: z.string().trim().min(1).max(100), note: z.string().max(255).default(''), done: z.boolean().default(false) });
function addisDate(value: Date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value); }
habitsRouter.get('/', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'asc' } });
    const today = addisDate(new Date());
    const stale = habits.filter(h => h.done && addisDate(h.updatedAt) !== today).map(h => h.id);
    if (stale.length) await prisma.habit.updateMany({ where: { userId: req.userId, id: { in: stale } }, data: { done: false } });
    res.json({ habits: habits.map(h => ({ ...h, done: h.done && addisDate(h.updatedAt) === today })) });
  } catch (e) { next(e); }
});
habitsRouter.post('/', async (req, res, next) => {
  try { const input = habitInput.parse(req.body); const habit = await prisma.habit.create({ data: { name: input.name, note: input.note, done: false, userId: req.userId! } }); res.status(201).json({ habit }); }
  catch (e) { next(e); }
});
habitsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = habitInput.partial().parse(req.body);
    const result = await prisma.habit.updateMany({ where: { id: req.params.id, userId: req.userId }, data: input });
    if (!result.count) return res.status(404).json({ error: 'Habit not found.' });
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.userId } });
    res.json({ habit });
  } catch (e) { next(e); }
});
habitsRouter.delete('/:id', async (req, res, next) => { try { const result = await prisma.habit.deleteMany({ where: { id: req.params.id, userId: req.userId } }); if (!result.count) return res.status(404).json({ error: 'Habit not found.' }); res.status(204).end(); } catch (e) { next(e); } });

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const calendarRouter = Router();
calendarRouter.use(requireAuth);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const eventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  category: z.string().trim().min(1).max(40).default('Personal'),
});

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function validTimeRange(start: string, end: string) {
  return start < end;
}

calendarRouter.get('/', async (req, res, next) => {
  try {
    const from = typeof req.query.from === 'string' ? dateSchema.parse(req.query.from) : undefined;
    const to = typeof req.query.to === 'string' ? dateSchema.parse(req.query.to) : undefined;
    if (from && to && from > to) return res.status(400).json({ error: 'The start date must be before the end date.' });
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: req.userId,
        ...(from || to ? { date: { ...(from ? { gte: dateOnly(from) } : {}), ...(to ? { lte: dateOnly(to) } : {}) } } : {}),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ events });
  } catch (error) { next(error); }
});

calendarRouter.post('/', async (req, res, next) => {
  try {
    const input = eventSchema.parse(req.body);
    if (!validTimeRange(input.startTime, input.endTime)) return res.status(400).json({ error: 'End time must be later than start time.' });
    const event = await prisma.calendarEvent.create({
      data: { ...input, date: dateOnly(input.date), userId: req.userId! },
    });
    res.status(201).json({ event });
  } catch (error) { next(error); }
});

calendarRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = eventSchema.partial().parse(req.body);
    const existing = await prisma.calendarEvent.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: 'Calendar event not found.' });
    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;
    if (!validTimeRange(startTime, endTime)) return res.status(400).json({ error: 'End time must be later than start time.' });
    const data = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.date !== undefined ? { date: dateOnly(input.date) } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
    };
    const event = await prisma.calendarEvent.update({ where: { id: existing.id }, data });
    res.json({ event });
  } catch (error) { next(error); }
});

calendarRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.calendarEvent.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    if (!result.count) return res.status(404).json({ error: 'Calendar event not found.' });
    res.status(204).end();
  } catch (error) { next(error); }
});

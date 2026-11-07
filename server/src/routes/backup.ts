import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const backupRouter = Router();
backupRouter.use(requireAuth);

const date = z.string().date();
const backupSchema = z.object({
  tasks: z.array(z.object({ title: z.string().min(1).max(120), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('09:00'), category: z.string().min(1).max(40).default('Personal'), priority: z.enum(['High', 'Medium', 'Low']).default('Medium'), done: z.boolean().default(false), dueDate: date.nullable().optional() })).max(1000).default([]),
  transactions: z.array(z.object({ title: z.string().min(1).max(100), category: z.string().min(1).max(40).default('Other'), amount: z.coerce.number().finite().positive(), type: z.enum(['expense', 'income']), date })).max(2000).default([]),
  habits: z.array(z.object({ name: z.string().min(1).max(100), note: z.string().max(255).default(''), done: z.boolean().default(false) })).max(500).default([]),
  reminders: z.array(z.object({ title: z.string().min(1).max(120), dueAt: z.string().datetime(), done: z.boolean().default(false) })).max(1000).default([]),
  calendarEvents: z.array(z.object({ title: z.string().min(1).max(120), description: z.string().max(500).nullable().optional(), date, startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), category: z.string().min(1).max(40).default('Personal') }).refine(e => e.startTime < e.endTime, { message: 'Event end time must be later than start time.' })).max(2000).default([]),
  preferences: z.object({ currency: z.string().length(3).optional(), timezone: z.string().min(1).max(64).optional(), monthlyBudget: z.number().positive().optional(), savingsGoal: z.number().positive().optional(), savedAmount: z.number().min(0).optional() }).optional()
});

backupRouter.post('/restore', async (req, res, next) => {
  try {
    const input = backupSchema.parse(req.body);
    const counts = await prisma.$transaction(async tx => {
      const userId = req.userId!;
      for (const task of input.tasks) await tx.task.create({ data: { ...task, dueDate: task.dueDate ? new Date(`${task.dueDate}T00:00:00.000Z`) : null, userId } });
      for (const item of input.transactions) await tx.transaction.create({ data: { ...item, amount: item.amount.toFixed(2), date: new Date(`${item.date}T00:00:00.000Z`), userId } });
      for (const habit of input.habits) await tx.habit.create({ data: { name: habit.name, note: habit.note, done: habit.done, userId } });
      for (const reminder of input.reminders) await tx.reminder.create({ data: { ...reminder, dueAt: new Date(reminder.dueAt), userId } });
      for (const event of input.calendarEvents) await tx.calendarEvent.create({ data: { ...event, date: new Date(`${event.date}T00:00:00.000Z`), userId } });
      if (input.preferences) await tx.user.update({ where: { id: userId }, data: input.preferences });
      return { tasks: input.tasks.length, transactions: input.transactions.length, habits: input.habits.length, reminders: input.reminders.length, calendarEvents: input.calendarEvents.length };
    });
    res.json({ message: 'Backup restored. Existing records were kept; imported records were added.', counts });
  } catch (e) { next(e); }
});

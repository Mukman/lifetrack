import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

declare global { namespace Express { interface Request { userId?: string } } }
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.lifetrack_session;
  if (!token) return res.status(401).json({ error: 'Please log in to continue.' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string') return res.status(401).json({ error: 'Invalid session.' });
    req.userId = payload.sub;
    next();
  } catch { return res.status(401).json({ error: 'Your session has expired. Please log in again.' }); }
}

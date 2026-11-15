import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, User } from './store';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('[auth] JWT_SECRET not set — using an insecure development secret. Set it in backend/.env');

export interface AuthedRequest extends Request { user?: User }

export const publicUser = (u: User) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone });
export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);
export const newId = (prefix: string) => `${prefix}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
export const signToken = (u: User) => jwt.sign({ sub: u.id }, SECRET, { expiresIn: '7d' });

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string };
    const user = db.findUserById(payload.sub);
    if (!user) throw new Error('no user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Please log in to continue.' });
  }
}

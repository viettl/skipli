import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../services/firebase';
import { FIREBASE_COLLECTIONS, USER_ROLES, ERROR_MESSAGES } from '@skipli/shared';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
export function generateToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
}
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: ERROR_MESSAGES.NO_TOKEN });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const userDoc = await db.collection(FIREBASE_COLLECTIONS.USERS).doc(decoded.id).get();
    if (!userDoc.exists) {
      const query = await db.collection(FIREBASE_COLLECTIONS.USERS).where('email', '==', decoded.email).limit(1).get();
      if(query.empty) {
         return res.status(401).json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: ERROR_MESSAGES.INVALID_TOKEN });
  }
}
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED });
    }
    console.log(`  role for user:`, req.user, `Required :`, roles);
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: ERROR_MESSAGES.ACCESS_DENIED });
    }
    next();
  };
}
export const requireInstructor = requireRole(USER_ROLES.INSTRUCTOR);
export const requireStudent = requireRole(USER_ROLES.STUDENT);
export const requireAnyRole = requireRole(USER_ROLES.INSTRUCTOR, USER_ROLES.STUDENT);

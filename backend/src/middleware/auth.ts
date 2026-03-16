/**
 * JWT Authentication Middleware — CBC Learning Ecosystem
 *
 * Verifies the Authorization: Bearer <token> header.
 * Attaches the decoded user payload to req.user.
 *
 * Role hierarchy:
 *   super_admin > school_admin > teacher > parent > student
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: number;
  schoolId: number;
  email: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
  firstName: string;
  lastName: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * authenticate — requires a valid JWT, attaches req.user
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('[auth] JWT_SECRET not set — server misconfiguration');
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    if ((err as Error).name === 'TokenExpiredError') {
      res.status(401).json({ success: false, message: 'Token expired' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }
}

/**
 * requireRole — gates a route to specific roles
 * Usage: router.get('/admin', authenticate, requireRole('school_admin', 'super_admin'), handler)
 */
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

/**
 * requireSameSchool — ensures the acting user belongs to the school being accessed
 * Reads schoolId from req.params.schoolId or req.body.schoolId
 */
export function requireSameSchool(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  // super_admin can access any school
  if (req.user.role === 'super_admin') { next(); return; }

  const requestedSchoolId = parseInt(req.params.schoolId || req.body.schoolId, 10);
  if (requestedSchoolId && req.user.schoolId !== requestedSchoolId) {
    res.status(403).json({ success: false, message: 'Access denied: wrong school' });
    return;
  }
  next();
}

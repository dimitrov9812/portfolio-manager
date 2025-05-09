import { RequestHandler } from "express";
import { db, saveDB } from './db';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = 'super_secret_broker_api';

export enum Role {
    ReadOnly = 'read-only',
    FullAccess = 'full-access',
    UltimateAdmin = 'ultimate-admin'
}

export function roleMiddleware(requiredRoles: Role[]): RequestHandler {
    return (req: any, res: any, next: any) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token provided' });
  
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const operator = db.brokerOperators.find((op: any) => op.id === decoded.id);
        if (!operator || !requiredRoles.includes(operator.role)) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        req.operator = operator;
        next();
      } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
    };
}
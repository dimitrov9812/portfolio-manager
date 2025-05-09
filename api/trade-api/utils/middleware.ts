import { db, saveDB } from "./db";
import { Role } from "./role";
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export const SALT_ROUNDS = 10;

export function uuidValidationMiddleware(req: any, res: any, next: any) {
    const id = req.params.id;
  
    // Validate the UUID format
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (!isValidUUID) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
  
    // If valid, proceed to the next middleware/handler
    next();
}

export function createOneUltimateAdmin() {
    const adminExists = db.brokerOperators?.some((op: any) => op.username === 'admin');
    if (!adminExists) {
        const adminUser = {
            id: uuidv4(),
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@broker.com',
            phone: '0000000000',
            role: Role.UltimateAdmin,
            username: 'admin',
            password: bcrypt.hashSync('adminpass123', SALT_ROUNDS),
        };

        db.brokerOperators = db.brokerOperators || [];
        db.brokerOperators.push(adminUser);
        saveDB();
    }
}
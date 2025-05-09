import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { db, saveDB } from '../utils/db';
import { roleMiddleware, Role } from '../utils/role';
import { SALT_ROUNDS } from '../utils/middleware';

const router = Router();

//@ts-ignore
router.get('/', roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    res.json(db.brokerOperators);
});
  
// Get a single broker operator by ID
//@ts-ignore
router.get('/:id', roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const operator = db.brokerOperators.find((op: any) => op.id === req.params.id);
    if (!operator) {
        return res.status(404).json({ message: 'Broker operator not found' });
    }

    res.json(operator);
});

//@ts-ignore
router.post('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const data = req.body; // Array of broker operators' data
    const results: any[] = [];
    const errors: any[] = [];
  
    const operatorsToAdd = Array.isArray(data) ? data : [data];
  
    operatorsToAdd.forEach((operator: any) => {
      const { firstName, lastName, email, phone, role, username, password } = operator;
  
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'username', 'password'];
      for (const field of requiredFields) {
          if (operator[field] === undefined || operator[field] === null) {
              errors.push({ operator, error: `Missing required field: ${field}` });
              return;
          }
      }
  
      // Check if the username or email already exists
      const existingOperator = db.brokerOperators.find(
        (op: any) => op.email === email
      );
      if (existingOperator) {
        errors.push({ operator, error: 'Email already exists' });
        return;
      }
  
      // Create new operator with hashed password
      const newOperator = {
        id: uuidv4(),
        firstName,
        lastName,
        email,
        phone,
        role,
        username,
        password: bcrypt.hashSync(password, SALT_ROUNDS), // Secure password
      };
  
      db.brokerOperators.push(newOperator);
      results.push(newOperator);
    });
  
    // Save the DB with new operators
    saveDB();
  
    // Respond with the success and error details
    res.status(207).json({ success: results, errors });
});

//@ts-ignore
router.put('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const results: any[] = [];
    const errors: any[] = [];
  
    data.forEach((update) => {
      const { id, email, username, password } = update;
  
      if (!id) {
        errors.push({ update, error: 'Missing ID' });
        return;
      }
  
      const idx = db.brokerOperators.findIndex((op: any) => op.id === id);
      if (idx === -1) {
        errors.push({ update, error: 'Broker operator not found' });
        return;
      }
  
      const current = db.brokerOperators[idx];
  
      // Detect if email or username is changing
      const isEmailChanged = email && email !== current.email;
      const isUsernameChanged = username && username !== current.username;
  
      // Check for conflicts only if changing
      const conflict = db.brokerOperators.find(
        (op: any, i: number) =>
          i !== idx &&
          ((isEmailChanged && op.email === email) ||
           (isUsernameChanged && op.username === username))
      );
      if (conflict) {
        errors.push({ update, error: 'Username or email already exists' });
        return;
      }
  
      // Update password if present
      if (password) {
        db.brokerOperators[idx].password = bcrypt.hashSync(password, SALT_ROUNDS);
      }
  
      // Update only the fields that are provided
      const fieldsToUpdate = ['firstName', 'lastName', 'email', 'phone', 'role', 'username'];
      fieldsToUpdate.forEach(field => {
        if (update[field] !== undefined) {
          db.brokerOperators[idx][field] = update[field];
        }
      });
  
      results.push(db.brokerOperators[idx]);
    });
  
    saveDB();
    res.status(207).json({ success: results, errors });
});

//@ts-ignore
router.delete('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : [req.body];
    const results: string[] = [];
    const errors: any[] = [];
  
    const ultimateAdminId = db.brokerOperators[0]?.id;
  
    ids.forEach((id) => {
      if (!id) {
        errors.push({ id, error: 'Missing ID' });
        return;
      }
  
      if (id === ultimateAdminId) {
        errors.push({ id, error: 'Cannot delete the ultimate admin' });
        return;
      }
  
      const exists = db.brokerOperators.some((op: any) => op.id === id);
      if (!exists) {
        errors.push({ id, error: 'Broker operator not found' });
        return;
      }
  
      db.brokerOperators = db.brokerOperators.filter((op: any) => op.id !== id);
      results.push(id);
    });
  
    saveDB();
    res.status(207).json({ deleted: results, errors });
});

export default router;
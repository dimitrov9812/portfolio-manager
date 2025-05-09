import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, saveDB } from '../utils/db';
import { uuidValidationMiddleware } from '../utils/middleware';
import { roleMiddleware, Role } from '../utils/role';

const router = Router();

router.get('/', roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
  res.json(db.clients);
});

//@ts-ignore
router.get('/:id', uuidValidationMiddleware, roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const clientId = req.params.id;

    // Find the ticker by its ID
    const client = db.clients.find((c: any) => c.id === clientId);

    // If the ticker doesn't exist, return 404
    if (!client) {
        return res.status(404).json({ message: 'Client not found' });
    }

    // If everything is okay, return the ticker details (200)
    return res.status(200).json(client);
});

// @ts-ignore
router.post('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const created: any[] = [];
    const errors: any[] = [];
  
    data.forEach((client, index) => {
      if (!client.name || !client.email) {
        errors.push({ index, error: 'Missing name or email' });
        return;
      }
  
      const existing = db.clients.find((c: any) => c.email === client.email);
      if (existing) {
        errors.push({ index, error: 'Client with this email already exists' });
        return;
      }
  
      const newClient = {
        id: uuidv4(),
        openTrades: [],
        tradeHistory: [],
        watchlist: [],
        ...client
      };
  
      db.clients.push(newClient);
      created.push(newClient);
    });
  
    saveDB();
  
    if (errors.length > 0) {
      return res.status(207).json({ created, errors });
    }
  
    res.status(201).json({ created });
});
  

// @ts-ignore
router.put('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const updated: any[] = [];
    const errors: any[] = [];
  
    data.forEach((update, index) => {
      if (!update.id) {
        errors.push({ index, error: 'Missing client ID' });
        return;
      }
  
      const idx = db.clients.findIndex((c: any) => c.id === update.id);
      if (idx === -1) {
        errors.push({ index, id: update.id, error: 'Client not found' });
        return;
      }
  
      // Check for duplicate email (if it's being updated)
      if (update.email) {
        const isDuplicate = db.clients.some((c: any, i: number) =>
          i !== idx && c.email === update.email
        );
        if (isDuplicate) {
          errors.push({ index, id: update.id, error: 'Email already used by another client' });
          return;
        }
      }
  
      db.clients[idx] = { ...db.clients[idx], ...update };
      updated.push(db.clients[idx]);
    });
  
    saveDB();
  
    if (errors.length > 0) {
      return res.status(207).json({ updated, errors });
    }
  
    res.status(200).json({ updated });
});

//@ts-ignore
router.delete('/', roleMiddleware([Role.UltimateAdmin]), (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : [req.body];
    const deleted: string[] = [];
    const errors: any[] = [];
  
    ids.forEach((id, index) => {
      const idx = db.clients.findIndex((c: any) => c.id === id);
      if (idx === -1) {
        errors.push({ index, id, error: 'Client not found' });
        return;
      }
      db.clients = db.clients.filter((c: any) => c.id !== id);
      deleted.push(id);
    });
  
    saveDB();
  
    if (errors.length > 0) {
      return res.status(207).json({ deleted, errors });
    }
  
    res.status(200).json({ deleted });
});

export default router;
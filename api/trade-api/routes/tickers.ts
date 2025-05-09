import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, saveDB } from '../utils/db';
import { uuidValidationMiddleware } from '../utils/middleware';
import { Role, roleMiddleware } from '../utils/role';

const router = Router();

router.get('/', roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
  res.json(db.tickers);
});

//@ts-ignore
router.get('/:id', uuidValidationMiddleware, roleMiddleware([Role.ReadOnly, Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const tickerId = req.params.id;

    // Find the ticker by its ID
    const ticker = db.tickers.find((t: any) => t.id === tickerId);

    // If the ticker doesn't exist, return 404
    if (!ticker) {
        return res.status(404).json({ message: 'Ticker not found' });
    }

    // If everything is okay, return the ticker details (200)
    return res.status(200).json(ticker);
});

//@ts-ignore
router.post('/', roleMiddleware([Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const createdTickers: any[] = [];
    const errors: any[] = [];

    payload.forEach((item, index) => {
        const { symbol, fullName } = item;

        // Validate required fields
        if (!symbol || !fullName) {
        errors.push({ index, item, error: 'Ticker symbol and full name are required' });
        return;
        }

        // Check for duplicate symbol
        const existing = db.tickers.find((t: any) => t.symbol === symbol);
        if (existing) {
        errors.push({ index, item, error: 'Ticker with this symbol already exists' });
        return;
        }

        // Add ticker
        const newTicker = { id: uuidv4(), symbol, fullName };
        db.tickers.push(newTicker);
        createdTickers.push(newTicker);
    });

    saveDB();

    if (errors.length > 0) {
        return res.status(207).json({
        message: 'Partial success',
        created: createdTickers,
        errors,
        });
    }

    return res.status(201).json(createdTickers.length === 1 ? createdTickers[0] : createdTickers);
});

// @ts-ignore
router.put('/', roleMiddleware([Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const updates = Array.isArray(req.body) ? req.body : [req.body];
  
    const updated: any[] = [];
    const errors: any[] = [];
  
    updates.forEach((item, index) => {
      const { id, symbol, fullName } = item;
  
      if (!id || typeof id !== 'string') {
        errors.push({ index, item, error: 'Missing or invalid ID' });
        return;
      }
  
      const idx = db.tickers.findIndex((t: any) => t.id === id);
      if (idx === -1) {
        errors.push({ index, id, error: 'Ticker not found' });
        return;
      }
  
      // Check if another ticker already has this symbol
      if (symbol) {
        const duplicate = db.tickers.find((t: any) => t.symbol === symbol && t.id !== id);
        if (duplicate) {
          errors.push({ index, id, symbol, error: 'Another ticker with this symbol already exists' });
          return;
        }
      }
  
      db.tickers[idx] = { ...db.tickers[idx], ...item };
      updated.push(db.tickers[idx]);
    });
  
    saveDB();
  
    if (errors.length > 0) {
      return res.status(207).json({ message: 'Partial success', updated, errors });
    }
  
    res.status(200).json(updated.length === 1 ? updated[0] : updated);
  });

// @ts-ignore
router.delete('/', roleMiddleware([Role.FullAccess, Role.UltimateAdmin]), (req, res) => {
    const ids = Array.isArray(req.body) ? req.body : [req.body];
  
    const deleted: string[] = [];
    const errors: any[] = [];
  
    ids.forEach((id, index) => {
      if (!id || typeof id !== 'string') {
        errors.push({ index, id, error: 'Invalid or missing ID' });
        return;
      }
  
      const exists = db.tickers.some((t: any) => t.id === id);
      if (!exists) {
        errors.push({ index, id, error: 'Ticker not found' });
        return;
      }
  
      db.tickers = db.tickers.filter((t: any) => t.id !== id);
      deleted.push(id);
    });
  
    saveDB();
  
    if (errors.length > 0) {
      return res.status(207).json({ message: 'Partial success', deleted, errors });
    }
  
    res.status(200).json({ message: 'All tickers deleted', deleted });
});

export default router;
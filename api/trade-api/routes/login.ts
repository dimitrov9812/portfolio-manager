import { Router } from 'express';
import { db } from '../utils/db';
import { JWT_SECRET } from '../utils/role';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// @ts-ignore
router.post('/', (req, res) => {
    const { username, password } = req.body;
    const operator = db.brokerOperators.find((op: any) => op.username === username);
    if (!operator || !bcrypt.compareSync(password, operator.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  
    const token = jwt.sign({ id: operator.id, role: operator.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
});

export default router;
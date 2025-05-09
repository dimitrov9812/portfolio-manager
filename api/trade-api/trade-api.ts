import express from 'express';
import loginRouter from './routes/login';
import tickersRouter from './routes/tickers';
import clientsRouter from './routes/clients';
import operatorsRouter from './routes/operators';
import { createOneUltimateAdmin } from './utils/middleware';

const app = express();
app.use(express.json());

// Ensure default admin user is present
createOneUltimateAdmin();

// Routes
app.use('/login', loginRouter);
app.use('/tickers', tickersRouter);
app.use('/clients', clientsRouter);
app.use('/broker-operators', operatorsRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`Broker API running on port ${PORT}`));
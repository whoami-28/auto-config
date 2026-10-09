/**
 * Porsche Configurator Express Server
 * REST API for Catalog, User Authentication, Configurations (CRUD), and Orders.
 * Built with Node.js, Express.js, and SQLite (better-sqlite3).
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import './db.js'; // Initializes SQLite schema & default demo user
import { CONFIG } from './config.js';
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import configurationsRouter from './routes/configurations.js';
import ordersRouter from './routes/orders.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const PORT = CONFIG.PORT;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/configurations', configurationsRouter);
app.use('/api/orders', ordersRouter);

// System Health endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// Backward-compatibility aliases for legacy client endpoints
app.post('/api/config/save', (req, res, next) => {
    req.url = '/';
    configurationsRouter(req, res, next);
});

app.post('/api/config/validate', (req, res, next) => {
    req.url = '/validate';
    configurationsRouter(req, res, next);
});

app.get('/api/config/:code', (req, res, next) => {
    req.url = `/${req.params.code}`;
    configurationsRouter(req, res, next);
});

app.get('/api/configs', (req, res, next) => {
    req.url = '/?all=true';
    configurationsRouter(req, res, next);
});

// Static Assets Serving
app.use(express.static(rootDir));

// Centralized Error Handler
app.use(errorHandler);

// SPA Fallback
app.use((req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server if run directly
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
    app.listen(PORT, () => {
        console.log(`Porsche Configurator Node.js server running at http://localhost:${PORT}`);
        console.log(`Database connected: SQLite (server/data/configurator.db)`);
    });
}

export default app;

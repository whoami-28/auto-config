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

// API Routes (mounted on /api and root aliases for Postman & client tolerance)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);

app.use('/api/catalog', catalogRouter);
app.use('/catalog', catalogRouter);

app.use('/api/configurations', configurationsRouter);
app.use('/configurations', configurationsRouter);

app.use('/api/orders', ordersRouter);
app.use('/orders', ordersRouter);

// System Health endpoint
const healthHandler = (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

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

// JSON 404 for unmatched API requests (prevents returning HTML for API calls)
app.use(['/api', '/auth', '/catalog', '/configurations', '/orders'], (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `API эндпоинт ${req.method} ${req.originalUrl} не найден`
        }
    });
});

// Static Assets Serving
app.use(express.static(rootDir));

// Centralized Error Handler
app.use(errorHandler);

// SPA Fallback: GET browser navigation returns index.html, non-GET returns JSON 404
app.use((req, res) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(rootDir, 'index.html'));
    } else {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Эндпоинт ${req.method} ${req.originalUrl} не найден`
            }
        });
    }
});

// Start Server if run directly
const isDirectRun = process.argv[1] && (
    fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase() ||
    process.argv[1].endsWith('server.js')
);
if (isDirectRun) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Porsche Configurator Node.js server running at http://localhost:${PORT}`);
        console.log(`Database connected: SQLite (server/data/configurator.db)`);
    });
}

export default app;

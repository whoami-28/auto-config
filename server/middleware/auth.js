/**
 * JWT Authentication and Access Control Middleware
 */

import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import db from '../db.js';

/**
 * Enforces valid Bearer JWT token.
 * Attaches req.user: { id, username, email, role }
 */
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Отсутствует или недействителен токен авторизации Bearer'
            }
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'Пользователь токена больше не существует'
                }
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Срок действия токена истек или подпись неверна'
            }
        });
    }
}

/**
 * Optional authentication: attaches req.user if valid token provided, but doesn't reject guests.
 */
export function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ?').get(decoded.id);
        req.user = user || null;
    } catch (err) {
        req.user = null;
    }
    next();
}

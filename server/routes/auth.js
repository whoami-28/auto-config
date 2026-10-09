/**
 * User Authentication Routes
 * Handles user registration, login, and profile fetching with JWT.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { CONFIG } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registers a new user.
 */
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Поля username, email и password обязательны для заполнения'
            }
        });
    }

    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_USERNAME',
                message: 'Имя пользователя должно содержать не менее 3 символов'
            }
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_EMAIL',
                message: 'Некорректный формат адреса электронной почты'
            }
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'WEAK_PASSWORD',
                message: 'Пароль должен содержать не менее 6 символов'
            }
        });
    }

    // Check uniqueness
    const existing = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
        const field = existing.username.toLowerCase() === username.toLowerCase() ? 'Имя пользователя' : 'Email';
        return res.status(409).json({
            success: false,
            error: {
                code: 'USER_EXISTS',
                message: `${field} уже зарегистрирован в системе`
            }
        });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, 'user')
    `).run(username, email, passwordHash);

    const userId = insert.lastInsertRowid;
    const token = jwt.sign(
        { id: userId, username, email, role: 'user' },
        CONFIG.JWT_SECRET,
        { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.status(201).json({
        success: true,
        message: 'Пользователь успешно зарегистрирован',
        data: {
            user: {
                id: userId,
                username,
                email,
                role: 'user'
            },
            token
        }
    });
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns JWT.
 */
router.post('/login', (req, res) => {
    const { identifier, username, email, password } = req.body;
    const loginUser = identifier || username || email;

    if (!loginUser || !password) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Необходимо указать логин/email и пароль'
            }
        });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(loginUser, loginUser);
    if (!user) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Неверное имя пользователя или пароль'
            }
        });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Неверное имя пользователя или пароль'
            }
        });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        CONFIG.JWT_SECRET,
        { expiresIn: CONFIG.JWT_EXPIRES_IN }
    );

    res.json({
        success: true,
        message: 'Аутентификация успешна',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        }
    });
});

/**
 * GET /api/auth/me
 * Retrieves the currently authenticated user's profile.
 */
router.get('/me', authMiddleware, (req, res) => {
    const configCount = db.prepare('SELECT COUNT(*) as count FROM configurations WHERE user_id = ?').get(req.user.id).count;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id).count;

    res.json({
        success: true,
        data: {
            user: req.user,
            stats: {
                savedConfigurations: configCount,
                orders: orderCount
            }
        }
    });
});

export default router;

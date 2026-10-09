/**
 * Orders REST API Routes
 * Implements vehicle order placement, state transitions, and tracking.
 */

import express from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateOrderNumber } from '../services/logicService.js';

const router = express.Router();

// Valid state machine transitions
const ALLOWED_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_production', 'cancelled'],
    in_production: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
};

/**
 * POST /api/orders
 * Places an order for a saved configuration
 */
router.post('/', authMiddleware, (req, res) => {
    const { porscheCode, dealerCity, dealerCenter } = req.body;
    const city = dealerCity || dealerCenter;

    if (!porscheCode || !city) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Необходимо указать porscheCode и дилерский центр (dealerCity или dealerCenter)'
            }
        });
    }

    const config = db.prepare('SELECT * FROM configurations WHERE porsche_code = ?').get(porscheCode.trim().toUpperCase());
    if (!config) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'CONFIGURATION_NOT_FOUND',
                message: `Конфигурация "${porscheCode}" не найдена`
            }
        });
    }

    const orderNumber = generateOrderNumber();

    const orderTx = db.transaction(() => {
        // Insert order
        const orderStmt = db.prepare(`
            INSERT INTO orders (order_number, configuration_id, user_id, dealer_city, status, total_price)
            VALUES (?, ?, ?, ?, 'pending', ?)
        `);

        orderStmt.run(orderNumber, config.id, req.user.id, city, config.total_price);

        // Update configuration status to 'ordered'
        db.prepare(`UPDATE configurations SET status = 'ordered', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(config.id);
    });

    orderTx();

    const createdOrder = db.prepare(`
        SELECT o.*, c.porsche_code, c.title as vehicle_title, u.username as customer_name
        FROM orders o
        JOIN configurations c ON o.configuration_id = c.id
        JOIN users u ON o.user_id = u.id
        WHERE o.order_number = ?
    `).get(orderNumber);

    res.status(201).json({
        success: true,
        message: 'Заказ успешно оформлен и передан официальному дилеру',
        data: createdOrder
    });
});

/**
 * GET /api/orders
 * Lists orders for the authenticated user
 */
router.get('/', authMiddleware, (req, res) => {
    const orders = db.prepare(`
        SELECT o.*, c.porsche_code, c.title as vehicle_title, c.model_id, c.trim_id
        FROM orders o
        JOIN configurations c ON o.configuration_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `).all(req.user.id);

    res.json({
        success: true,
        count: orders.length,
        data: orders
    });
});

/**
 * GET /api/orders/:orderNumber
 * Retrieves details of a specific order
 */
router.get('/:orderNumber', authMiddleware, (req, res) => {
    const orderNumber = req.params.orderNumber.trim().toUpperCase();

    const order = db.prepare(`
        SELECT o.*, c.porsche_code, c.title as vehicle_title, c.model_id, c.trim_id, c.currency,
               u.username as customer_name, u.email as customer_email
        FROM orders o
        JOIN configurations c ON o.configuration_id = c.id
        JOIN users u ON o.user_id = u.id
        WHERE o.order_number = ?
    `).get(orderNumber);

    if (!order) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'ORDER_NOT_FOUND',
                message: `Заказ "${orderNumber}" не найден`
            }
        });
    }

    // Access control: only owner or admin can view
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'У вас нет доступа к этому заказу'
            }
        });
    }

    res.json({
        success: true,
        data: order
    });
});

/**
 * PATCH /api/orders/:orderNumber/status
 * Manages state transitions for orders
 */
router.patch('/:orderNumber/status', authMiddleware, (req, res) => {
    const orderNumber = req.params.orderNumber.trim().toUpperCase();
    const { status: newStatus } = req.body;

    if (!newStatus) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Необходимо указать новый статус заказа (newStatus)'
            }
        });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'ORDER_NOT_FOUND',
                message: `Заказ "${orderNumber}" не найден`
            }
        });
    }

    // Verify ownership or admin
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Недостаточно прав для изменения статуса заказа'
            }
        });
    }

    // State transition rule verification
    const currentStatus = order.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedNext.includes(newStatus)) {
        return res.status(422).json({
            success: false,
            error: {
                code: 'INVALID_STATE_TRANSITION',
                message: `Недопустимый переход состояния: из "${currentStatus}" в "${newStatus}". Допустимые следующие состояния: [${allowedNext.join(', ')}]`
            }
        });
    }

    db.prepare(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newStatus, order.id);

    const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(order.id);

    res.json({
        success: true,
        message: `Статус заказа успешно изменен на "${newStatus}"`,
        data: updated
    });
});

export default router;

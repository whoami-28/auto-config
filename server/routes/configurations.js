/**
 * Configurations REST API Routes
 * Implements CRUD operations, business logic validation, and access control.
 */

import express from 'express';
import db from '../db.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { calculateServerPrice, validateServerRules, generatePorscheCode } from '../services/logicService.js';
import { CONFIG_DATA } from '../../js/data.js';

const router = express.Router();

/**
 * Helper to fetch a full configuration record with options
 */
function getFullConfigByCode(code) {
    const configRow = db.prepare(`
        SELECT c.*, u.username as owner_username, u.email as owner_email
        FROM configurations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.porsche_code = ?
    `).get(code.trim().toUpperCase());

    if (!configRow) return null;

    const optionRows = db.prepare(`
        SELECT option_id FROM configuration_options WHERE configuration_id = ?
    `).all(configRow.id);

    const options = optionRows.map(r => r.option_id);

    const configObj = {
        modelId: configRow.model_id,
        trimId: configRow.trim_id,
        colorId: configRow.color_id,
        wheelId: configRow.wheel_id,
        wheelFinishId: configRow.wheel_finish_id,
        caliperId: configRow.caliper_id,
        interiorId: configRow.interior_id,
        seatId: configRow.seat_id,
        options,
        currency: configRow.currency
    };

    const pricing = calculateServerPrice(configObj);

    return {
        id: configRow.id,
        porscheCode: configRow.porsche_code,
        userId: configRow.user_id,
        owner: configRow.owner_username ? { id: configRow.user_id, username: configRow.owner_username } : null,
        title: configRow.title,
        status: configRow.status,
        config: configObj,
        pricing,
        createdAt: configRow.created_at,
        updatedAt: configRow.updated_at
    };
}

/**
 * POST /api/configurations/validate
 * Validates a configuration without saving it
 */
router.post('/validate', (req, res) => {
    const config = (req.body && req.body.config) ? req.body.config : req.body;

    if (!config || !config.modelId || !config.trimId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PAYLOAD',
                message: 'Отсутствуют обязательные поля конфигурации (modelId, trimId)'
            }
        });
    }

    const validation = validateServerRules(config);
    const pricing = calculateServerPrice(config);

    res.json({
        success: true,
        isValid: validation.isValid,
        conflicts: validation.conflicts,
        pricing
    });
});

/**
 * POST /api/configurations
 * Creates and saves a new configuration
 */
router.post('/', optionalAuthMiddleware, (req, res) => {
    const body = req.body || {};
    const config = body.config || body;

    if (!config || !config.modelId || !config.trimId) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_PAYLOAD',
                message: 'Обязательные поля: modelId, trimId'
            }
        });
    }

    // Verify model exists in catalog
    const model = CONFIG_DATA.models.find(m => m.id === config.modelId);
    if (!model) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'MODEL_NOT_FOUND',
                message: `Модель "${config.modelId}" не найдена в каталоге`
            }
        });
    }

    const trim = model.trims.find(t => t.id === config.trimId);
    if (!trim) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'TRIM_NOT_FOUND',
                message: `Комплектация "${config.trimId}" не найдена для модели "${config.modelId}"`
            }
        });
    }

    // Server-side Business Logic Rule Validation
    const validation = validateServerRules(config);
    if (!validation.isValid) {
        return res.status(422).json({
            success: false,
            error: {
                code: 'COMPATIBILITY_CONFLICT',
                message: 'Конфигурация содержит несовместимые опции',
                conflicts: validation.conflicts
            }
        });
    }

    const pricing = calculateServerPrice(config);
    const porscheCode = (body.porscheCode || config.porscheCode || generatePorscheCode(config)).trim().toUpperCase();
    const userId = req.user ? req.user.id : null;
    const title = body.title || `${model.name} ${trim.name}`;

    // Transactional database insert or update if already exists
    const saveConfigTx = db.transaction(() => {
        const existing = db.prepare('SELECT id FROM configurations WHERE porsche_code = ?').get(porscheCode);
        let configId;

        if (existing) {
            configId = existing.id;
            db.prepare(`
                UPDATE configurations SET
                    title = ?, model_id = ?, trim_id = ?, color_id = ?,
                    wheel_id = ?, wheel_finish_id = ?, caliper_id = ?, interior_id = ?, seat_id = ?,
                    currency = ?, base_price = ?, equipment_price = ?, delivery_fee = ?, total_price = ?,
                    user_id = COALESCE(?, user_id), updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                title,
                config.modelId,
                config.trimId,
                config.colorId || 'paint_guards_red',
                config.wheelId || 'wheel_20_21_carrera_s',
                config.wheelFinishId || 'wf_brilliant_silver',
                config.caliperId || 'caliper_black',
                config.interiorId || 'int_standard_black',
                config.seatId || 'seat_sport_4way',
                config.currency || 'USD',
                pricing.basePriceUSD,
                pricing.totalEquipmentPriceUSD,
                pricing.deliveryFeeUSD,
                pricing.totalPriceUSD,
                userId,
                configId
            );
            db.prepare('DELETE FROM configuration_options WHERE configuration_id = ?').run(configId);
        } else {
            const stmt = db.prepare(`
                INSERT INTO configurations (
                    porsche_code, user_id, title, model_id, trim_id, color_id,
                    wheel_id, wheel_finish_id, caliper_id, interior_id, seat_id,
                    currency, status, base_price, equipment_price, delivery_fee, total_price
                ) VALUES (
                    ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?,
                    ?, 'saved', ?, ?, ?, ?
                )
            `);

            const result = stmt.run(
                porscheCode,
                userId,
                title,
                config.modelId,
                config.trimId,
                config.colorId || 'paint_guards_red',
                config.wheelId || 'wheel_20_21_carrera_s',
                config.wheelFinishId || 'wf_brilliant_silver',
                config.caliperId || 'caliper_black',
                config.interiorId || 'int_standard_black',
                config.seatId || 'seat_sport_4way',
                config.currency || 'USD',
                pricing.basePriceUSD,
                pricing.totalEquipmentPriceUSD,
                pricing.deliveryFeeUSD,
                pricing.totalPriceUSD
            );
            configId = result.lastInsertRowid;
        }

        // Insert options
        if (Array.isArray(config.options) && config.options.length > 0) {
            const insertOpt = db.prepare('INSERT OR IGNORE INTO configuration_options (configuration_id, option_id) VALUES (?, ?)');
            for (const optId of config.options) {
                insertOpt.run(configId, optId);
            }
        }

        return configId;
    });

    const configId = saveConfigTx();
    const savedRecord = getFullConfigByCode(porscheCode);

    res.status(201).json({
        success: true,
        message: 'Конфигурация успешно сохранена',
        porscheCode,
        shareUrl: `/index.html#code=${porscheCode}`,
        data: savedRecord
    });
});

/**
 * GET /api/configurations
 * Retrieves configurations list (user-specific or filtered)
 */
router.get('/', optionalAuthMiddleware, (req, res) => {
    let sql = `
        SELECT c.*, u.username as owner_username
        FROM configurations c
        LEFT JOIN users u ON c.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    // If query ?mine=true and user authenticated, show only their configurations
    if (req.query.mine === 'true') {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Требуется авторизация для просмотра личных конфигураций'
                }
            });
        }
        conditions.push('c.user_id = ?');
        params.push(req.user.id);
    } else if (req.user && req.query.all !== 'true') {
        // Default when logged in: show user's configurations first
        conditions.push('c.user_id = ?');
        params.push(req.user.id);
    }

    if (req.query.modelId) {
        conditions.push('c.model_id = ?');
        params.push(req.query.modelId);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 50';

    const rows = db.prepare(sql).all(...params);

    const list = rows.map(r => ({
        id: r.id,
        porscheCode: r.porsche_code,
        userId: r.user_id,
        owner: r.owner_username,
        title: r.title,
        modelId: r.model_id,
        trimId: r.trim_id,
        status: r.status,
        totalPriceUSD: r.total_price,
        formattedPrice: `$${new Intl.NumberFormat('ru-RU').format(Math.round(r.total_price))}`,
        createdAt: r.created_at
    }));

    res.json({
        success: true,
        count: list.length,
        data: list
    });
});

/**
 * GET /api/configurations/:code
 * Retrieves single configuration by Porsche Code
 */
router.get('/:code', (req, res) => {
    const code = req.params.code;
    const config = getFullConfigByCode(code);

    if (!config) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'CONFIGURATION_NOT_FOUND',
                message: `Конфигурация с кодом "${code}" не найдена`
            }
        });
    }

    res.json({
        success: true,
        data: config
    });
});

/**
 * PUT /api/configurations/:code
 * Updates an existing configuration. Enforces ownership rights.
 */
router.put('/:code', authMiddleware, (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const existing = db.prepare('SELECT * FROM configurations WHERE porsche_code = ?').get(code);

    if (!existing) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'CONFIGURATION_NOT_FOUND',
                message: `Конфигурация "${code}" не найдена`
            }
        });
    }

    // Access control: only owner or admin can modify
    if (existing.user_id && existing.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'У вас нет прав для изменения этой конфигурации'
            }
        });
    }

    const body = req.body || {};
    const config = body.config || body;

    // Validate rules
    const validation = validateServerRules(config);
    if (!validation.isValid) {
        return res.status(422).json({
            success: false,
            error: {
                code: 'COMPATIBILITY_CONFLICT',
                message: 'Конфигурация содержит несовместимые опции',
                conflicts: validation.conflicts
            }
        });
    }

    const pricing = calculateServerPrice(config);
    const title = body.title || existing.title;

    const updateTx = db.transaction(() => {
        db.prepare(`
            UPDATE configurations
            SET title = ?, model_id = ?, trim_id = ?, color_id = ?,
                wheel_id = ?, wheel_finish_id = ?, caliper_id = ?, interior_id = ?, seat_id = ?,
                currency = ?, base_price = ?, equipment_price = ?, delivery_fee = ?, total_price = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            title,
            config.modelId || existing.model_id,
            config.trimId || existing.trim_id,
            config.colorId || existing.color_id,
            config.wheelId || existing.wheel_id,
            config.wheelFinishId || existing.wheel_finish_id,
            config.caliperId || existing.caliper_id,
            config.interiorId || existing.interior_id,
            config.seatId || existing.seat_id,
            config.currency || existing.currency,
            pricing.basePriceUSD,
            pricing.totalEquipmentPriceUSD,
            pricing.deliveryFeeUSD,
            pricing.totalPriceUSD,
            existing.id
        );

        // Update options
        db.prepare('DELETE FROM configuration_options WHERE configuration_id = ?').run(existing.id);

        if (Array.isArray(config.options)) {
            const insertOpt = db.prepare('INSERT INTO configuration_options (configuration_id, option_id) VALUES (?, ?)');
            for (const optId of config.options) {
                insertOpt.run(existing.id, optId);
            }
        }
    });

    updateTx();
    const updated = getFullConfigByCode(code);

    res.json({
        success: true,
        message: 'Конфигурация успешно обновлена',
        data: updated
    });
});

/**
 * DELETE /api/configurations/:code
 * Deletes a configuration. Enforces ownership rights.
 */
router.delete('/:code', authMiddleware, (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const existing = db.prepare('SELECT * FROM configurations WHERE porsche_code = ?').get(code);

    if (!existing) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'CONFIGURATION_NOT_FOUND',
                message: `Конфигурация "${code}" не найдена`
            }
        });
    }

    // Access control: only owner or admin can delete
    if (existing.user_id && existing.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'У вас нет прав для удаления этой конфигурации'
            }
        });
    }

    db.prepare('DELETE FROM configurations WHERE id = ?').run(existing.id);

    res.json({
        success: true,
        message: `Конфигурация "${code}" успешно удалена`
    });
});

export default router;

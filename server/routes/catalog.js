/**
 * Catalog and Health Routes
 */

import express from 'express';
import { CONFIG_DATA } from '../../js/data.js';

const router = express.Router();

/**
 * GET /api/health
 * System health and uptime
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/catalog
 * Complete vehicle catalog, models, trims, options, and rules
 */
const getCatalogHandler = (req, res) => {
    res.json({
        success: true,
        data: {
            models: CONFIG_DATA.models,
            colors: CONFIG_DATA.colors,
            wheels: CONFIG_DATA.wheels,
            wheelFinishes: CONFIG_DATA.wheelFinishes,
            calipers: CONFIG_DATA.calipers,
            interiors: CONFIG_DATA.interiors,
            seats: CONFIG_DATA.seats,
            options: CONFIG_DATA.options,
            rules: CONFIG_DATA.rules,
            currencies: CONFIG_DATA.currencies,
            deliveryFee: CONFIG_DATA.deliveryFee
        }
    });
};

router.get('/', getCatalogHandler);
router.get('/catalog', getCatalogHandler);

export default router;

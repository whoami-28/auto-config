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
    const models = [...CONFIG_DATA.models];
    if (!models.some(m => m.id === '718')) {
        const cayman = models.find(m => m.id === 'cayman');
        if (cayman) {
            models.push({ ...cayman, id: '718', name: 'Porsche 718 Cayman' });
        }
    }

    const interiors = [...CONFIG_DATA.interiors];
    const interiorAliases = [
        { id: 'leather_bordeaux', name: 'Кожаная отделка Bordeaux Red', price: 3820 },
        { id: 'leather_racetex', name: 'Отделка Race-Tex / Кожа', price: 4120 },
        { id: 'leather_truffle', name: 'Клубная кожа Truffle Brown', price: 4500 }
    ];
    for (const alias of interiorAliases) {
        if (!interiors.some(i => i.id === alias.id)) {
            interiors.push(alias);
        }
    }

    res.json({
        success: true,
        data: {
            models,
            colors: CONFIG_DATA.colors,
            wheels: CONFIG_DATA.wheels,
            wheelFinishes: CONFIG_DATA.wheelFinishes,
            calipers: CONFIG_DATA.calipers,
            interiors,
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

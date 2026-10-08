/**
 * Porsche Configurator Node.js Server
 * REST API for catalog data, server-side compatibility validation,
 * price verification, and persistent Porsche Code storage.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { CONFIG_DATA } from '../js/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const dataFilePath = path.join(__dirname, 'data', 'configurations.json');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Persistent Store Helpers
function readConfigurationsStore() {
    try {
        if (!fs.existsSync(dataFilePath)) {
            fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
            fs.writeFileSync(dataFilePath, '{}', 'utf-8');
            return {};
        }
        const raw = fs.readFileSync(dataFilePath, 'utf-8');
        return JSON.parse(raw || '{}');
    } catch (err) {
        console.error('Error reading configurations store:', err);
        return {};
    }
}

function writeConfigurationsStore(store) {
    try {
        fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
        fs.writeFileSync(dataFilePath, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
        console.error('Error writing configurations store:', err);
    }
}

/**
 * Server-side Price Calculation Helper
 */
function calculateServerPrice(config) {
    const model = CONFIG_DATA.models.find(m => m.id === config.modelId) || CONFIG_DATA.models[0];
    const trim = model.trims.find(t => t.id === config.trimId) || model.trims[0];
    const color = CONFIG_DATA.colors.find(c => c.id === config.colorId) || CONFIG_DATA.colors[0];
    const wheel = CONFIG_DATA.wheels.find(w => w.id === config.wheelId) || CONFIG_DATA.wheels[0];
    const wheelFinish = CONFIG_DATA.wheelFinishes.find(wf => wf.id === config.wheelFinishId) || CONFIG_DATA.wheelFinishes[0];
    const caliper = CONFIG_DATA.calipers.find(c => c.id === config.caliperId) || CONFIG_DATA.calipers[0];
    const interior = CONFIG_DATA.interiors.find(i => i.id === config.interiorId) || CONFIG_DATA.interiors[0];
    const seat = CONFIG_DATA.seats.find(s => s.id === config.seatId) || CONFIG_DATA.seats[0];

    const selectedOptions = (config.options || [])
        .map(id => CONFIG_DATA.options.find(o => o.id === id))
        .filter(Boolean);

    const basePrice = trim.price;
    const colorPrice = color.price || 0;
    const wheelPrice = wheel.price || 0;
    const wheelFinishPrice = wheelFinish.price || 0;
    const caliperPrice = caliper.price || 0;
    const interiorPrice = interior.price || 0;
    const seatPrice = seat.price || 0;
    const optionsPrice = selectedOptions.reduce((sum, o) => sum + (o.price || 0), 0);

    const totalEquipmentPrice = colorPrice + wheelPrice + wheelFinishPrice + caliperPrice +
                                interiorPrice + seatPrice + optionsPrice;

    const deliveryFee = CONFIG_DATA.deliveryFee;
    const totalPrice = basePrice + totalEquipmentPrice + deliveryFee;

    const currencyCode = config.currency || 'USD';
    const curr = CONFIG_DATA.currencies[currencyCode] || CONFIG_DATA.currencies.USD;

    const formatPrice = (valUSD) => {
        const converted = Math.round(valUSD * curr.rate);
        const formatted = new Intl.NumberFormat('ru-RU').format(converted);
        if (currencyCode === 'USD') return `$${formatted}`;
        if (currencyCode === 'EUR') return `€${formatted}`;
        return `${formatted} ₽`;
    };

    return {
        basePriceUSD: basePrice,
        totalEquipmentPriceUSD: totalEquipmentPrice,
        deliveryFeeUSD: deliveryFee,
        totalPriceUSD: totalPrice,
        currency: currencyCode,
        symbol: curr.symbol,
        formatted: {
            basePrice: formatPrice(basePrice),
            equipmentPrice: formatPrice(totalEquipmentPrice),
            deliveryFee: formatPrice(deliveryFee),
            totalPrice: formatPrice(totalPrice)
        }
    };
}

/**
 * Server-side Validation of Compatibility Rules
 */
function validateServerRules(config) {
    const conflicts = [];

    const seat = CONFIG_DATA.seats.find(s => s.id === config.seatId);
    const wheel = CONFIG_DATA.wheels.find(w => w.id === config.wheelId);
    const options = config.options || [];

    // Rule 1: Full Bucket Seats vs Seat Ventilation
    if (seat && seat.isBucket && options.includes('opt_seat_ventilation')) {
        conflicts.push({
            ruleId: 'rule_buckets_vs_ventilation',
            title: 'Конфликт оснащения: Вентиляция и Карбоновые ковши',
            reason: 'Опция вентиляции сидений несовместима с каркасом облегченных ковшей (Full Bucket Seats).'
        });
    }

    // Rule 2: PCCB Ceramic brakes require wheel >= 20/21
    if (options.includes('opt_pccb') && wheel && wheel.size === '19/20') {
        conflicts.push({
            ruleId: 'rule_pccb_requires_wheels',
            title: 'Требование к диаметру дисков: Тормоза PCCB',
            reason: 'Керамические тормоза PCCB требуют диаметр дисков от 20/21 дюймов.'
        });
    }

    // Rule 3: Carbon roof vs Glass Sunroof
    if (options.includes('opt_carbon_roof') && options.includes('opt_glass_sunroof')) {
        conflicts.push({
            ruleId: 'rule_carbon_roof_vs_sunroof',
            title: 'Взаимоисключающие опции: Карбоновая крыша и Люк',
            reason: 'Нельзя одновременно установить сдвижной люк и монолитную карбоновую крышу.'
        });
    }

    // Rule 4: Burmester vs BOSE
    if (options.includes('opt_burmester') && options.includes('opt_bose')) {
        conflicts.push({
            ruleId: 'rule_burmester_vs_bose',
            title: 'Взаимоисключающие аудиосистемы',
            reason: 'Возможна установка только одной премиальной аудиосистемы.'
        });
    }

    // Rule 5: Front Axle Lift requires Sport Chrono
    if (options.includes('opt_front_axle_lift') && !options.includes('opt_sport_chrono')) {
        conflicts.push({
            ruleId: 'rule_lift_requires_chrono',
            title: 'Требование пакета: Система подъема передней оси',
            reason: 'Front Axle Lift требует интеграции с блоком управления Sport Chrono Package.'
        });
    }

    // Rule 6: Center-Lock wheels require GTS, Turbo S or GT3 trims
    if (wheel && wheel.id === 'wheel_20_21_gt3_centerlock' && !['911_carrera_gts', '911_turbo_s', '911_gt3_rs'].includes(config.trimId)) {
        conflicts.push({
            ruleId: 'rule_gt3_wheels_require_performance',
            title: 'Ограничение модификации: Диски Center-Lock',
            reason: 'Диски Center-Lock требуют ступицы с центральным креплением, доступные на GTS, Turbo S или GT3 RS.'
        });
    }

    return {
        isValid: conflicts.length === 0,
        conflicts
    };
}

/**
 * Generate Unique Porsche Code
 */
function generateServerPorscheCode(config) {
    const model = (config.modelId || '911').toUpperCase();
    const trim = (config.trimId || 'GTS').split('_').pop().toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PR-${model}-${trim}-${randomHash}`;
}

// =========================================================================
// API ROUTES
// =========================================================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// Catalog Tree
app.get('/api/catalog', (req, res) => {
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
});

// Validate configuration
app.post('/api/config/validate', (req, res) => {
    const config = (req.body && req.body.config) ? req.body.config : req.body;
    if (!config || !config.modelId || !config.trimId) {
        return res.status(400).json({ success: false, error: 'Invalid configuration payload' });
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

// Save configuration and generate persistent Porsche Code
app.post('/api/config/save', (req, res) => {
    const config = (req.body && req.body.config) ? req.body.config : req.body;
    if (!config || !config.modelId || !config.trimId) {
        return res.status(400).json({ success: false, error: 'Missing required configuration fields' });
    }

    const validation = validateServerRules(config);
    const pricing = calculateServerPrice(config);
    const porscheCode = generateServerPorscheCode(config);

    const record = {
        porscheCode,
        config,
        pricing,
        isValid: validation.isValid,
        conflicts: validation.conflicts,
        createdAt: new Date().toISOString()
    };

    const store = readConfigurationsStore();
    store[porscheCode] = record;
    writeConfigurationsStore(store);

    res.json({
        success: true,
        porscheCode,
        pricing,
        createdAt: record.createdAt,
        shareUrl: `/index.html#code=${porscheCode}`
    });
});

// Get configuration by Porsche Code
app.get('/api/config/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const store = readConfigurationsStore();
    const record = store[code];

    if (!record) {
        return res.status(404).json({
            success: false,
            error: `Configuration with code "${code}" not found`
        });
    }

    res.json({
        success: true,
        data: record
    });
});

// List recent saved configurations
app.get('/api/configs', (req, res) => {
    const store = readConfigurationsStore();
    const list = Object.values(store)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20)
        .map(item => ({
            porscheCode: item.porscheCode,
            modelId: item.config.modelId,
            trimId: item.config.trimId,
            totalPrice: item.pricing.formatted.totalPrice,
            createdAt: item.createdAt
        }));

    res.json({
        success: true,
        count: list.length,
        data: list
    });
});

// =========================================================================
// STATIC ASSETS SERVING
// =========================================================================
app.use(express.static(rootDir));

// SPA Fallback
app.use((req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Porsche Configurator Node.js server running at http://localhost:${PORT}`);
});

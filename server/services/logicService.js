/**
 * Server-side Business Logic Service
 * Performs price calculations, compatibility checks, and code generation.
 */

import { CONFIG_DATA } from '../../js/data.js';

/**
 * Calculates complete MSRP breakdown on the server
 */
export function calculateServerPrice(config) {
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
 * Validates automotive compatibility rules
 */
export function validateServerRules(config) {
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
 * Generates official Porsche Code
 */
export function generatePorscheCode(config) {
    const model = (config.modelId || '911').toUpperCase();
    const trim = (config.trimId || 'GTS').split('_').pop().toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PR-${model}-${trim}-${randomHash}`;
}

/**
 * Generates unique order number
 */
export function generateOrderNumber() {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randPart = Math.floor(1000 + Math.random() * 9000);
    return `PO-${datePart}-${randPart}`;
}

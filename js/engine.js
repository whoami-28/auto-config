/**
 * Porsche Configurator Engine
 * Manages configuration state, dynamic pricing, and compatibility/dependency rule resolution.
 */

import { CONFIG_DATA } from './data.js';

export class ConfiguratorEngine {
    constructor() {
        this.listeners = [];

        // Initial default state
        this.state = {
            modelId: '911',
            trimId: '911_carrera_gts',
            colorId: 'paint_guards_red',
            wheelId: 'wheel_20_21_rs_spyder',
            wheelFinishId: 'wf_satin_black',
            caliperId: 'caliper_red',
            interiorId: 'int_leather_black',
            seatId: 'seat_power_14way',
            options: ['opt_sport_chrono', 'opt_sport_exhaust', 'opt_matrix_led'],
            currency: 'USD',
            viewAngle: 'exterior_34_front', // exterior_34_front, exterior_side, exterior_34_rear, interior_cockpit
            lighting: 'day', // 'day' | 'night'
            scene: 'studio' // 'studio' | 'urban' | 'track'
        };

        this.syncStateWithModelAndTrim();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify(eventType = 'change', payload = null) {
        this.listeners.forEach(fn => {
            try {
                fn(this.getState(), eventType, payload);
            } catch (err) {
                console.error('Error in state listener:', err);
            }
        });
    }

    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    syncStateWithModelAndTrim() {
        const model = this.getCurrentModel();
        if (!model) return;

        // Verify trim belongs to current model
        const trimExists = model.trims.some(t => t.id === this.state.trimId);
        if (!trimExists && model.trims.length > 0) {
            this.state.trimId = model.trims[0].id;
        }
    }

    getCurrentModel() {
        return CONFIG_DATA.models.find(m => m.id === this.state.modelId) || CONFIG_DATA.models[0];
    }

    getCurrentTrim() {
        const model = this.getCurrentModel();
        return model.trims.find(t => t.id === this.state.trimId) || model.trims[0];
    }

    getCurrentColor() {
        return CONFIG_DATA.colors.find(c => c.id === this.state.colorId) || CONFIG_DATA.colors[0];
    }

    getCurrentWheel() {
        return CONFIG_DATA.wheels.find(w => w.id === this.state.wheelId) || CONFIG_DATA.wheels[0];
    }

    getCurrentWheelFinish() {
        return CONFIG_DATA.wheelFinishes.find(wf => wf.id === this.state.wheelFinishId) || CONFIG_DATA.wheelFinishes[0];
    }

    getCurrentCaliper() {
        return CONFIG_DATA.calipers.find(c => c.id === this.state.caliperId) || CONFIG_DATA.calipers[0];
    }

    getCurrentInterior() {
        return CONFIG_DATA.interiors.find(i => i.id === this.state.interiorId) || CONFIG_DATA.interiors[0];
    }

    getCurrentSeat() {
        return CONFIG_DATA.seats.find(s => s.id === this.state.seatId) || CONFIG_DATA.seats[0];
    }

    getSelectedOptions() {
        return this.state.options.map(id => CONFIG_DATA.options.find(o => o.id === id)).filter(Boolean);
    }

    // Setters
    setCurrency(currencyCode) {
        if (CONFIG_DATA.currencies[currencyCode]) {
            this.state.currency = currencyCode;
            this.notify('currency', currencyCode);
        }
    }

    setViewAngle(angle) {
        this.state.viewAngle = angle;
        this.notify('viewAngle', angle);
    }

    setLighting(lighting) {
        this.state.lighting = lighting;
        this.notify('lighting', lighting);
    }

    setScene(scene) {
        this.state.scene = scene;
        this.notify('scene', scene);
    }

    setModel(modelId) {
        const model = CONFIG_DATA.models.find(m => m.id === modelId);
        if (!model) return;

        this.state.modelId = modelId;
        this.state.trimId = model.trims[0].id;
        this.notify('model', modelId);
    }

    setTrim(trimId) {
        const model = this.getCurrentModel();
        const trim = model.trims.find(t => t.id === trimId);
        if (!trim) return;

        this.state.trimId = trimId;

        // If current wheels require GT3/GTS but new trim doesn't support it, fall back to Carrera S
        if (this.state.wheelId === 'wheel_20_21_gt3_centerlock' && !['911_carrera_gts', '911_turbo_s', '911_gt3_rs'].includes(trimId)) {
            this.state.wheelId = 'wheel_20_21_carrera_s';
        }

        this.notify('trim', trimId);
    }

    setColor(colorId) {
        const color = CONFIG_DATA.colors.find(c => c.id === colorId);
        if (!color) return;
        this.state.colorId = colorId;
        this.notify('color', colorId);
    }

    setWheel(wheelId) {
        const wheel = CONFIG_DATA.wheels.find(w => w.id === wheelId);
        if (!wheel) return;

        // Check if wheel requires specific trims (e.g. Center-Lock)
        if (wheelId === 'wheel_20_21_gt3_centerlock' && !['911_carrera_gts', '911_turbo_s', '911_gt3_rs'].includes(this.state.trimId)) {
            return {
                hasConflict: true,
                ruleTitle: 'Ограничение дисков Center-Lock',
                ruleReason: 'Кованые диски с центральной гайкой (Center-Lock) требуют креплений ступиц, доступных только на модификациях GTS, Turbo S и GT3 RS.',
                resolutionDescription: 'Для установки данных дисков комплектация автомобиля будет переключена на «911 Carrera GTS T-Hybrid».',
                applyResolution: () => {
                    this.state.trimId = '911_carrera_gts';
                    this.state.wheelId = wheelId;
                    this.notify('wheel', wheelId);
                }
            };
        }

        // Check if PCCB is active and wheel is 19/20 inch
        if (this.state.options.includes('opt_pccb') && wheel.size === '19/20') {
            return {
                hasConflict: true,
                ruleTitle: 'Несовместимость с тормозами PCCB',
                ruleReason: 'Карбоново-керамические тормоза PCCB (410 мм) не помещаются в 19/20-дюймовые диски.',
                resolutionDescription: 'Выбор дисков 19/20 Carrera приведет к отмене опции «Тормоза PCCB» (-$9,280).',
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_pccb');
                    this.state.wheelId = wheelId;
                    this.state.caliperId = 'caliper_red';
                    this.notify('wheel', wheelId);
                }
            };
        }

        this.state.wheelId = wheelId;
        this.notify('wheel', wheelId);
        return { hasConflict: false };
    }

    setWheelFinish(wheelFinishId) {
        this.state.wheelFinishId = wheelFinishId;
        this.notify('wheelFinish', wheelFinishId);
    }

    setCaliper(caliperId) {
        const caliper = CONFIG_DATA.calipers.find(c => c.id === caliperId);
        if (!caliper) return;

        // Yellow PCCB caliper only available with PCCB
        if (caliper.requiresPCCB && !this.state.options.includes('opt_pccb')) {
            return {
                hasConflict: true,
                ruleTitle: 'Требование керамических тормозов (PCCB)',
                ruleReason: 'Желтые суппорты доступны исключительно в составе пакета керамических композитных тормозов PCCB.',
                resolutionDescription: 'Добавить тормозную систему PCCB (+$9,280) и переключить суппорты на желтые?',
                applyResolution: () => {
                    this.state.options.push('opt_pccb');
                    this.state.caliperId = caliperId;
                    if (this.state.wheelId === 'wheel_19_20_carrera') {
                        this.state.wheelId = 'wheel_20_21_carrera_s';
                    }
                    this.notify('caliper', caliperId);
                }
            };
        }

        this.state.caliperId = caliperId;
        this.notify('caliper', caliperId);
        return { hasConflict: false };
    }

    setInterior(interiorId) {
        this.state.interiorId = interiorId;
        this.notify('interior', interiorId);
    }

    setSeat(seatId) {
        const seat = CONFIG_DATA.seats.find(s => s.id === seatId);
        if (!seat) return;

        // Check conflict with seat ventilation
        if (seat.isBucket && this.state.options.includes('opt_seat_ventilation')) {
            return {
                hasConflict: true,
                ruleTitle: 'Конфликт оснащения: Карбоновые ковши и Вентиляция',
                ruleReason: 'Облегченные карбоновые ковши (Full Bucket Seats) имеют цельный неперфорированный карбоновый монокок и не поддерживают вентиляцию.',
                resolutionDescription: 'При выборе карбоновых ковшей опция «Вентиляция передних сидений» (-$840) будет отключена.',
                removedOptions: ['opt_seat_ventilation'],
                addedOptions: [],
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_seat_ventilation');
                    this.state.seatId = seatId;
                    this.notify('seat', seatId);
                }
            };
        }

        this.state.seatId = seatId;
        this.notify('seat', seatId);
        return { hasConflict: false };
    }

    /**
     * Toggles an option or evaluates feasibility conflict
     */
    toggleOption(optionId) {
        const isCurrentlySelected = this.state.options.includes(optionId);

        // If turning OFF an option
        if (isCurrentlySelected) {
            // Check if another active option requires this one
            // E.g. Front Axle Lift requires Sport Chrono
            if (optionId === 'opt_sport_chrono' && this.state.options.includes('opt_front_axle_lift')) {
                return {
                    hasConflict: true,
                    ruleTitle: 'Зависимость опций',
                    ruleReason: 'Система подъема передней оси (Front Axle Lift) работает только совместно с пакетом Sport Chrono.',
                    resolutionDescription: 'Отключение Sport Chrono приведет к одновременному отключению системы подъема передней оси (-$2,770).',
                    removedOptions: ['opt_front_axle_lift'],
                    addedOptions: [],
                    applyResolution: () => {
                        this.state.options = this.state.options.filter(o => o !== optionId && o !== 'opt_front_axle_lift');
                        this.notify('options', this.state.options);
                    }
                };
            }

            // Normal removal
            this.state.options = this.state.options.filter(o => o !== optionId);
            this.notify('options', this.state.options);
            return { hasConflict: false };
        }

        // Turning ON an option - check conflict rules!
        const conflictCheck = this.checkOptionFeasibility(optionId);
        if (conflictCheck.hasConflict) {
            return conflictCheck;
        }

        // If it's a package with bundled options, add them automatically
        const optDef = CONFIG_DATA.options.find(o => o.id === optionId);
        if (optDef && optDef.bundledOptions && optDef.bundledOptions.length > 0) {
            optDef.bundledOptions.forEach(bundledId => {
                if (!this.state.options.includes(bundledId)) {
                    this.state.options.push(bundledId);
                }
            });
        }

        this.state.options.push(optionId);
        this.notify('options', this.state.options);
        return { hasConflict: false };
    }

    /**
     * Checks feasibility and incompatibility rules for a target option
     */
    checkOptionFeasibility(optionId) {
        // 1. Seat Ventilation vs Full Bucket Seats
        if (optionId === 'opt_seat_ventilation') {
            const currentSeat = this.getCurrentSeat();
            if (currentSeat && currentSeat.isBucket) {
                return {
                    hasConflict: true,
                    ruleTitle: 'Несовместимость: Вентиляция и Карбоновые ковши',
                    ruleReason: 'Опция «Вентиляция передних сидений» не может быть установлена на облегченные карбоновые ковши (Full Bucket Seats), так как каркас ковшей не имеет вентиляционных каналов.',
                    resolutionDescription: 'Для добавления вентиляции сиденья будут заменены на «Спортивные сиденья с памятью (14-позиционные)» (+$2,460 вместо ковшей $6,940).',
                    removedSeats: [currentSeat.id],
                    addedSeats: ['seat_power_14way'],
                    priceDelta: 840 - 6940 + 2460,
                    applyResolution: () => {
                        this.state.seatId = 'seat_power_14way';
                        this.state.options.push('opt_seat_ventilation');
                        this.notify('options', this.state.options);
                    }
                };
            }
        }

        // 2. PCCB requires wheels >= 20/21 inch
        if (optionId === 'opt_pccb') {
            const currentWheel = this.getCurrentWheel();
            if (currentWheel.size === '19/20') {
                return {
                    hasConflict: true,
                    ruleTitle: 'Требование к размеру дисков: Керамические тормоза PCCB',
                    ruleReason: 'Тормозные диски PCCB имеют диаметр 410 мм с массивными суппортами, которые не помещаются в базовые 19/20-дюймовые диски Carrera.',
                    resolutionDescription: 'Для установки тормозов PCCB диски будут автоматически обновлены до 20/21-дюймовых Carrera S (+$2,460), а тормозные суппорты станут фирменными желтыми.',
                    removedWheels: [currentWheel.id],
                    addedWheels: ['wheel_20_21_carrera_s'],
                    applyResolution: () => {
                        this.state.wheelId = 'wheel_20_21_carrera_s';
                        this.state.caliperId = 'caliper_yellow_pccb';
                        this.state.options.push('opt_pccb');
                        this.notify('options', this.state.options);
                    }
                };
            }
        }

        // 3. Carbon Roof vs Sunroof
        if (optionId === 'opt_carbon_roof' && this.state.options.includes('opt_glass_sunroof')) {
            return {
                hasConflict: true,
                ruleTitle: 'Взаимоисключающие опции: Карбоновая крыша и Люк',
                ruleReason: 'Автомобиль может быть оснащен либо облегченной монолитной карбоновой крышей, либо панорамным стеклянным люком.',
                resolutionDescription: 'Опция «Стеклянный подъемно-сдвижной панорамный люк» (-$2,000) будет удалена из комплектации.',
                removedOptions: ['opt_glass_sunroof'],
                addedOptions: ['opt_carbon_roof'],
                priceDelta: 3890 - 2000,
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_glass_sunroof');
                    this.state.options.push('opt_carbon_roof');
                    this.notify('options', this.state.options);
                }
            };
        }

        if (optionId === 'opt_glass_sunroof' && this.state.options.includes('opt_carbon_roof')) {
            return {
                hasConflict: true,
                ruleTitle: 'Взаимоисключающие опции: Панорамный люк и Карбоновая крыша',
                ruleReason: 'Автомобиль может быть оснащен либо панорамным стеклянным люком, либо облегченной карбоновой крышей.',
                resolutionDescription: 'Опция «Облегченная карбоновая крыша» (-$3,890) будет удалена из комплектации.',
                removedOptions: ['opt_carbon_roof'],
                addedOptions: ['opt_glass_sunroof'],
                priceDelta: 2000 - 3890,
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_carbon_roof');
                    this.state.options.push('opt_glass_sunroof');
                    this.notify('options', this.state.options);
                }
            };
        }

        // 4. Burmester vs BOSE
        if (optionId === 'opt_burmester' && this.state.options.includes('opt_bose')) {
            return {
                hasConflict: true,
                ruleTitle: 'Взаимоисключающие аудиосистемы',
                ruleReason: 'Автомобиль может быть укомплектован только одной премиальной аудиосистемой.',
                resolutionDescription: 'Аудиосистема BOSE® (-$1,600) будет заменена на флагманскую акустику Burmester® High-End (+$5,560).',
                removedOptions: ['opt_bose'],
                addedOptions: ['opt_burmester'],
                priceDelta: 5560 - 1600,
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_bose');
                    this.state.options.push('opt_burmester');
                    this.notify('options', this.state.options);
                }
            };
        }

        if (optionId === 'opt_bose' && this.state.options.includes('opt_burmester')) {
            return {
                hasConflict: true,
                ruleTitle: 'Взаимоисключающие аудиосистемы',
                ruleReason: 'Автомобиль может быть укомплектован только одной премиальной аудиосистемой.',
                resolutionDescription: 'Аудиосистема Burmester® (-$5,560) будет заменена на акустику BOSE® Surround Sound (+$1,600).',
                removedOptions: ['opt_burmester'],
                addedOptions: ['opt_bose'],
                priceDelta: 1600 - 5560,
                applyResolution: () => {
                    this.state.options = this.state.options.filter(o => o !== 'opt_burmester');
                    this.state.options.push('opt_bose');
                    this.notify('options', this.state.options);
                }
            };
        }

        // 5. Front Axle Lift requires Sport Chrono
        if (optionId === 'opt_front_axle_lift' && !this.state.options.includes('opt_sport_chrono')) {
            return {
                hasConflict: true,
                ruleTitle: 'Требование пакета: Система подъема передней оси',
                ruleReason: 'Система подъема передней оси интегрирована с датчиками ускорения и блоком управления пакета Sport Chrono.',
                resolutionDescription: 'В комплектацию будет автоматически добавлен обязательный «Пакет Sport Chrono» (+$2,790).',
                addedOptions: ['opt_sport_chrono', 'opt_front_axle_lift'],
                priceDelta: 2770 + 2790,
                applyResolution: () => {
                    this.state.options.push('opt_sport_chrono');
                    this.state.options.push('opt_front_axle_lift');
                    this.notify('options', this.state.options);
                }
            };
        }

        // 6. Weissach requires Bucket Seats
        if (optionId === 'pkg_weissach') {
            const currentSeat = this.getCurrentSeat();
            if (!currentSeat.isBucket) {
                return {
                    hasConflict: true,
                    ruleTitle: 'Требование пакета Weissach: Карбоновые ковши',
                    ruleReason: 'Трековый пакет Weissach Package омологирован только в сочетании с облегченными карбоновыми ковшеобразными сиденьями (Full Bucket Seats).',
                    resolutionDescription: 'Сиденья будут заменены на облегченные карбоновые ковши (+$6,940), а вентиляция сидений (при наличии) будет отключена.',
                    addedSeats: ['seat_full_bucket'],
                    applyResolution: () => {
                        this.state.seatId = 'seat_full_bucket';
                        this.state.options = this.state.options.filter(o => o !== 'opt_seat_ventilation');
                        this.state.options.push('pkg_weissach');
                        this.notify('options', this.state.options);
                    }
                };
            }
        }

        return { hasConflict: false };
    }

    /**
     * Inspects if an option is currently in conflict or missing prerequisite,
     * to render warning badges and reasons directly in the catalog!
     */
    getOptionConflictStatus(optionId) {
        if (this.state.options.includes(optionId)) {
            return { hasConflict: false, isSelected: true };
        }

        if (optionId === 'opt_seat_ventilation' && this.getCurrentSeat().isBucket) {
            return {
                hasConflict: true,
                conflictType: 'incompatible',
                reason: 'Несовместимо с карбоновыми ковшами (Full Bucket Seats)'
            };
        }

        if (optionId === 'opt_pccb' && this.getCurrentWheel().size === '19/20') {
            return {
                hasConflict: true,
                conflictType: 'prerequisite',
                reason: 'Требует диски диаметром от 20/21 дюймов'
            };
        }

        if (optionId === 'opt_carbon_roof' && this.state.options.includes('opt_glass_sunroof')) {
            return {
                hasConflict: true,
                conflictType: 'incompatible',
                reason: 'Конфликтует с опцией «Панорамный стеклянный люк»'
            };
        }

        if (optionId === 'opt_glass_sunroof' && this.state.options.includes('opt_carbon_roof')) {
            return {
                hasConflict: true,
                conflictType: 'incompatible',
                reason: 'Конфликтует с опцией «Облегченная карбоновая крыша»'
            };
        }

        if (optionId === 'opt_burmester' && this.state.options.includes('opt_bose')) {
            return {
                hasConflict: true,
                conflictType: 'incompatible',
                reason: 'Заменяет аудиосистему BOSE® Surround Sound'
            };
        }

        if (optionId === 'opt_bose' && this.state.options.includes('opt_burmester')) {
            return {
                hasConflict: true,
                conflictType: 'incompatible',
                reason: 'Заменяет аудиосистему Burmester® High-End'
            };
        }

        if (optionId === 'opt_front_axle_lift' && !this.state.options.includes('opt_sport_chrono')) {
            return {
                hasConflict: true,
                conflictType: 'prerequisite',
                reason: 'Требует обязательной установки пакета Sport Chrono'
            };
        }

        if (optionId === 'pkg_weissach' && !this.getCurrentSeat().isBucket) {
            return {
                hasConflict: true,
                conflictType: 'prerequisite',
                reason: 'Требует установки карбоновых ковшей (Full Bucket Seats)'
            };
        }

        return { hasConflict: false };
    }

    /**
     * Calculates comprehensive price breakdown
     */
    calculatePrice() {
        const trim = this.getCurrentTrim();
        const color = this.getCurrentColor();
        const wheel = this.getCurrentWheel();
        const wheelFinish = this.getCurrentWheelFinish();
        const caliper = this.getCurrentCaliper();
        const interior = this.getCurrentInterior();
        const seat = this.getCurrentSeat();
        const selectedOptions = this.getSelectedOptions();

        const basePrice = trim ? trim.price : 0;
        const colorPrice = color ? color.price : 0;
        const wheelPrice = wheel ? wheel.price : 0;
        const wheelFinishPrice = wheelFinish ? wheelFinish.price : 0;
        const caliperPrice = caliper ? caliper.price : 0;
        const interiorPrice = interior ? interior.price : 0;
        const seatPrice = seat ? seat.price : 0;

        const optionsPrice = selectedOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);

        const totalEquipmentPrice = colorPrice + wheelPrice + wheelFinishPrice + caliperPrice +
                                    interiorPrice + seatPrice + optionsPrice;

        const deliveryFee = CONFIG_DATA.deliveryFee;
        const totalPrice = basePrice + totalEquipmentPrice + deliveryFee;

        const curr = CONFIG_DATA.currencies[this.state.currency] || CONFIG_DATA.currencies.USD;

        const formatCurrency = (amountInUSD) => {
            const converted = Math.round(amountInUSD * curr.rate);
            const formatted = new Intl.NumberFormat('ru-RU').format(converted);
            if (this.state.currency === 'USD') return `$${formatted}`;
            if (this.state.currency === 'EUR') return `€${formatted}`;
            return `${formatted} ₽`;
        };

        return {
            basePriceUSD: basePrice,
            totalEquipmentPriceUSD: totalEquipmentPrice,
            deliveryFeeUSD: deliveryFee,
            totalPriceUSD: totalPrice,

            basePriceFormatted: formatCurrency(basePrice),
            equipmentPriceFormatted: formatCurrency(totalEquipmentPrice),
            deliveryFeeFormatted: formatCurrency(deliveryFee),
            totalPriceFormatted: formatCurrency(totalPrice),

            format: formatCurrency,
            currency: this.state.currency,
            symbol: curr.symbol,

            breakdown: [
                { category: 'Базовая комплектация', name: `${this.getCurrentModel().name} ${trim.name}`, price: basePrice, formatted: formatCurrency(basePrice), stepIndex: 1 },
                { category: 'Цвет кузова', name: color.nameRu, price: colorPrice, formatted: colorPrice === 0 ? 'Входит в базу' : formatCurrency(colorPrice), stepIndex: 2 },
                { category: 'Колесные диски', name: wheel.nameRu, price: wheelPrice, formatted: wheelPrice === 0 ? 'Входит в базу' : formatCurrency(wheelPrice), stepIndex: 2 },
                { category: 'Окраска дисков', name: wheelFinish.name, price: wheelFinishPrice, formatted: wheelFinishPrice === 0 ? 'Стандарт' : formatCurrency(wheelFinishPrice), stepIndex: 2 },
                { category: 'Тормозные суппорты', name: caliper.name, price: caliperPrice, formatted: caliperPrice === 0 ? 'Стандарт' : formatCurrency(caliperPrice), stepIndex: 2 },
                { category: 'Отделка салона', name: interior.nameRu, price: interiorPrice, formatted: interiorPrice === 0 ? 'Входит в базу' : formatCurrency(interiorPrice), stepIndex: 3 },
                { category: 'Сиденья', name: seat.nameRu, price: seatPrice, formatted: seatPrice === 0 ? 'Входит в базу' : formatCurrency(seatPrice), stepIndex: 3 },
                ...selectedOptions.map(opt => ({
                    category: opt.categoryName,
                    name: opt.nameRu,
                    code: opt.code,
                    id: opt.id,
                    price: opt.price,
                    formatted: formatCurrency(opt.price),
                    stepIndex: 4,
                    removable: true
                }))
            ]
        };
    }

    /**
     * Generates persistent Porsche Code
     */
    generatePorscheCode() {
        const parts = [
            this.state.modelId.toUpperCase(),
            this.getCurrentTrim().name.replace(/\s+/g, '').slice(-3).toUpperCase(),
            Math.abs(this.hashCode(JSON.stringify(this.state))).toString(36).toUpperCase().padStart(6, '0')
        ];
        return `PR-${parts.join('-')}`;
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    /**
     * Export / Import state
     */
    exportJSON() {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            porscheCode: this.generatePorscheCode(),
            config: this.state
        }, null, 2);
    }

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const cfg = data.config || data;
            if (cfg.modelId && cfg.trimId) {
                this.state = Object.assign({}, this.state, cfg);
                this.syncStateWithModelAndTrim();
                this.notify('import', this.state);
                return true;
            }
        } catch (e) {
            console.error('Invalid configuration JSON:', e);
        }
        return false;
    }
}

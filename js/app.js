/**
 * Porsche Configurator UI Controller
 * Orchestrates step navigation, catalog rendering, compatibility resolution modals,
 * summary view with quick edit/remove capabilities, and Porsche Code persistence.
 */

import { CONFIG_DATA } from './data.js';
import { ConfiguratorEngine } from './engine.js';
import { VehicleVisualizer } from './visualizer.js';

export class App {
    constructor() {
        this.engine = new ConfiguratorEngine();
        this.currentStep = 0; // 0: Models, 1: Trim, 2: Exterior, 3: Interior, 4: Options, 5: Summary
        this.searchQuery = '';
        this.pendingConflict = null;

        this.steps = [
            { id: 'models', label: 'Модель' },
            { id: 'trims', label: 'Комплектация' },
            { id: 'exterior', label: 'Экстерьер' },
            { id: 'interior', label: 'Интерьер' },
            { id: 'options', label: 'Опции' },
            { id: 'summary', label: 'Итог' }
        ];

        this.init();
    }

    init() {
        // Initialize Visualizer
        const visualizerContainer = document.getElementById('visualizer-container');
        if (visualizerContainer) {
            this.visualizer = new VehicleVisualizer(visualizerContainer, this.engine);
        }

        // Subscribe to engine changes
        this.engine.subscribe((state, eventType, payload) => {
            this.updateHeaderAndFooterPrices();
            this.renderCurrentStep();
            this.updateSummaryIfVisible();
        });

        // Initialize UI navigation and events
        this.currentUser = null;
        this.authToken = localStorage.getItem('porsche_auth_token') || null;
        this.initAuth();
        this.renderStepNavigation();
        this.bindGlobalEvents();
        this.renderCurrentStep();
        this.updateHeaderAndFooterPrices();
        this.checkUrlForSharedCode();
    }

    renderStepNavigation() {
        const navEl = document.getElementById('step-nav');
        if (!navEl) return;

        navEl.innerHTML = this.steps.map((step, idx) => `
            <button class="step-tab ${idx === this.currentStep ? 'active' : ''}" data-step="${idx}" type="button">
                <span class="step-label">${step.label}</span>
            </button>
        `).join('');

        navEl.querySelectorAll('.step-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stepIdx = parseInt(e.currentTarget.dataset.step, 10);
                this.goToStep(stepIdx);
            });
        });
    }

    goToStep(stepIdx) {
        if (stepIdx < 0 || stepIdx >= this.steps.length) return;
        this.currentStep = stepIdx;
        this.renderStepNavigation();
        this.renderCurrentStep();

        // Auto-switch visualizer angle for Interior step
        if (this.steps[stepIdx].id === 'interior') {
            this.engine.setViewAngle('interior_cockpit');
        } else if (this.steps[stepIdx].id !== 'interior' && this.engine.getState().viewAngle === 'interior_cockpit') {
            this.engine.setViewAngle('front_three_quarter');
        }

        // Scroll options pane to top smoothly
        const pane = document.getElementById('config-panel-content');
        if (pane) pane.scrollTo({ top: 0, behavior: 'smooth' });
    }

    bindGlobalEvents() {
        // Currency Selector
        const currSelect = document.getElementById('currency-select');
        if (currSelect) {
            currSelect.value = this.engine.getState().currency;
            currSelect.addEventListener('change', (e) => {
                this.engine.setCurrency(e.target.value);
            });
        }

        // Step Previous / Next buttons
        const prevBtn = document.getElementById('btn-prev-step');
        const nextBtn = document.getElementById('btn-next-step');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToStep(this.currentStep - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentStep < this.steps.length - 1) {
                    this.goToStep(this.currentStep + 1);
                } else {
                    this.goToStep(5); // Summary
                }
            });
        }

        // Price breakdown info popover trigger
        const priceInfoBtns = document.querySelectorAll('.price-info-trigger');
        priceInfoBtns.forEach(btn => {
            btn.addEventListener('click', () => this.openPriceBreakdownModal());
        });

        // Feasibility Conflict Modal handlers
        const modalAccept = document.getElementById('conflict-modal-accept');
        const modalCancel = document.getElementById('conflict-modal-cancel');
        const modalClose = document.getElementById('conflict-modal-close');

        if (modalAccept) {
            modalAccept.addEventListener('click', () => {
                if (this.pendingConflict && typeof this.pendingConflict.applyResolution === 'function') {
                    this.pendingConflict.applyResolution();
                }
                this.closeConflictModal();
            });
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', () => this.closeConflictModal());
        }

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeConflictModal());
        }

        // Share & Export / Import
        const btnShareCode = document.getElementById('btn-share-code');
        if (btnShareCode) {
            btnShareCode.addEventListener('click', () => this.openShareModal());
        }

        const btnExportJson = document.getElementById('btn-export-json');
        if (btnExportJson) {
            btnExportJson.addEventListener('click', () => this.downloadJSON());
        }

        const btnImportJson = document.getElementById('btn-import-json');
        if (btnImportJson) {
            btnImportJson.addEventListener('click', () => this.openImportModal());
        }

        // Share modal actions
        const shareModalClose = document.getElementById('share-modal-close');
        if (shareModalClose) {
            shareModalClose.addEventListener('click', () => this.closeShareModal());
        }

        const btnCopyShareLink = document.getElementById('btn-copy-share-link');
        if (btnCopyShareLink) {
            btnCopyShareLink.addEventListener('click', () => {
                const linkInput = document.getElementById('share-modal-link');
                if (linkInput && linkInput.value) {
                    navigator.clipboard.writeText(linkInput.value).then(() => {
                        this.showToast('Ссылка скопирована в буфер обмена');
                        btnCopyShareLink.textContent = 'Скопировано';
                        setTimeout(() => {
                            btnCopyShareLink.textContent = 'Копировать';
                        }, 2000);
                    });
                }
            });
        }

        // Close modals when clicking on background overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('visible');
                    this.pendingConflict = null;
                }
            });
        });

        // Close modals and exit visualizer fullscreen on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(overlay => {
                    overlay.classList.remove('visible');
                });
                this.pendingConflict = null;
                const vis = document.getElementById('visualizer-container');
                if (vis) vis.classList.remove('visualizer-fullscreen');
            }
        });
    }

    updateHeaderAndFooterPrices() {
        const prices = this.engine.calculatePrice();
        const trim = this.engine.getCurrentTrim();
        const model = this.engine.getCurrentModel();

        // Header
        const headerTitle = document.getElementById('header-vehicle-title');
        const headerPrice = document.getElementById('header-vehicle-price');
        if (headerTitle) headerTitle.textContent = `${model.name} ${trim.name}`;
        if (headerPrice) headerPrice.textContent = prices.totalPriceFormatted;

        // Sticky Footer Bar
        const footerTitle = document.getElementById('footer-vehicle-name');
        const footerBase = document.getElementById('footer-base-price');
        const footerEquip = document.getElementById('footer-equipment-price');
        const footerTotal = document.getElementById('footer-total-price');

        if (footerTitle) footerTitle.textContent = `${trim.name}`;
        if (footerBase) footerBase.textContent = prices.basePriceFormatted;
        if (footerEquip) footerEquip.textContent = prices.equipmentPriceFormatted;
        if (footerTotal) footerTotal.textContent = prices.totalPriceFormatted;

        // Prev / Next button states
        const prevBtn = document.getElementById('btn-prev-step');
        const nextBtn = document.getElementById('btn-next-step');
        if (prevBtn) prevBtn.disabled = this.currentStep === 0;
        if (nextBtn) {
            if (this.currentStep === this.steps.length - 1) {
                nextBtn.innerHTML = `Завершить выбор <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>`;
            } else {
                nextBtn.innerHTML = `Далее <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;
            }
        }
    }

    renderCurrentStep() {
        const container = document.getElementById('config-panel-content');
        if (!container) return;

        switch (this.currentStep) {
            case 0:
                this.renderModelsStep(container);
                break;
            case 1:
                this.renderTrimsStep(container);
                break;
            case 2:
                this.renderExteriorStep(container);
                break;
            case 3:
                this.renderInteriorStep(container);
                break;
            case 4:
                this.renderOptionsStep(container);
                break;
            case 5:
                this.renderSummaryStep(container);
                break;
        }
    }

    /**
     * STEP 0: Model Lineup Selection
     */
    renderModelsStep(container) {
        const state = this.engine.getState();
        const priceInfo = this.engine.calculatePrice();

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Этап 1</span>
                <h2>Выберите модель Porsche</h2>
                <p class="step-desc">Спортивные автомобили легендарного немецкого бренда с непревзойденной динамикой и инженерией.</p>
            </div>

            <div class="model-cards-grid">
                ${CONFIG_DATA.models.map(m => {
                    const isSelected = m.id === state.modelId;
                    return `
                        <div class="model-card ${isSelected ? 'selected' : ''}" data-model-id="${m.id}">
                            <div class="model-card-image-wrap">
                                <img src="${m.image}" alt="${m.name}" class="model-card-img" loading="lazy">
                            </div>
                            <div class="model-card-header">
                                <span class="model-series">${m.series}</span>
                                <h3 class="model-title">${m.name}</h3>
                                <p class="model-tagline">${m.tagline}</p>
                            </div>
                            <div class="model-card-price">
                                <span class="price-from">От</span>
                                <span class="price-amount">${priceInfo.format(m.basePrice)}</span>
                            </div>
                            <div class="model-specs-row">
                                <div class="spec-cell">
                                    <span class="spec-label">Мощность</span>
                                    <span class="spec-val">${m.specs.power}</span>
                                </div>
                                <div class="spec-cell">
                                    <span class="spec-label">0-100 км/ч</span>
                                    <span class="spec-val">${m.specs.acceleration}</span>
                                </div>
                                <div class="spec-cell">
                                    <span class="spec-label">Макс. скорость</span>
                                    <span class="spec-val">${m.specs.topSpeed}</span>
                                </div>
                            </div>
                            <button class="model-select-btn ${isSelected ? 'active' : ''}">
                                ${isSelected ? 'Выбрано' : 'Сконфигурировать'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const modelId = e.currentTarget.dataset.modelId;
                if (modelId) {
                    this.engine.setModel(modelId);
                    this.goToStep(1); // Auto progress to trim
                }
            });
        });
    }

    /**
     * STEP 1: Trim / Powertrain Selection
     */
    renderTrimsStep(container) {
        const model = this.engine.getCurrentModel();
        const state = this.engine.getState();
        const priceInfo = this.engine.calculatePrice();

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Этап 2</span>
                <h2>Комплектация и двигатель: ${model.name}</h2>
                <p class="step-desc">Выберите мощность, тип силовой установки и динамические характеристики.</p>
            </div>

            <div class="trim-list">
                ${model.trims.map(trim => {
                    const isSelected = trim.id === state.trimId;
                    return `
                        <div class="trim-card ${isSelected ? 'selected' : ''}" data-trim-id="${trim.id}">
                            <div class="trim-card-top">
                                <div>
                                    <h3 class="trim-name">${trim.name}</h3>
                                    <span class="trim-engine">${trim.engine} • ${trim.transmission}</span>
                                </div>
                                <div class="trim-price-box">
                                    <span class="trim-price">${priceInfo.format(trim.price)}</span>
                                    <span class="trim-msrp">Базовая цена MSRP</span>
                                </div>
                            </div>

                            <p class="trim-desc">${trim.description}</p>

                            <div class="trim-benchmark-bar">
                                <div class="bench-item">
                                    <span class="bench-val">${trim.power}</span>
                                    <span class="bench-lbl">Мощность</span>
                                </div>
                                <div class="bench-item">
                                    <span class="bench-val">${trim.acceleration}</span>
                                    <span class="bench-lbl">0–100 км/ч</span>
                                </div>
                                <div class="bench-item">
                                    <span class="bench-val">${trim.topSpeed}</span>
                                    <span class="bench-lbl">Макс. скорость</span>
                                </div>
                            </div>

                            <button class="trim-btn ${isSelected ? 'selected' : ''}">
                                ${isSelected ? 'Выбрано' : 'Выбрать комплектацию'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.trim-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const trimId = e.currentTarget.dataset.trimId;
                if (trimId) {
                    this.engine.setTrim(trimId);
                }
            });
        });
    }

    /**
     * STEP 2: Exterior (Colors, Wheels, Calipers)
     */
    renderExteriorStep(container) {
        const state = this.engine.getState();
        const priceInfo = this.engine.calculatePrice();

        // Group colors by Porsche categories
        const colorCategories = ['Contrasts', 'Shades', 'Dreams', 'Paint to Sample'];

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Этап 3</span>
                <h2>Экстерьер: Цвета кузова и Колесные диски</h2>
                <p class="step-desc">Индивидуализируйте оттенок кузова, форму и окраску дисков, а также тормозную систему.</p>
            </div>

            <!-- Colors Section -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">1. Цвет кузова</h3>
                
                ${colorCategories.map(cat => {
                    const catColors = CONFIG_DATA.colors.filter(c => c.category === cat);
                    if (catColors.length === 0) return '';
                    return `
                        <div class="color-category-block">
                            <div class="category-header">
                                <span class="cat-name">${cat}</span>
                                <span class="cat-price-info">
                                    ${cat === 'Contrasts' ? 'Входит в базовую цену' : priceInfo.format(catColors[0].price)}
                                </span>
                            </div>
                            <div class="color-swatches-grid">
                                ${catColors.map(c => {
                                    const isSelected = c.id === state.colorId;
                                    return `
                                        <div class="color-swatch-card ${isSelected ? 'selected' : ''}" data-color-id="${c.id}" title="${c.nameRu}">
                                            <div class="swatch-circle" style="background-color: ${c.hex}; ${c.metallic ? 'box-shadow: inset 0 0 8px rgba(255,255,255,0.4);' : ''}">
                                                ${isSelected ? '<span class="swatch-check">•</span>' : ''}
                                            </div>
                                            <span class="swatch-name">${c.name}</span>
                                            <span class="swatch-price">${c.price === 0 ? '0 ₽' : `+${priceInfo.format(c.price)}`}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Wheels Section -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">2. Колесные диски</h3>
                <div class="wheels-list">
                    ${CONFIG_DATA.wheels.map(w => {
                        const isSelected = w.id === state.wheelId;
                        const requiresGTS = w.id === 'wheel_20_21_gt3_centerlock' && !['911_carrera_gts', '911_turbo_s', '911_gt3_rs'].includes(state.trimId);
                        return `
                            <div class="wheel-option-card ${isSelected ? 'selected' : ''}" data-wheel-id="${w.id}">
                                <div class="wheel-icon-preview">
                                    <svg width="40" height="40" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="#1b1c1e" stroke="#555" stroke-width="4"/>
                                        <circle cx="50" cy="50" r="34" fill="#333"/>
                                        <circle cx="50" cy="50" r="10" fill="#bbb"/>
                                    </svg>
                                </div>
                                <div class="wheel-info">
                                    <div class="wheel-name-row">
                                        <h4 class="wheel-name">${w.nameRu}</h4>
                                        <span class="wheel-price">${w.price === 0 ? 'Стандарт' : `+${priceInfo.format(w.price)}`}</span>
                                    </div>
                                    <p class="wheel-desc">${w.description}</p>
                                    ${requiresGTS ? `
                                        <div class="conflict-badge-inline">
                                            Требует модификацию GTS / Turbo S
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="wheel-action">
                                    <span class="radio-indicator ${isSelected ? 'checked' : ''}"></span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Wheel Finishes -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">3. Окраска дисков (Wheel Finish)</h3>
                <div class="wheel-finishes-grid">
                    ${CONFIG_DATA.wheelFinishes.map(wf => {
                        const isSelected = wf.id === state.wheelFinishId;
                        return `
                            <div class="wheel-finish-card ${isSelected ? 'selected' : ''}" data-wheel-finish-id="${wf.id}">
                                <div class="finish-swatch" style="background-color: ${wf.hex}"></div>
                                <div class="finish-info">
                                    <span class="finish-name">${wf.name}</span>
                                    <span class="finish-price">${wf.price === 0 ? 'Стандарт' : `+${priceInfo.format(wf.price)}`}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Calipers -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">4. Тормозные суппорты</h3>
                <div class="calipers-grid">
                    ${CONFIG_DATA.calipers.map(cal => {
                        const isSelected = cal.id === state.caliperId;
                        const isYellowPCCB = cal.requiresPCCB;
                        return `
                            <div class="caliper-card ${isSelected ? 'selected' : ''}" data-caliper-id="${cal.id}">
                                <div class="caliper-dot" style="background-color: ${cal.hex}"></div>
                                <div class="caliper-info">
                                    <span class="caliper-name">${cal.name}</span>
                                    <span class="caliper-price">${cal.price === 0 ? 'Стандарт' : `+${priceInfo.format(cal.price)}`}</span>
                                </div>
                                ${isYellowPCCB ? '<span class="caliper-badge">Входит в PCCB</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Bind events for step 2
        container.querySelectorAll('.color-swatch-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const colorId = e.currentTarget.dataset.colorId;
                if (colorId) this.engine.setColor(colorId);
            });
        });

        container.querySelectorAll('.wheel-option-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const wheelId = e.currentTarget.dataset.wheelId;
                if (wheelId) {
                    const result = this.engine.setWheel(wheelId);
                    if (result && result.hasConflict) {
                        this.openConflictModal(result);
                    }
                }
            });
        });

        container.querySelectorAll('.wheel-finish-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const wfId = e.currentTarget.dataset.wheelFinishId;
                if (wfId) this.engine.setWheelFinish(wfId);
            });
        });

        container.querySelectorAll('.caliper-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const calId = e.currentTarget.dataset.caliperId;
                if (calId) {
                    const result = this.engine.setCaliper(calId);
                    if (result && result.hasConflict) {
                        this.openConflictModal(result);
                    }
                }
            });
        });
    }

    /**
     * STEP 3: Interior (Leather & Seats)
     */
    renderInteriorStep(container) {
        const state = this.engine.getState();
        const priceInfo = this.engine.calculatePrice();

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Этап 4</span>
                <h2>Интерьер: Материалы отделки и Сиденья</h2>
                <p class="step-desc">Выберите уровень кожаной отделки, цветовую комбинацию и конструкцию кресел.</p>
            </div>

            <!-- Interior Materials -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">1. Отделка салона и кожа</h3>
                <div class="interior-list">
                    ${CONFIG_DATA.interiors.map(int => {
                        const isSelected = int.id === state.interiorId;
                        return `
                            <div class="interior-card ${isSelected ? 'selected' : ''}" data-interior-id="${int.id}">
                                <div class="interior-swatch-preview" style="background-color: ${int.hex}">
                                    ${int.accentHex ? `<div class="interior-accent-stripe" style="background-color: ${int.accentHex}"></div>` : ''}
                                </div>
                                <div class="interior-info">
                                    <div class="interior-title-row">
                                        <h4 class="interior-name">${int.nameRu}</h4>
                                        <span class="interior-price">${int.price === 0 ? 'Входит в базу' : `+${priceInfo.format(int.price)}`}</span>
                                    </div>
                                    <p class="interior-desc">${int.description}</p>
                                </div>
                                <span class="radio-indicator ${isSelected ? 'checked' : ''}"></span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Seats -->
            <div class="config-subgroup">
                <h3 class="subgroup-title">2. Конструкция сидений</h3>
                <div class="seats-list">
                    ${CONFIG_DATA.seats.map(seat => {
                        const isSelected = seat.id === state.seatId;
                        const hasVentConflict = seat.isBucket && state.options.includes('opt_seat_ventilation');
                        return `
                            <div class="seat-card ${isSelected ? 'selected' : ''}" data-seat-id="${seat.id}">
                                <div class="seat-badge-icon">
                                    ${seat.isBucket ? 'Carbon Bucket' : 'Adaptive Sport'}
                                </div>
                                <div class="seat-info">
                                    <div class="seat-title-row">
                                        <h4 class="seat-name">${seat.nameRu}</h4>
                                        <span class="seat-price">${seat.price === 0 ? 'Базовые' : `+${priceInfo.format(seat.price)}`}</span>
                                    </div>
                                    <p class="seat-desc">${seat.description}</p>
                                    ${hasVentConflict ? `
                                        <div class="conflict-badge-inline">
                                            Несовместимо с активной опцией «Вентиляция сидений»
                                        </div>
                                    ` : ''}
                                </div>
                                <span class="radio-indicator ${isSelected ? 'checked' : ''}"></span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Bind events for step 3
        container.querySelectorAll('.interior-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const intId = e.currentTarget.dataset.interiorId;
                if (intId) {
                    this.engine.setInterior(intId);
                    if (this.engine.getState().viewAngle !== 'interior_cockpit') {
                        this.engine.setViewAngle('interior_cockpit');
                    }
                }
            });
        });

        container.querySelectorAll('.seat-card').forEach(el => {
            el.addEventListener('click', (e) => {
                const seatId = e.currentTarget.dataset.seatId;
                if (seatId) {
                    const result = this.engine.setSeat(seatId);
                    if (result && result.hasConflict) {
                        this.openConflictModal(result);
                    }
                }
            });
        });
    }

    /**
     * STEP 4: Options & Packages (with live Search and Compatibility Badges)
     */
    renderOptionsStep(container) {
        const state = this.engine.getState();
        const priceInfo = this.engine.calculatePrice();

        // Categorize options
        const categories = [
            { id: 'packages', title: 'Пакеты оснащения (Equipment Packages)' },
            { id: 'performance', title: 'Динамика и ходовая часть (Performance)' },
            { id: 'exterior_options', title: 'Экстерьер и оптика (Lights & Exterior)' },
            { id: 'interior_options', title: 'Комфорт салона (Interior Comfort)' },
            { id: 'audio_tech', title: 'Аудио и технологии (Audio & Tech)' }
        ];

        // Filter options by search query if any
        const filteredOptions = CONFIG_DATA.options.filter(opt => {
            if (!this.searchQuery) return true;
            const q = this.searchQuery.toLowerCase();
            return opt.name.toLowerCase().includes(q) ||
                   opt.nameRu.toLowerCase().includes(q) ||
                   opt.code.toLowerCase().includes(q) ||
                   opt.description.toLowerCase().includes(q);
        });

        const renderCategoriesHtml = () => categories.map(cat => {
            const catOptions = filteredOptions.filter(o => o.category === cat.id);
            if (catOptions.length === 0) return '';
            const selectedInCatCount = catOptions.filter(o => state.options.includes(o.id)).length;
            return `
                <div class="option-category-accordion open">
                    <div class="cat-accordion-header">
                        <div class="cat-accordion-left">
                            <h3 class="cat-accordion-title">${cat.title}</h3>
                            ${selectedInCatCount > 0 ? `<span class="cat-selected-badge">Выбрано: ${selectedInCatCount}</span>` : ''}
                        </div>
                        <svg class="cat-accordion-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div class="cat-accordion-content">
                        <div class="options-grid">
                            ${catOptions.map(opt => {
                                const isSelected = state.options.includes(opt.id);
                                const conflict = this.engine.getOptionConflictStatus(opt.id);
                                const hasConflict = conflict.hasConflict;

                                return `
                                    <div class="option-item-card ${isSelected ? 'selected' : ''} ${hasConflict ? 'has-conflict-warning' : ''}" data-option-id="${opt.id}">
                                        <div class="opt-card-top">
                                            <div class="opt-meta">
                                                <span class="opt-code">${opt.code}</span>
                                                ${opt.highlight ? '<span class="opt-tag-highlight">Top Choice</span>' : ''}
                                            </div>
                                            <span class="opt-price">+${priceInfo.format(opt.price)}</span>
                                        </div>

                                        <h4 class="opt-name">${opt.nameRu}</h4>
                                        <p class="opt-desc">${opt.description}</p>

                                        ${hasConflict ? `
                                            <div class="conflict-alert-card" title="Кликните для авто-разрешения">
                                                <span class="alert-icon">•</span>
                                                <span class="alert-text">${conflict.reason}</span>
                                            </div>
                                        ` : ''}

                                        <div class="opt-card-footer">
                                            <button class="opt-toggle-btn ${isSelected ? 'btn-active' : ''}">
                                                ${isSelected ? 'Добавлено' : (hasConflict ? 'Выбрать с разрешением' : '+ Добавить')}
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const bindOptionsEvents = (rootEl) => {
            rootEl.querySelectorAll('.cat-accordion-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    const accordion = e.currentTarget.closest('.option-category-accordion');
                    accordion.classList.toggle('open');
                });
            });

            rootEl.querySelectorAll('.option-item-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const optionId = e.currentTarget.dataset.optionId;
                    if (!optionId) return;

                    const result = this.engine.toggleOption(optionId);
                    if (result && result.hasConflict) {
                        this.openConflictModal(result);
                    }
                });
            });
        };

        const existingSearch = container.querySelector('#options-search-input');
        if (existingSearch) {
            const catContainer = container.querySelector('.options-categories-container');
            const countEl = container.querySelector('.search-hits-count');
            if (catContainer) {
                catContainer.innerHTML = renderCategoriesHtml();
                bindOptionsEvents(catContainer);
            }
            if (countEl) {
                countEl.textContent = `Найдено опций: ${filteredOptions.length}`;
            }
            return;
        }

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Этап 5</span>
                <h2>Дополнительное оснащение и пакеты</h2>
                <p class="step-desc">Выберите оригинальные технологические опции Porsche. Система автоматически проверяет совместимость.</p>
            </div>

            <!-- Search Bar -->
            <div class="search-options-bar">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="options-search-input" class="search-input" placeholder="Поиск опций по названию или PR-коду (например, PCCB, Chrono, 4D3)..." value="${this.searchQuery}">
                    ${this.searchQuery ? '<button id="btn-clear-search" class="clear-search-btn">&times;</button>' : ''}
                </div>
                <span class="search-hits-count">Найдено опций: ${filteredOptions.length}</span>
            </div>

            <!-- Option Categories Accordion -->
            <div class="options-categories-container">
                ${renderCategoriesHtml()}
            </div>
        `;

        // Search input handling
        const searchInput = container.querySelector('#options-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderOptionsStep(container);
            });
        }

        const clearSearchBtn = container.querySelector('#btn-clear-search');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.searchQuery = '';
                const inp = container.querySelector('#options-search-input');
                if (inp) inp.value = '';
                this.renderOptionsStep(container);
            });
        }

        bindOptionsEvents(container);
    }

    /**
     * STEP 5: Summary View (Final Specification, Edit Capability, Porsche Code)
     */
    renderSummaryStep(container) {
        const prices = this.engine.calculatePrice();
        const model = this.engine.getCurrentModel();
        const trim = this.engine.getCurrentTrim();
        const porscheCode = this.engine.generatePorscheCode();
        const heroImg = this.visualizer ? this.visualizer.resolveCurrentImage(this.engine.getState(), model, this.engine.getCurrentColor()) : 'assets/images/porsche_front_red.jpg';

        container.innerHTML = `
            <div class="step-header">
                <span class="step-tag">Итог конфигурации</span>
                <h2>Ваш Porsche: ${model.name} ${trim.name}</h2>
                <p class="step-desc">Полная заводская спецификация вашего автомобиля. Вы можете изменить любой параметр или сохранить конфигурацию.</p>
            </div>

            <!-- Hero Photo of Configured Porsche -->
            <div class="summary-hero-card">
                <img src="${heroImg}" alt="${model.name} ${trim.name}" class="summary-hero-img">
            </div>

            <!-- Porsche Code Share Box -->
            <div class="summary-code-card">
                <div class="code-card-left">
                    <span class="code-badge">Porsche Code</span>
                    <h3 class="porsche-code-text" id="display-porsche-code">${porscheCode}</h3>
                    <p class="code-sub">Используйте этот уникальный код у официального дилера Porsche или для загрузки сборки.</p>
                </div>
                <div class="code-card-actions">
                    <button class="code-btn primary" id="btn-copy-code">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Скопировать код
                    </button>
                    <button class="code-btn secondary" id="btn-print-build">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Печать / PDF
                    </button>
                </div>
            </div>

            <!-- Price Breakdown Summary Table -->
            <div class="summary-price-box">
                <h3 class="summary-sec-title">Финансовый расчет (Total MSRP)</h3>
                <div class="price-summary-table">
                    <div class="price-row main">
                        <span>Базовая стоимость (${trim.name})</span>
                        <span class="price-val">${prices.basePriceFormatted}</span>
                    </div>
                    <div class="price-row">
                        <span>Стоимость выбранного оборудования</span>
                        <span class="price-val">${prices.equipmentPriceFormatted}</span>
                    </div>
                    <div class="price-row">
                        <span>Сбор за транспортировку и подготовку (Delivery Fee)</span>
                        <span class="price-val">${prices.deliveryFeeFormatted}</span>
                    </div>
                    <div class="price-row total-highlight">
                        <span>Итоговая стоимость (Total MSRP)</span>
                        <span class="price-val-total">${prices.totalPriceFormatted}</span>
                    </div>
                </div>
            </div>

            <!-- Itemized Equipment List with Quick "Change" & "Remove" actions -->
            <div class="summary-equipment-box">
                <div class="equip-sec-header">
                    <h3 class="summary-sec-title">Выбранное оснащение и опции</h3>
                    <span class="items-count-badge">Всего элементов: ${prices.breakdown.length}</span>
                </div>

                <div class="summary-items-table">
                    ${prices.breakdown.map((item, idx) => `
                        <div class="summary-item-row">
                            <div class="item-col-cat">
                                <span class="cat-pill">${item.category}</span>
                            </div>
                            <div class="item-col-info">
                                <span class="item-name">${item.name}</span>
                                ${item.code ? `<span class="item-code-tag">Код: ${item.code}</span>` : ''}
                            </div>
                            <div class="item-col-price">
                                <span class="item-cost">${item.formatted}</span>
                            </div>
                            <div class="item-col-actions">
                                <button class="btn-item-change" data-target-step="${item.stepIndex}" title="Перейти к изменению">
                                    Изменить
                                </button>
                                ${item.removable ? `
                                    <button class="btn-item-remove" data-option-id="${item.id}" title="Удалить опцию">
                                        &times;
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Bind Summary events
        container.querySelectorAll('.btn-item-change').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetStep = parseInt(e.currentTarget.dataset.targetStep, 10);
                this.goToStep(targetStep);
            });
        });

        container.querySelectorAll('.btn-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const optId = e.currentTarget.dataset.optionId;
                if (optId) {
                    this.engine.toggleOption(optId);
                }
            });
        });

        const copyBtn = container.querySelector('#btn-copy-code');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(porscheCode).then(() => {
                    copyBtn.innerHTML = `Скопировано!`;
                    setTimeout(() => {
                        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Скопировать код`;
                    }, 2000);
                });
            });
        }

        const printBtn = container.querySelector('#btn-print-build');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    updateSummaryIfVisible() {
        if (this.currentStep === 5) {
            const container = document.getElementById('config-panel-content');
            if (container) this.renderSummaryStep(container);
        }
    }

    /**
     * Feasibility / Conflict Resolution Dialog (The iconic Porsche Pattern)
     */
    openConflictModal(conflict) {
        this.pendingConflict = conflict;
        const modal = document.getElementById('conflict-modal');
        if (!modal) return;

        const titleEl = document.getElementById('conflict-modal-title');
        const reasonEl = document.getElementById('conflict-modal-reason');
        const diffContainer = document.getElementById('conflict-modal-diff');
        const priceInfo = this.engine.calculatePrice();

        if (titleEl) titleEl.textContent = conflict.ruleTitle || 'Несовместимость оборудования';
        if (reasonEl) reasonEl.textContent = conflict.ruleReason || 'Выбранные элементы не могут быть объединены в одной комплектации.';

        let diffHtml = `
            <div class="conflict-resolution-plan">
                <p class="resolution-summary-text">${conflict.resolutionDescription || ''}</p>
        `;

        if (conflict.addedOptions && conflict.addedOptions.length > 0) {
            diffHtml += `
                <div class="diff-section added">
                    <span class="diff-title">Будет добавлено в комплектацию:</span>
                    <ul>
                        ${conflict.addedOptions.map(id => {
                            const opt = CONFIG_DATA.options.find(o => o.id === id);
                            return `<li><strong>${opt ? opt.nameRu : id}</strong> (+${priceInfo.format(opt ? opt.price : 0)})</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        if (conflict.removedOptions && conflict.removedOptions.length > 0) {
            diffHtml += `
                <div class="diff-section removed">
                    <span class="diff-title">Будет удалено из комплектации:</span>
                    <ul>
                        ${conflict.removedOptions.map(id => {
                            const opt = CONFIG_DATA.options.find(o => o.id === id);
                            return `<li><strong>${opt ? opt.nameRu : id}</strong> (-${priceInfo.format(opt ? opt.price : 0)})</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }

        if (conflict.priceDelta !== undefined && conflict.priceDelta !== null) {
            const sign = conflict.priceDelta > 0 ? '+' : '';
            diffHtml += `
                <div class="diff-price-delta">
                    <span>Итоговое изменение стоимости:</span>
                    <strong>${sign}${priceInfo.format(conflict.priceDelta)}</strong>
                </div>
            `;
        }

        diffHtml += `</div>`;
        if (diffContainer) diffContainer.innerHTML = diffHtml;

        modal.classList.add('visible');
    }

    closeConflictModal() {
        this.pendingConflict = null;
        const modal = document.getElementById('conflict-modal');
        if (modal) modal.classList.remove('visible');
    }

    /**
     * Price Breakdown Info Popover
     */
    openPriceBreakdownModal() {
        const modal = document.getElementById('price-breakdown-modal');
        if (!modal) return;

        const prices = this.engine.calculatePrice();
        const content = document.getElementById('price-breakdown-content');
        if (content) {
            content.innerHTML = `
                <div class="modal-breakdown-list">
                    <div class="mb-row header-row">
                        <span>Компонент</span>
                        <span>Стоимость</span>
                    </div>
                    ${prices.breakdown.map(b => `
                        <div class="mb-row">
                            <div>
                                <span class="mb-cat">${b.category}</span>
                                <div class="mb-name">${b.name}</div>
                            </div>
                            <span class="mb-price">${b.formatted}</span>
                        </div>
                    `).join('')}
                    <div class="mb-row">
                        <div>
                            <span class="mb-cat">Логистика</span>
                            <div class="mb-name">Доставка и дилерская подготовка</div>
                        </div>
                        <span class="mb-price">${prices.deliveryFeeFormatted}</span>
                    </div>
                    <div class="mb-row total-row">
                        <span class="mb-total-label">ИТОГО MSRP:</span>
                        <span class="mb-total-price">${prices.totalPriceFormatted}</span>
                    </div>
                </div>
            `;
        }

        modal.classList.add('visible');
        const closeBtn = document.getElementById('price-modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.remove('visible');
        }
    }

    /**
     * Toast notification helper
     */
    showToast(message) {
        const toast = document.getElementById('app-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2600);
    }

    /**
     * Share & Server Persistence
     */
    async saveConfigurationToServer() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const model = this.engine.getCurrentModel();
        const trim = this.engine.getCurrentTrim();

        try {
            const response = await fetch('/api/configurations', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title: `${model.name} ${trim.name}`,
                    config: this.engine.getState()
                })
            });
            if (response.ok) {
                const data = await response.json();
                const code = data.porscheCode || (data.data && data.data.porscheCode);
                if (code) {
                    return {
                        isServer: true,
                        porscheCode: code,
                        url: `${window.location.origin}${window.location.pathname}#code=${code}`
                    };
                }
            }
        } catch (err) {
            // Server offline or static hosting
        }

        const localCode = this.engine.generatePorscheCode();
        return {
            isServer: false,
            porscheCode: localCode,
            url: `${window.location.origin}${window.location.pathname}#code=${localCode}`
        };
    }

    async openShareModal() {
        const modal = document.getElementById('share-modal');
        if (!modal) return;

        const codeEl = document.getElementById('share-modal-code');
        const linkEl = document.getElementById('share-modal-link');
        const statusEl = document.getElementById('share-modal-status');
        const copyBtn = document.getElementById('btn-copy-share-link');

        if (codeEl) codeEl.textContent = 'Сохранение...';
        if (linkEl) linkEl.value = '';
        if (statusEl) statusEl.textContent = 'Синхронизация...';

        modal.classList.add('visible');

        const result = await this.saveConfigurationToServer();

        if (codeEl) codeEl.textContent = result.porscheCode;
        if (linkEl) linkEl.value = result.url;
        if (copyBtn) copyBtn.textContent = 'Копировать';

        if (statusEl) {
            if (result.isServer) {
                const userNotice = this.currentUser ? ` (Аккаунт: ${this.currentUser.username})` : '';
                statusEl.innerHTML = `<span style="color:#ffffff;">●</span> Сохранено в базе данных SQLite${userNotice}`;
            } else {
                statusEl.innerHTML = '<span style="color:#71717a;">●</span> Локальный код сборки (GitHub Pages)';
            }
        }
    }

    closeShareModal() {
        const modal = document.getElementById('share-modal');
        if (modal) modal.classList.remove('visible');
    }

    async checkUrlForSharedCode() {
        const hash = window.location.hash;
        const search = window.location.search;
        let code = null;

        if (hash && hash.includes('code=')) {
            const match = hash.match(/code=([^&]+)/);
            if (match) code = decodeURIComponent(match[1]);
        } else if (search && search.includes('code=')) {
            const urlParams = new URLSearchParams(search);
            code = urlParams.get('code');
        }

        if (!code) return;

        try {
            const response = await fetch(`/api/configurations/${encodeURIComponent(code)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.config) {
                    this.engine.importState(data.data.config);
                    this.showToast(`Конфигурация ${code} загружена с сервера`);
                    return;
                }
            }
        } catch (err) {
            // Server offline
        }
    }

    /**
     * User Authentication & Saved Configs Manager
     */
    async initAuth() {
        const authBtn = document.getElementById('btn-user-auth');
        const authModal = document.getElementById('auth-modal');
        const authModalClose = document.getElementById('auth-modal-close');
        const tabLoginBtn = document.getElementById('tab-login-btn');
        const tabRegisterBtn = document.getElementById('tab-register-btn');
        const loginForm = document.getElementById('auth-login-form');
        const registerForm = document.getElementById('auth-register-form');
        const btnQuickDemo = document.getElementById('btn-quick-demo');

        const configsModal = document.getElementById('user-configs-modal');
        const configsModalClose = document.getElementById('user-configs-close');
        const btnConfigsCloseAction = document.getElementById('btn-user-configs-close-action');
        const btnConfigsLogout = document.getElementById('btn-user-configs-logout');

        // Check active session
        if (this.authToken) {
            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        this.currentUser = data.data;
                        this.updateAuthUI();
                    } else {
                        this.clearAuth();
                    }
                } else {
                    this.clearAuth();
                }
            } catch (err) {
                const cachedUser = localStorage.getItem('porsche_user');
                if (cachedUser) {
                    try { this.currentUser = JSON.parse(cachedUser); } catch(e){}
                    this.updateAuthUI();
                }
            }
        }

        if (authBtn) {
            authBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    this.openUserConfigsModal();
                } else {
                    this.openAuthModal('login');
                }
            });
        }

        if (authModalClose) {
            authModalClose.addEventListener('click', () => {
                if (authModal) authModal.classList.remove('visible');
            });
        }

        if (tabLoginBtn && tabRegisterBtn) {
            tabLoginBtn.addEventListener('click', () => {
                tabLoginBtn.classList.add('active');
                tabRegisterBtn.classList.remove('active');
                loginForm?.classList.remove('hidden');
                registerForm?.classList.add('hidden');
            });
            tabRegisterBtn.addEventListener('click', () => {
                tabRegisterBtn.classList.add('active');
                tabLoginBtn.classList.remove('active');
                registerForm?.classList.remove('hidden');
                loginForm?.classList.add('hidden');
            });
        }

        if (btnQuickDemo) {
            btnQuickDemo.addEventListener('click', () => {
                const logInput = document.getElementById('login-identifier');
                const passInput = document.getElementById('login-password');
                if (logInput) logInput.value = 'demo';
                if (passInput) passInput.value = 'porsche123';
                if (loginForm) loginForm.dispatchEvent(new Event('submit'));
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const loginVal = document.getElementById('login-identifier')?.value.trim();
                const passVal = document.getElementById('login-password')?.value;
                const errEl = document.getElementById('login-error-msg');
                if (errEl) errEl.classList.remove('visible');

                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ login: loginVal, password: passVal })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        this.setAuth(data.data.token, data.data.user);
                        if (authModal) authModal.classList.remove('visible');
                        this.showToast(`Добро пожаловать, ${data.data.user.username}`);
                    } else {
                        if (errEl) {
                            errEl.textContent = (data.error && data.error.message) || data.error || 'Неверный логин или пароль';
                            errEl.classList.add('visible');
                        }
                    }
                } catch (err) {
                    if (errEl) {
                        errEl.textContent = 'Сервер недоступен';
                        errEl.classList.add('visible');
                    }
                }
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userVal = document.getElementById('register-username')?.value.trim();
                const emailVal = document.getElementById('register-email')?.value.trim();
                const passVal = document.getElementById('register-password')?.value;
                const errEl = document.getElementById('register-error-msg');
                if (errEl) errEl.classList.remove('visible');

                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: userVal, email: emailVal, password: passVal })
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        this.setAuth(data.data.token, data.data.user);
                        if (authModal) authModal.classList.remove('visible');
                        this.showToast(`Аккаунт ${data.data.user.username} успешно создан`);
                    } else {
                        if (errEl) {
                            errEl.textContent = (data.error && data.error.message) || data.error || 'Ошибка регистрации';
                            errEl.classList.add('visible');
                        }
                    }
                } catch (err) {
                    if (errEl) {
                        errEl.textContent = 'Сервер недоступен';
                        errEl.classList.add('visible');
                    }
                }
            });
        }

        if (configsModalClose) configsModalClose.onclick = () => configsModal?.classList.remove('visible');
        if (btnConfigsCloseAction) btnConfigsCloseAction.onclick = () => configsModal?.classList.remove('visible');
        if (btnConfigsLogout) {
            btnConfigsLogout.onclick = () => {
                this.clearAuth();
                configsModal?.classList.remove('visible');
                this.showToast('Вы вышли из учетной записи');
            };
        }
    }

    setAuth(token, user) {
        this.authToken = token;
        this.currentUser = user;
        localStorage.setItem('porsche_auth_token', token);
        localStorage.setItem('porsche_user', JSON.stringify(user));
        this.updateAuthUI();
    }

    clearAuth() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('porsche_auth_token');
        localStorage.removeItem('porsche_user');
        this.updateAuthUI();
    }

    updateAuthUI() {
        const labelEl = document.getElementById('user-auth-label');
        if (labelEl) {
            labelEl.textContent = this.currentUser ? this.currentUser.username : 'Войти';
        }
    }

    openAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        const tabLoginBtn = document.getElementById('tab-login-btn');
        const tabRegisterBtn = document.getElementById('tab-register-btn');
        const loginForm = document.getElementById('auth-login-form');
        const registerForm = document.getElementById('auth-register-form');

        if (mode === 'login') {
            tabLoginBtn?.classList.add('active');
            tabRegisterBtn?.classList.remove('active');
            loginForm?.classList.remove('hidden');
            registerForm?.classList.add('hidden');
        } else {
            tabRegisterBtn?.classList.add('active');
            tabLoginBtn?.classList.remove('active');
            registerForm?.classList.remove('hidden');
            loginForm?.classList.add('hidden');
        }

        document.getElementById('login-error-msg')?.classList.remove('visible');
        document.getElementById('register-error-msg')?.classList.remove('visible');
        modal.classList.add('visible');
    }

    async openUserConfigsModal() {
        const modal = document.getElementById('user-configs-modal');
        if (!modal) return;
        modal.classList.add('visible');

        const statusEl = document.getElementById('user-configs-status');
        const listEl = document.getElementById('user-configs-list');
        if (listEl) listEl.innerHTML = '';
        if (statusEl) {
            statusEl.textContent = 'Загрузка ваших сохраненных сборок...';
            statusEl.style.display = 'block';
        }

        try {
            const res = await fetch('/api/configurations?mine=true', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    if (statusEl) statusEl.style.display = 'none';
                    if (listEl) {
                        listEl.innerHTML = data.data.map(cfg => {
                            const dateStr = cfg.createdAt ? new Date(cfg.createdAt).toLocaleDateString('ru-RU') : '';
                            const priceStr = cfg.pricing ? cfg.pricing.totalPriceFormatted : `${cfg.totalPrice || 0} USD`;
                            return `
                                <div class="user-config-card" data-code="${cfg.porscheCode}">
                                    <div class="ucc-info">
                                        <span class="ucc-title">${cfg.title || 'Porsche'}</span>
                                        <div class="ucc-meta">
                                            <span class="ucc-code">${cfg.porscheCode}</span>
                                            <span>•</span>
                                            <span>${dateStr}</span>
                                        </div>
                                        <div class="ucc-price">${priceStr}</div>
                                    </div>
                                    <div class="ucc-actions">
                                        <button class="ucc-btn ucc-btn-load" data-action="load" data-code="${cfg.porscheCode}">Загрузить</button>
                                        <button class="ucc-btn ucc-btn-delete" data-action="delete" data-code="${cfg.porscheCode}">Удалить</button>
                                    </div>
                                </div>
                            `;
                        }).join('');

                        listEl.querySelectorAll('.ucc-btn-load').forEach(btn => {
                            btn.onclick = async (e) => {
                                const code = e.currentTarget.dataset.code;
                                await this.loadConfigByCode(code);
                                modal.classList.remove('visible');
                            };
                        });

                        listEl.querySelectorAll('.ucc-btn-delete').forEach(btn => {
                            btn.onclick = async (e) => {
                                const code = e.currentTarget.dataset.code;
                                if (confirm(`Удалить конфигурацию ${code}?`)) {
                                    await this.deleteConfigByCode(code);
                                    this.openUserConfigsModal();
                                }
                            };
                        });
                    }
                    return;
                }
            }
            if (statusEl) statusEl.textContent = 'У вас пока нет сохраненных конфигураций на сервере.';
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Ошибка загрузки сохраненных конфигураций.';
        }
    }

    async loadConfigByCode(code) {
        try {
            const res = await fetch(`/api/configurations/${encodeURIComponent(code)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data && data.data.config) {
                    this.engine.importState(data.data.config);
                    this.showToast(`Конфигурация ${code} успешно загружена`);
                    return;
                }
            }
        } catch(e){}
        this.showToast(`Не удалось загрузить конфигурацию ${code}`);
    }

    async deleteConfigByCode(code) {
        try {
            const res = await fetch(`/api/configurations/${encodeURIComponent(code)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            if (res.ok) {
                this.showToast(`Конфигурация ${code} удалена`);
            }
        } catch(e){}
    }

    downloadJSON() {
        const json = this.engine.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `porsche-config-${this.engine.generatePorscheCode()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Конфигурация сохранена в файл JSON');
    }

    openImportModal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const success = this.engine.importJSON(event.target.result);
                if (success) {
                    this.showToast('Конфигурация успешно импортирована');
                } else {
                    this.showToast('Ошибка при чтении файла конфигурации');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

// Instantiate and start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.porscheApp = new App();
});

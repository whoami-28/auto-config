/**
 * Porsche Interactive Vehicle Visualizer (Photo Render Engine)
 * High-fidelity photorealistic visualizer supporting multiple studio camera angles,
 * dynamic paint color variations, night lighting with headlights,
 * and luxury cockpit interior views.
 */

export class VehicleVisualizer {
    constructor(containerElement, engine) {
        this.container = containerElement;
        this.engine = engine;
        this.init();
    }

    init() {
        this.engine.subscribe((state, eventType) => {
            this.render();
        });
        this.render();
    }

    /**
     * Resolves the appropriate realistic image based on active state (model, color, angle, lighting)
     */
    resolveCurrentImage(state, model, color) {
        const isNight = state.lighting === 'night';

        // Night mode with headlights
        if (isNight && state.viewAngle !== 'interior_cockpit') {
            return 'assets/images/porsche_night_lights.jpg';
        }

        // Interior cockpit view - dynamic resolution based on selected leather trim
        if (state.viewAngle === 'interior_cockpit') {
            if (state.interiorId === 'int_leather_bordeaux' || state.interiorId === 'leather_bordeaux') {
                return 'assets/images/porsche_interior_bordeaux.jpg';
            }
            if (state.interiorId === 'int_racetex_sport' || state.interiorId === 'int_racetex_gt' || state.interiorId === 'leather_racetex') {
                return 'assets/images/porsche_interior_racetex.jpg';
            }
            if (state.interiorId === 'int_club_truffle' || state.interiorId === 'leather_truffle') {
                return 'assets/images/porsche_interior_truffle.jpg';
            }
            return 'assets/images/porsche_interior_cockpit.jpg';
        }

        // Exterior side profile
        if (state.viewAngle === 'exterior_side') {
            return 'assets/images/porsche_side_profile.jpg';
        }

        // Exterior rear 3/4 view
        if (state.viewAngle === 'exterior_34_rear') {
            return 'assets/images/porsche_rear_view.jpg';
        }

        // Exterior 3/4 Front - depends on selected Model and Color!
        if (state.modelId === 'macan') {
            return 'assets/images/porsche_macan_front.jpg';
        }
        if (state.modelId === 'cayenne') {
            return 'assets/images/porsche_cayenne_front.jpg';
        }
        if (state.modelId === 'taycan') {
            return 'assets/images/porsche_taycan_front.jpg';
        }
        if (state.modelId === 'panamera') {
            return 'assets/images/porsche_panamera_front.jpg';
        }
        if (state.modelId === 'cayman') {
            return 'assets/images/porsche_cayman_front.jpg';
        }

        // Porsche 911 color variants
        switch (color.id) {
            case 'paint_shark_blue':
            case 'paint_gentian_blue':
            case 'paint_pts_gulf_blue':
            case 'paint_pts_viola':
                return 'assets/images/porsche_front_blue.jpg';

            case 'paint_crayon':
            case 'paint_white':
                return 'assets/images/porsche_front_chalk.jpg';

            case 'paint_gt_silver':
            case 'paint_aventurine_green':
                return 'assets/images/porsche_front_silver.jpg';

            case 'paint_black':
            case 'paint_jet_black':
                return 'assets/images/porsche_front_black.jpg';

            case 'paint_racing_yellow':
                return 'assets/images/porsche_front_yellow.jpg';

            case 'paint_python_green':
                return 'assets/images/porsche_cayman_front.jpg';

            case 'paint_guards_red':
            case 'paint_carmine_red':
            case 'paint_pts_rubystar':
            default:
                return 'assets/images/porsche_front_red.jpg';
        }
    }

    render() {
        const state = this.engine.getState();
        const model = this.engine.getCurrentModel();
        const trim = this.engine.getCurrentTrim();
        const color = this.engine.getCurrentColor();
        const wheel = this.engine.getCurrentWheel();
        const isNight = state.lighting === 'night';

        const currentImgSrc = this.resolveCurrentImage(state, model, color);

        this.container.innerHTML = `
            <div class="visualizer-wrapper ${isNight ? 'scene-night' : 'scene-day'}">
                <div class="visualizer-stage-photo">
                    <img src="${currentImgSrc}" 
                         alt="${model.name} ${trim.name}" 
                         class="visualizer-hero-image"
                         id="visualizer-hero-img"
                         loading="eager" />
                    <div class="visualizer-gradient-vignette"></div>
                </div>

                <!-- Floating vehicle badge -->
                <div class="visualizer-badge">
                    <span class="badge-series">${model.series}</span>
                    <h3 class="badge-title">${trim.name}</h3>
                    <div class="badge-specs">
                        <div class="badge-spec-item">
                            <span class="spec-val">${trim.power.split(' ')[0]}</span>
                            <span class="spec-lbl">л.с.</span>
                        </div>
                        <div class="badge-spec-divider"></div>
                        <div class="badge-spec-item">
                            <span class="spec-val">${trim.acceleration}</span>
                            <span class="spec-lbl">0–100 км/ч</span>
                        </div>
                        <div class="badge-spec-divider"></div>
                        <div class="badge-spec-item">
                            <span class="spec-val">${trim.topSpeed}</span>
                            <span class="spec-lbl">макс. скорость</span>
                        </div>
                    </div>
                </div>

                <!-- Angle Switcher Controls -->
                <div class="visualizer-angle-bar">
                    <button class="angle-btn ${state.viewAngle === 'exterior_34_front' ? 'active' : ''}" data-angle="exterior_34_front" title="Экстерьер 3/4 спереди">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6L9 12L15 18"/></svg>
                        3/4 Спереди
                    </button>
                    <button class="angle-btn ${state.viewAngle === 'exterior_side' ? 'active' : ''}" data-angle="exterior_side" title="Профиль автомобиля">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/></svg>
                        Профиль
                    </button>
                    <button class="angle-btn ${state.viewAngle === 'exterior_34_rear' ? 'active' : ''}" data-angle="exterior_34_rear" title="Экстерьер 3/4 сзади">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18L15 12L9 6"/></svg>
                        3/4 Сзади
                    </button>
                    <button class="angle-btn ${state.viewAngle === 'interior_cockpit' ? 'active' : ''}" data-angle="interior_cockpit" title="Интерьер и кокпит">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>
                        Салон
                    </button>
                </div>

                <!-- Lighting and Utility Controls -->
                <div class="visualizer-env-bar">
                    <button class="env-toggle-btn ${state.lighting === 'night' ? 'active' : ''}" id="btn-toggle-night" title="${isNight ? 'Включить дневной свет' : 'Включить ночной свет и фары'}">
                        ${isNight 
                            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> День`
                            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Ночь (Фары)`
                        }
                    </button>

                    <button class="env-toggle-btn" id="btn-download-photo" title="Скачать фотографию текущего ракурса">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>

                    <button class="env-toggle-btn" id="btn-fullscreen-toggle" title="Полноэкранный просмотр">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    </button>
                </div>
            </div>
        `;

        this.bindEvents(currentImgSrc, trim.name);
    }

    bindEvents(currentImgSrc, trimName) {
        this.container.querySelectorAll('.angle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = e.currentTarget.dataset.angle;
                if (angle) this.engine.setViewAngle(angle);
            });
        });

        const nightBtn = this.container.querySelector('#btn-toggle-night');
        if (nightBtn) {
            nightBtn.addEventListener('click', () => {
                const current = this.engine.getState().lighting;
                this.engine.setLighting(current === 'night' ? 'day' : 'night');
            });
        }

        const downloadBtn = this.container.querySelector('#btn-download-photo');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = currentImgSrc;
                a.download = `porsche-${trimName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
                a.click();
            });
        }

        const fsBtn = this.container.querySelector('#btn-fullscreen-toggle');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                this.container.classList.toggle('visualizer-fullscreen');
            });
        }
    }
}

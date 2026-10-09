/**
 * Porsche Interactive Vehicle Visualizer (Hybrid 3D WebGL + Photo Render Engine)
 * Features real-time 3D WebGL exterior visualization powered by Three.js
 * for 360° rotation, dynamic automotive lacquer, wheel finishes, and brake calipers,
 * seamlessly transitioning to ultra-high-resolution cockpit photography for interior views.
 */

import { Porsche3DVisualizer } from './three_visualizer.js';

export class VehicleVisualizer {
    constructor(containerElement, engine) {
        this.container = containerElement;
        this.engine = engine;
        this.is3DMode = true; // Default to 3D WebGL for exterior
        this.threeVisualizer = null;
        this.hasWebGLSupport = true;
        this.currentLoadedModelId = null;

        this.init();
    }

    init() {
        this.buildLayout();
        this.init3DVisualizer();
        this.bindEvents();

        this.engine.subscribe((state, eventType) => {
            this.syncWithState(state, eventType);
        });

        this.syncWithState(this.engine.getState(), 'init');
    }

    buildLayout() {
        this.container.innerHTML = `
            <div class="visualizer-wrapper scene-day" id="visualizer-wrapper">
                <!-- 3D WebGL Stage -->
                <div class="visualizer-stage-3d" id="visualizer-3d-stage" style="opacity: 0; transition: opacity 0.4s ease;"></div>

                <!-- 2D High-Resolution Photo Stage (visible while 3D loads & for interior) -->
                <div class="visualizer-stage-photo" id="visualizer-photo-stage" style="display: flex;">
                    <img src="assets/images/porsche_front_red.jpg" 
                         alt="Porsche Studio View" 
                         class="visualizer-hero-image"
                         id="visualizer-hero-img"
                         loading="eager" />
                    <div class="visualizer-gradient-vignette"></div>
                </div>

                <!-- 3D Rotation Hint Overlay -->
                <div class="visualizer-3d-hint" id="visualizer-3d-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                    <span>Вращайте модель 360° • Колесико для зума</span>
                </div>

                <!-- Floating Vehicle Specs Badge -->
                <div class="visualizer-badge" id="visualizer-badge">
                    <span class="badge-series" id="badge-series">Iconic Sports Car</span>
                    <h3 class="badge-title" id="badge-title">Porsche 911 Carrera</h3>
                    <div class="badge-specs">
                        <div class="badge-spec-item">
                            <span class="spec-val" id="spec-power">394</span>
                            <span class="spec-lbl">л.с.</span>
                        </div>
                        <div class="badge-spec-divider"></div>
                        <div class="badge-spec-item">
                            <span class="spec-val" id="spec-accel">3.9 с</span>
                            <span class="spec-lbl">0–100 км/ч</span>
                        </div>
                        <div class="badge-spec-divider"></div>
                        <div class="badge-spec-item">
                            <span class="spec-val" id="spec-speed">294 км/ч</span>
                            <span class="spec-lbl">макс. скорость</span>
                        </div>
                    </div>
                </div>

                <!-- Camera Angle Switcher Controls -->
                <div class="visualizer-angle-bar" id="visualizer-angle-bar">
                    <button class="angle-btn active" data-angle="exterior_34_front" title="Экстерьер 3/4 спереди">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6L9 12L15 18"/></svg>
                        3/4 Спереди
                    </button>
                    <button class="angle-btn" data-angle="exterior_side" title="Профиль автомобиля">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/></svg>
                        Профиль
                    </button>
                    <button class="angle-btn" data-angle="exterior_34_rear" title="Экстерьер 3/4 сзади">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18L15 12L9 6"/></svg>
                        3/4 Сзади
                    </button>
                    <button class="angle-btn" data-angle="interior_cockpit" title="Интерьер и кокпит (Фото)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></svg>
                        Салон
                    </button>
                </div>

                <!-- Environment & Utility Controls -->
                <div class="visualizer-env-bar" id="visualizer-env-bar">
                    <!-- 3D / 2D Toggle Switch -->
                    <button class="env-toggle-btn active" id="btn-toggle-3d" title="Режим отображения: 3D WebGL / 2D Студийное фото">
                        <span class="mode-text">3D Модель</span>
                    </button>

                    <!-- Day / Night Toggle -->
                    <button class="env-toggle-btn" id="btn-toggle-night" title="Включить ночной свет и фары">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        <span>Ночь (Фары)</span>
                    </button>

                    <!-- Download Snapshot -->
                    <button class="env-toggle-btn" id="btn-download-photo" title="Скачать изображение">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </button>

                    <!-- Fullscreen Toggle -->
                    <button class="env-toggle-btn" id="btn-fullscreen-toggle" title="Полноэкранный просмотр">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    </button>
                </div>
            </div>
        `;
    }

    init3DVisualizer() {
        const stage3D = this.container.querySelector('#visualizer-3d-stage');
        if (!stage3D) return;

        try {
            this.threeVisualizer = new Porsche3DVisualizer(stage3D, this.engine);
        } catch (err) {
            console.warn('[Visualizer] WebGL initialization failed, switching to 2D photo mode:', err);
            this.hasWebGLSupport = false;
            this.is3DMode = false;
            const toggleBtn = this.container.querySelector('#btn-toggle-3d');
            if (toggleBtn) toggleBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Angle navigation buttons
        this.container.querySelectorAll('.angle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const angle = e.currentTarget.dataset.angle;
                if (angle) this.engine.setViewAngle(angle);
            });
        });

        // Day / Night toggle
        const nightBtn = this.container.querySelector('#btn-toggle-night');
        if (nightBtn) {
            nightBtn.addEventListener('click', () => {
                const current = this.engine.getState().lighting;
                this.engine.setLighting(current === 'night' ? 'day' : 'night');
            });
        }

        // 3D / 2D Photo Mode toggle
        const toggle3DBtn = this.container.querySelector('#btn-toggle-3d');
        if (toggle3DBtn) {
            toggle3DBtn.addEventListener('click', () => {
                if (!this.hasWebGLSupport) return;
                this.is3DMode = !this.is3DMode;
                toggle3DBtn.classList.toggle('active', this.is3DMode);
                toggle3DBtn.querySelector('.mode-text').textContent = this.is3DMode ? '3D Модель' : '2D Фото';
                this.syncWithState(this.engine.getState(), 'modeToggle');
            });
        }

        // Snapshot download
        const downloadBtn = this.container.querySelector('#btn-download-photo');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const state = this.engine.getState();
                const trim = this.engine.getCurrentTrim();
                const trimName = trim ? trim.name.toLowerCase().replace(/\s+/g, '-') : 'porsche';

                // If in 3D exterior mode, capture WebGL canvas
                if (this.is3DMode && state.viewAngle !== 'interior_cockpit' && this.threeVisualizer?.renderer) {
                    const canvas = this.threeVisualizer.renderer.domElement;
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = `porsche-${trimName}-3d.jpg`;
                    a.click();
                } else {
                    // Download current 2D photo
                    const img = this.container.querySelector('#visualizer-hero-img');
                    if (img && img.src) {
                        const a = document.createElement('a');
                        a.href = img.src;
                        a.download = `porsche-${trimName}.jpg`;
                        a.click();
                    }
                }
            });
        }

        // Fullscreen toggle
        const fsBtn = this.container.querySelector('#btn-fullscreen-toggle');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => {
                this.container.classList.toggle('visualizer-fullscreen');
            });
        }
    }

    /**
     * Resolves the appropriate realistic image based on active state (model, color, angle, lighting)
     */
    resolveCurrentImage(state, model, color) {
        const isNight = state.lighting === 'night';

        // Night mode for 911 front angle
        if (isNight && state.viewAngle === 'exterior_34_front' && state.modelId === '911') {
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

        // Exterior side profile - model-specific studio photos
        if (state.viewAngle === 'exterior_side') {
            if (state.modelId === 'macan') return 'assets/images/porsche_macan_side.jpg';
            if (state.modelId === 'cayenne') return 'assets/images/porsche_cayenne_side.jpg';
            if (state.modelId === 'taycan') return 'assets/images/porsche_taycan_side.jpg';
            if (state.modelId === 'panamera') return 'assets/images/porsche_panamera_side.jpg';
            return 'assets/images/porsche_side_profile.jpg';
        }

        // Exterior rear 3/4 view - model-specific studio photos
        if (state.viewAngle === 'exterior_34_rear') {
            if (state.modelId === 'macan') return 'assets/images/porsche_macan_rear.jpg';
            if (state.modelId === 'cayenne') return 'assets/images/porsche_cayenne_rear.jpg';
            if (state.modelId === 'taycan') return 'assets/images/porsche_taycan_rear.jpg';
            if (state.modelId === 'panamera') return 'assets/images/porsche_panamera_rear.jpg';
            return 'assets/images/porsche_rear_view.jpg';
        }

        // Exterior 3/4 Front - depends on selected Model and Color
        if (state.modelId === 'macan') return 'assets/images/porsche_macan_front.jpg';
        if (state.modelId === 'cayenne') return 'assets/images/porsche_cayenne_front.jpg';
        if (state.modelId === 'taycan') return 'assets/images/porsche_taycan_front.jpg';
        if (state.modelId === 'panamera') return 'assets/images/porsche_panamera_front.jpg';
        if (state.modelId === 'cayman') return 'assets/images/porsche_cayman_front.jpg';

        // Porsche 911 color variants
        switch (color ? color.id : '') {
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

    /**
     * Synchronizes visualizer UI with active Engine state
     */
    async syncWithState(state, eventType) {
        const model = this.engine.getCurrentModel();
        const trim = this.engine.getCurrentTrim();
        const color = this.engine.getCurrentColor();
        const caliper = this.engine.getCurrentCaliper();
        const wheelFinish = this.engine.getCurrentWheelFinish();
        const isNight = state.lighting === 'night';
        const isCockpit = state.viewAngle === 'interior_cockpit';

        // 1. Update vehicle badge
        const badgeSeries = this.container.querySelector('#badge-series');
        const badgeTitle = this.container.querySelector('#badge-title');
        const specPower = this.container.querySelector('#spec-power');
        const specAccel = this.container.querySelector('#spec-accel');
        const specSpeed = this.container.querySelector('#spec-speed');

        if (badgeSeries && model) badgeSeries.textContent = model.series;
        if (badgeTitle && trim) badgeTitle.textContent = trim.name;
        if (specPower && trim) specPower.textContent = trim.power.split(' ')[0];
        if (specAccel && trim) specAccel.textContent = trim.acceleration;
        if (specSpeed && trim) specSpeed.textContent = trim.topSpeed;

        // 2. Update angle buttons active state
        this.container.querySelectorAll('.angle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.angle === state.viewAngle);
        });

        // 3. Update day/night button and visualizer wrapper scene
        const wrapper = this.container.querySelector('#visualizer-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('scene-night', isNight);
            wrapper.classList.toggle('scene-day', !isNight);
        }

        const nightBtn = this.container.querySelector('#btn-toggle-night');
        if (nightBtn) {
            nightBtn.classList.toggle('active', isNight);
            nightBtn.innerHTML = isNight
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> <span>День</span>`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> <span>Ночь (Фары)</span>`;
        }

        const stage3D = this.container.querySelector('#visualizer-3d-stage');
        const stagePhoto = this.container.querySelector('#visualizer-photo-stage');
        const hint3D = this.container.querySelector('#visualizer-3d-hint');
        const heroImg = this.container.querySelector('#visualizer-hero-img');

        // Case A: Interior Cockpit -> Always Photorealistic 2D View
        if (isCockpit) {
            if (stage3D) stage3D.style.display = 'none';
            if (hint3D) hint3D.style.display = 'none';
            if (stagePhoto) stagePhoto.style.display = 'flex';

            const photoSrc = this.resolveCurrentImage(state, model, color);
            if (heroImg && heroImg.src !== photoSrc) {
                heroImg.src = photoSrc;
            }
            return;
        }

        // Case B: Exterior in 3D Mode
        if (this.is3DMode && this.threeVisualizer && this.hasWebGLSupport) {
            // Update 2D photo in background as instant fallback
            const photoSrc = this.resolveCurrentImage(state, model, color);
            if (heroImg && heroImg.src !== photoSrc) {
                heroImg.src = photoSrc;
            }

            try {
                // Ensure correct model is loaded in 3D
                if (this.currentLoadedModelId !== state.modelId) {
                    await this.threeVisualizer.loadModel(state.modelId);
                    this.currentLoadedModelId = state.modelId;
                }

                // 3D model is ready! Smoothly show 3D and hide 2D photo
                if (stage3D) {
                    stage3D.style.display = 'block';
                    stage3D.style.opacity = '1';
                }
                if (stagePhoto) stagePhoto.style.display = 'none';
                if (hint3D) hint3D.style.display = 'flex';

                // Smoothly update camera angle if angle changed
                this.threeVisualizer.setCameraAngle(state.viewAngle, true);

                // Live-update materials
                if (color) this.threeVisualizer.setPaint(color.hex, color.metallic);
                if (wheelFinish) this.threeVisualizer.setWheelFinish(wheelFinish.hex);
                if (caliper) this.threeVisualizer.setCaliperColor(caliper.hex);
                this.threeVisualizer.setLighting(state.lighting);
            } catch (err) {
                console.warn('[Visualizer] 3D render issue, falling back to 2D photo:', err);
                this.is3DMode = false;
                if (stage3D) {
                    stage3D.style.display = 'none';
                    stage3D.style.opacity = '0';
                }
                if (stagePhoto) stagePhoto.style.display = 'flex';
                if (hint3D) hint3D.style.display = 'none';

                const toggleBtn = this.container.querySelector('#btn-toggle-3d');
                if (toggleBtn) {
                    toggleBtn.classList.remove('active');
                    toggleBtn.querySelector('.mode-text').textContent = '2D Фото';
                }
            }
            return;
        }

        // Case C: Exterior in 2D Photo Mode
        if (stage3D) stage3D.style.display = 'none';
        if (hint3D) hint3D.style.display = 'none';
        if (stagePhoto) stagePhoto.style.display = 'flex';

        const photoSrc = this.resolveCurrentImage(state, model, color);
        if (heroImg && heroImg.src !== photoSrc) {
            heroImg.src = photoSrc;
        }
    }
}

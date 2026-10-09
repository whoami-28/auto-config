/**
 * Porsche 3D WebGL Vehicle Visualizer (Three.js Engine)
 * High-fidelity real-time 3D automotive studio supporting all 6 Porsche models,
 * OrbitControls 360° rotation, automotive clearcoat paint shaders, wheel finishes,
 * brake caliper customization, and dynamic day/night showroom lighting.
 */

import * as THREE from './vendor/three/three.module.js';
import { OrbitControls } from './vendor/three/controls/OrbitControls.js';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

// Configuration map for all 6 Porsche models in the catalog
export const MODEL_SPECS = {
    '911': {
        name: 'Porsche 911 Carrera 4S',
        path: 'assets/models/2021_porsche_911_carrera_4s/scene.gltf',
        paintMats: ['paint', 'coat'],
        wheelMats: ['silver'],
        caliperMats: ['Material.001'],
        lightMats: ['lights'],
        glassMats: ['window', 'glass'],
        baseScale: 1.0,
        rotationY: 0
    },
    '718': {
        name: 'Porsche 718 Cayman GTS',
        path: 'assets/models/2018_porsche_718_cayman_gts/scene.gltf',
        paintMats: ['pM_CarPaint_Max1'],
        wheelMats: ['pM_Rim_Main_Max1', 'Porsche_718CaymanGT4_2020_Wheel1A_3D_3DWheel1A_Material'],
        caliperMats: ['CALIP_1', 'CALIP_2'],
        lightMats: ['pM_LightGlassNormal_Clear_Low_004', 'pM_LightBucket_Max1', 'pM_LightGlassNormal_OuterRed_Low1'],
        glassMats: ['pM_Glass_WindowFront_Low1'],
        baseScale: 1.0,
        rotationY: 0
    },
    'cayman': { // alias for 718
        name: 'Porsche 718 Cayman GTS',
        path: 'assets/models/2018_porsche_718_cayman_gts/scene.gltf',
        paintMats: ['pM_CarPaint_Max1'],
        wheelMats: ['pM_Rim_Main_Max1', 'Porsche_718CaymanGT4_2020_Wheel1A_3D_3DWheel1A_Material'],
        caliperMats: ['CALIP_1', 'CALIP_2'],
        lightMats: ['pM_LightGlassNormal_Clear_Low_004', 'pM_LightBucket_Max1', 'pM_LightGlassNormal_OuterRed_Low1'],
        glassMats: ['pM_Glass_WindowFront_Low1'],
        baseScale: 1.0,
        rotationY: 0
    },
    'taycan': {
        name: 'Porsche Taycan Turbo GT',
        path: 'assets/models/2025_porsche_taycan_turbo_gt/scene.gltf',
        paintMats: ['porschePorsche_TaycanTurboGTReward_2025Paint_Material1'],
        wheelMats: ['porschePorsche_TaycanTurboGTReward_2025_Wheel1A_3D_3DWheel1A_Material1'],
        caliperMats: ['porschePorsche_TaycanTurboGTReward_2025_CallipersCalliperA_Zon_f59837d1'],
        lightMats: ['porschePorsche_TaycanTurboGTReward_2025LightA_Material1', 'emiss'],
        glassMats: ['porschePorsche_TaycanTurboGTReward_2025Window_Material1'],
        baseScale: 1.0,
        rotationY: 0
    },
    'panamera': {
        name: 'Porsche Panamera Turbo',
        path: 'assets/models/2017_porsche_panamera_turbo/scene.gltf',
        paintMats: ['FINAL_MODEL_17phong2SG1'],
        wheelMats: ['wPorsche_PanameraSportTurismoRewardRecycled_2021_Wheel1A_8732324'],
        caliperMats: ['Caliper_Color', 'wPorsche_PanameraSportTurismoRewardRecycled_2021_Callipe_ba4ee58'],
        lightMats: ['FINAL_MODEL_17phong14SG1', 'FINAL_MODEL_17phong15SG1'],
        glassMats: ['FINAL_MODEL_17phong19SG1', 'FINAL_MODEL_17phong20SG1'],
        baseScale: 1.0,
        rotationY: 0
    },
    'macan': {
        name: 'Porsche Macan GTS',
        path: 'assets/models/2017_porsche_macan_gts/scene.gltf',
        paintMats: ['carpaint'],
        wheelMats: ['disk'],
        caliperMats: ['calipers'],
        lightMats: ['Light_R', 'lights'],
        glassMats: ['glass', 'red_glass'],
        baseScale: 1.0,
        rotationY: 0
    },
    'cayenne': {
        name: 'Porsche Cayenne Turbo GT',
        path: 'assets/models/2022_porsche_cayenne_turbo_gt/scene.gltf',
        paintMats: ['Porsche_CayenneTurboGTRewardRecycled_2022Paint_Material', 'Paint_2'],
        wheelMats: ['Porsche_CayenneTurboGTRewardRecycled_2022_Wheel1A_3D_3DWheel1A_Material'],
        caliperMats: ['Porsche_CayenneTurboGTRewardRecycled_2022_CallipersCalliperA_Zone_Material'],
        lightMats: ['Porsche_CayenneTurboGTRewardRecycled_2022LightA_Material'],
        glassMats: ['Porsche_CayenneTurboGTRewardRecycled_2022Window_Material'],
        baseScale: 1.0,
        rotationY: 0
    }
};

// Preset camera positions for smooth angle navigation
export const CAMERA_ANGLES = {
    exterior_34_front: {
        pos: new THREE.Vector3(-3.4, 1.3, 3.8),
        target: new THREE.Vector3(0, 0.45, 0)
    },
    exterior_side: {
        pos: new THREE.Vector3(-5.2, 1.1, 0.0),
        target: new THREE.Vector3(0, 0.45, 0)
    },
    exterior_34_rear: {
        pos: new THREE.Vector3(-3.4, 1.3, -3.8),
        target: new THREE.Vector3(0, 0.45, 0)
    }
};

export class Porsche3DVisualizer {
    constructor(containerElement, engine) {
        this.container = containerElement;
        this.engine = engine;

        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loader = new GLTFLoader();

        // 3D Objects
        this.carGroup = null;
        this.currentModelObject = null;
        this.currentModelId = null;
        this.cachedModels = new Map(); // modelId -> cloned THREE.Group

        // Categorized material arrays for real-time live customization
        this.activePaintMaterials = [];
        this.activeWheelMaterials = [];
        this.activeCaliperMaterials = [];
        this.activeLightMaterials = [];

        // Lighting components
        this.hemiLight = null;
        this.keyLight = null;
        this.fillLight = null;
        this.rimLight = null;
        this.bottomLight = null;
        this.nightSpotLight = null;
        this.headlightSpotL = null;
        this.headlightSpotR = null;

        // Animation and camera transition
        this.animFrameId = null;
        this.cameraTransition = null;
        this.targetAngleKey = 'exterior_34_front';

        // State tracking
        this.currentLighting = 'day';
        this.isLoading = false;
        this.isDisposed = false;

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupControls();
        this.setupStudioEnvironment();
        this.setupLighting();
        this.setupResizeObserver();
        this.startRenderLoop();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        // Apply Porsche styling
        this.renderer.domElement.id = 'porsche-3d-canvas';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.outline = 'none';

        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0e1014); // Sleek Porsche studio dark backdrop
        this.scene.fog = new THREE.FogExp2(0x0e1014, 0.035);

        this.carGroup = new THREE.Group();
        this.scene.add(this.carGroup);
    }

    setupCamera() {
        const aspect = this.container.clientWidth / (this.container.clientHeight || 1);
        this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 50);

        const initialAngle = CAMERA_ANGLES.exterior_34_front;
        this.camera.position.copy(initialAngle.pos);
        this.camera.lookAt(initialAngle.target);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3.2;
        this.controls.maxDistance = 8.5;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going underneath the stage
        this.controls.minPolarAngle = 0.25;
        this.controls.target.set(0, 0.45, 0);
        this.controls.enablePan = false; // Keep car nicely centered
    }

    setupStudioEnvironment() {
        // 1. High-end circular showroom turntable
        const stageRadius = 5.2;
        const stageGeo = new THREE.CylinderGeometry(stageRadius, stageRadius + 0.1, 0.08, 64);
        const stageMat = new THREE.MeshStandardMaterial({
            color: 0x16181d,
            roughness: 0.35,
            metalness: 0.2
        });
        const stage = new THREE.Mesh(stageGeo, stageMat);
        stage.position.y = -0.04;
        stage.receiveShadow = true;
        this.scene.add(stage);

        // 2. Outer studio accent ring
        const ringGeo = new THREE.RingGeometry(stageRadius - 0.05, stageRadius + 0.02, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x333842,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.002;
        this.scene.add(ring);

        // 3. Ground contact shadow plane (soft ambient occlusion under vehicle)
        const shadowPlaneGeo = new THREE.PlaneGeometry(5.4, 3.2);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        const shadowTexture = new THREE.CanvasTexture(canvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            opacity: 0.75,
            depthWrite: false
        });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = 0.004;
        this.scene.add(shadowPlane);
    }

    setupLighting() {
        // Hemisphere ambient: Soft warm sky, cool ground reflection
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x22262e, 1.2);
        this.scene.add(this.hemiLight);

        // Key light: Front-top-left directional
        this.keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
        this.keyLight.position.set(-4, 5, 4);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.width = 2048;
        this.keyLight.shadow.mapSize.height = 2048;
        this.keyLight.shadow.camera.near = 1;
        this.keyLight.shadow.camera.far = 15;
        this.keyLight.shadow.camera.left = -3.5;
        this.keyLight.shadow.camera.right = 3.5;
        this.keyLight.shadow.camera.top = 3.5;
        this.keyLight.shadow.camera.bottom = -3.5;
        this.keyLight.shadow.bias = -0.0005;
        this.scene.add(this.keyLight);

        // Fill light: Soft blue-tinted studio fill from right
        this.fillLight = new THREE.DirectionalLight(0xdce8ff, 1.4);
        this.fillLight.position.set(4, 3.5, 3);
        this.scene.add(this.fillLight);

        // Rim light: Crisp contour reflection along roofline and rear fenders
        this.rimLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.rimLight.position.set(0, 4.5, -5);
        this.scene.add(this.rimLight);

        // Underbody bounce light
        this.bottomLight = new THREE.DirectionalLight(0x404550, 0.4);
        this.bottomLight.position.set(0, -2, 0);
        this.scene.add(this.bottomLight);

        // Night Mode Spotlights
        this.nightSpotLight = new THREE.SpotLight(0xffffff, 0);
        this.nightSpotLight.position.set(0, 6, 0);
        this.nightSpotLight.angle = 0.65;
        this.nightSpotLight.penumbra = 0.8;
        this.nightSpotLight.target = this.carGroup;
        this.scene.add(this.nightSpotLight);

        // Headlight projector beams
        this.headlightSpotL = new THREE.SpotLight(0xddeeff, 0, 10, Math.PI / 6, 0.7);
        this.headlightSpotL.position.set(-0.6, 0.6, 2.2);
        this.headlightSpotL.target.position.set(-0.7, 0.2, 7.0);
        this.scene.add(this.headlightSpotL);
        this.scene.add(this.headlightSpotL.target);

        this.headlightSpotR = new THREE.SpotLight(0xddeeff, 0, 10, Math.PI / 6, 0.7);
        this.headlightSpotR.position.set(0.6, 0.6, 2.2);
        this.headlightSpotR.target.position.set(0.7, 0.2, 7.0);
        this.scene.add(this.headlightSpotR);
        this.scene.add(this.headlightSpotR.target);
    }

    setupResizeObserver() {
        const resize = () => {
            if (!this.container || !this.renderer || !this.camera) return;
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            if (width === 0 || height === 0) return;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        };

        window.addEventListener('resize', resize);
        if (window.ResizeObserver) {
            new ResizeObserver(resize).observe(this.container);
        }
    }

    /**
     * Loads or switches to a vehicle 3D model
     */
    async loadModel(modelId) {
        const targetId = MODEL_SPECS[modelId] ? modelId : '911';
        if (this.currentModelId === targetId && this.currentModelObject) {
            return;
        }

        const spec = MODEL_SPECS[targetId];
        this.showLoadingIndicator(true, spec.name);
        this.isLoading = true;

        try {
            let modelObj;
            if (this.cachedModels.has(targetId)) {
                modelObj = this.cachedModels.get(targetId);
            } else {
                const gltf = await this.loader.loadAsync(spec.path);
                modelObj = gltf.scene;
                this.normalizeModel(modelObj, spec);
                this.cachedModels.set(targetId, modelObj);
            }

            // Remove previous model from scene
            if (this.currentModelObject) {
                this.carGroup.remove(this.currentModelObject);
            }

            // Add new model
            this.currentModelObject = modelObj;
            this.currentModelId = targetId;
            this.carGroup.add(modelObj);

            // Extract categorized materials for dynamic styling
            this.categorizeMaterials(modelObj, spec);

            // Re-apply active customizations from state
            this.applyCurrentCustomizations();

            this.showLoadingIndicator(false);
            this.isLoading = false;
        } catch (err) {
            console.error(`[Porsche 3D] Failed to load model ${targetId}:`, err);
            this.showLoadingIndicator(false);
            this.isLoading = false;
            // Throw so parent visualizer can gracefully fallback to 2D photo
            throw err;
        }
    }

    /**
     * Normalizes scale, centers bounding box at origin, and places tires flush with the floor
     */
    normalizeModel(modelObj, spec) {
        // Enable shadows and optimize materials on all child meshes
        modelObj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Ensure material has envMap intensity and proper roughness
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => this.enhanceMaterial(m));
                    } else {
                        this.enhanceMaterial(child.material);
                    }
                }
            }
        });

        // Compute original bounding box
        const box = new THREE.Box3().setFromObject(modelObj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center horizontally
        modelObj.position.x = -center.x;
        modelObj.position.z = -center.z;

        // Auto-scale to standard realistic vehicle length (~4.6 meters)
        const currentLength = Math.max(size.x, size.z);
        if (currentLength > 0) {
            const targetLength = 4.65;
            const scale = targetLength / currentLength;
            modelObj.scale.setScalar(scale * spec.baseScale);
        }

        // Recompute vertical position so lowest point (tires) rests exactly on the turntable (y = 0)
        const scaledBox = new THREE.Box3().setFromObject(modelObj);
        modelObj.position.y = -scaledBox.min.y;

        if (spec.rotationY) {
            modelObj.rotation.y = spec.rotationY;
        }
    }

    enhanceMaterial(mat) {
        if (!mat) return;
        mat.envMapIntensity = 1.2;
        if (mat.roughness !== undefined && mat.roughness < 0.1) {
            mat.roughness = 0.15;
        }
    }

    /**
     * Scans meshes and isolates paint, wheels, calipers, and lights for runtime customization
     */
    categorizeMaterials(modelObj, spec) {
        this.activePaintMaterials = [];
        this.activeWheelMaterials = [];
        this.activeCaliperMaterials = [];
        this.activeLightMaterials = [];

        const isMatch = (name, list) => {
            if (!name) return false;
            const low = name.toLowerCase();
            return list.some(target => low === target.toLowerCase() || low.includes(target.toLowerCase()));
        };

        modelObj.traverse((child) => {
            if (!child.isMesh || !child.material) return;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            const meshName = child.name || '';

            materials.forEach((mat) => {
                const matName = mat.name || '';

                // 1. Car Paint
                if (isMatch(matName, spec.paintMats) || /paint|carpaint/i.test(matName) || /carpaint/i.test(meshName)) {
                    if (!this.activePaintMaterials.includes(mat)) {
                        // Upgrade to MeshPhysicalMaterial for clearcoat reflections
                        this.activePaintMaterials.push(mat);
                    }
                }
                // 2. Wheels / Rims
                else if (isMatch(matName, spec.wheelMats) || /wheel|rim|disk/i.test(matName) || /wheel|rim/i.test(meshName)) {
                    if (!this.activeWheelMaterials.includes(mat)) {
                        this.activeWheelMaterials.push(mat);
                    }
                }
                // 3. Brake Calipers
                else if (isMatch(matName, spec.caliperMats) || /cal+ip/i.test(matName) || /cal+ip/i.test(meshName)) {
                    if (!this.activeCaliperMaterials.includes(mat)) {
                        this.activeCaliperMaterials.push(mat);
                    }
                }
                // 4. Lights / Optics
                else if (isMatch(matName, spec.lightMats) || /light|emiss/i.test(matName) || /light/i.test(meshName)) {
                    if (!this.activeLightMaterials.includes(mat)) {
                        this.activeLightMaterials.push(mat);
                    }
                }
            });
        });
    }

    applyCurrentCustomizations() {
        const state = this.engine.getState();
        const color = this.engine.getCurrentColor();
        const caliper = this.engine.getCurrentCaliper();
        const wheelFinish = this.engine.getCurrentWheelFinish();

        if (color) this.setPaint(color.hex, color.metallic);
        if (caliper) this.setCaliperColor(caliper.hex);
        if (wheelFinish) this.setWheelFinish(wheelFinish.hex);
        if (state.lighting) this.setLighting(state.lighting);
    }

    /**
     * Dynamically updates the automotive paint color with multi-layer lacquer reflections
     */
    setPaint(colorHex, isMetallic = true) {
        if (!colorHex) return;
        const targetColor = new THREE.Color(colorHex);

        this.activePaintMaterials.forEach((mat) => {
            mat.color.copy(targetColor);
            mat.metalness = isMetallic ? 0.8 : 0.15;
            mat.roughness = isMetallic ? 0.32 : 0.22;

            if (mat.isMeshPhysicalMaterial) {
                mat.clearcoat = 1.0;
                mat.clearcoatRoughness = 0.04;
                mat.reflectivity = 1.0;
            } else if (mat.isMeshStandardMaterial) {
                // If standard, convert or approximate clearcoat luster
                mat.roughness = 0.24;
            }
            mat.needsUpdate = true;
        });
    }

    /**
     * Dynamically updates the wheel rim finish
     */
    setWheelFinish(colorHex, metalness = 0.9, roughness = 0.25) {
        if (!colorHex) return;
        const targetColor = new THREE.Color(colorHex);

        this.activeWheelMaterials.forEach((mat) => {
            mat.color.copy(targetColor);
            mat.metalness = metalness;
            mat.roughness = roughness;
            mat.needsUpdate = true;
        });
    }

    /**
     * Dynamically updates brake caliper color (Red, Ceramic PCCB Yellow, Black)
     */
    setCaliperColor(colorHex) {
        if (!colorHex) return;
        const targetColor = new THREE.Color(colorHex);

        this.activeCaliperMaterials.forEach((mat) => {
            mat.color.copy(targetColor);
            mat.metalness = 0.25;
            mat.roughness = 0.25;
            mat.needsUpdate = true;
        });
    }

    /**
     * Controls Day / Night Showroom Lighting & Headlights
     */
    setLighting(mode) {
        this.currentLighting = mode;
        const isNight = mode === 'night';

        if (isNight) {
            // Night mood: Dim showroom, activate spotlights
            this.scene.background.setHex(0x050608);
            this.scene.fog.color.setHex(0x050608);

            this.hemiLight.intensity = 0.25;
            this.keyLight.intensity = 0.5;
            this.fillLight.intensity = 0.3;
            this.rimLight.intensity = 1.2;

            this.nightSpotLight.intensity = 3.2;
            this.headlightSpotL.intensity = 4.5;
            this.headlightSpotR.intensity = 4.5;

            // Turn on glowing headlight materials
            this.activeLightMaterials.forEach((mat) => {
                if (mat.emissive) {
                    mat.emissive.setHex(0xffffff);
                    mat.emissiveIntensity = 3.5;
                    mat.needsUpdate = true;
                }
            });
        } else {
            // Day mood: Crisp studio showroom
            this.scene.background.setHex(0x0e1014);
            this.scene.fog.color.setHex(0x0e1014);

            this.hemiLight.intensity = 1.2;
            this.keyLight.intensity = 2.4;
            this.fillLight.intensity = 1.4;
            this.rimLight.intensity = 2.0;

            this.nightSpotLight.intensity = 0;
            this.headlightSpotL.intensity = 0;
            this.headlightSpotR.intensity = 0;

            // Turn off glowing lights
            this.activeLightMaterials.forEach((mat) => {
                if (mat.emissive) {
                    mat.emissive.setHex(0x000000);
                    mat.emissiveIntensity = 0;
                    mat.needsUpdate = true;
                }
            });
        }
    }

    /**
     * Smoothly animates camera to a preset angle (3/4 front, side, 3/4 rear)
     */
    setCameraAngle(angleKey, animated = true) {
        const preset = CAMERA_ANGLES[angleKey];
        if (!preset) return;
        this.targetAngleKey = angleKey;

        if (!animated) {
            this.camera.position.copy(preset.pos);
            this.controls.target.copy(preset.target);
            this.controls.update();
            return;
        }

        this.cameraTransition = {
            startPos: this.camera.position.clone(),
            endPos: preset.pos.clone(),
            startTarget: this.controls.target.clone(),
            endTarget: preset.target.clone(),
            progress: 0,
            duration: 0.8 // seconds
        };
    }

    show() {
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.opacity = '1';
        }
    }

    hide() {
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.display = 'none';
        }
    }

    showLoadingIndicator(show, modelName = '') {
        let loaderEl = this.container.querySelector('#porsche-3d-loader');
        if (!loaderEl) {
            loaderEl = document.createElement('div');
            loaderEl.id = 'porsche-3d-loader';
            loaderEl.className = 'porsche-3d-loader';
            this.container.appendChild(loaderEl);
        }

        if (show) {
            loaderEl.innerHTML = `
                <div class="loader-spinner"></div>
                <div class="loader-text">Загрузка 3D-модели ${modelName}...</div>
                <div class="loader-sub">PORSCHE WEBGL STUDIO</div>
            `;
            loaderEl.classList.add('visible');
        } else {
            loaderEl.classList.remove('visible');
        }
    }

    startRenderLoop() {
        const clock = new THREE.Clock();

        const animate = () => {
            if (this.isDisposed) return;
            this.animFrameId = requestAnimationFrame(animate);

            const delta = clock.getDelta();

            // Camera transition interpolation
            if (this.cameraTransition) {
                this.cameraTransition.progress += delta / this.cameraTransition.duration;
                const t = Math.min(this.cameraTransition.progress, 1);
                // Ease out cubic
                const ease = 1 - Math.pow(1 - t, 3);

                this.camera.position.lerpVectors(this.cameraTransition.startPos, this.cameraTransition.endPos, ease);
                this.controls.target.lerpVectors(this.cameraTransition.startTarget, this.cameraTransition.endTarget, ease);

                if (t >= 1) {
                    this.cameraTransition = null;
                }
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    dispose() {
        this.isDisposed = true;
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        if (this.controls) this.controls.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

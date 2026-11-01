// ==========================================================================
// LED Ёлка — Профессиональная 3D Интерактивная Визуализация и Конструктив
// P4-N Гибкий 320×160 мм  •  Уличный IP65  •  Глубина конструктива 130 мм
// ==========================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================================================
// 1. КОНФИГУРАЦИЯ И ПАРАМЕТРЫ ПО УМОЛЧАНИЮ
// ==========================================================================
const cfg = {
    // Геометрия ёлки
    height:        4.0,     // м — высота центрального столба
    baseDiameter:  2.4,     // м — диаметр нижнего витка
    topDiameter:   0.52,    // м — диаметр верхнего витка (≥ 0.45м для R ≥ 200мм)
    turns:         5.2,     // кол-во витков (5.2 витка для гармоничной доводки верха)
    ribbonWidth:   0.32,    // м — ширина ленты (320 мм = 2 ряда модулей по 160)
    ribbonDepth:   0.13,    // м — толщина ленты в сборе с каркасом (13 см)
    poleRadius:    0.08,    // м — радиус столба (стальная труба ⌀160 мм)
    podiumHeight:  0.12,    // м — высота деревянного подиума
    baseClearance: 0.16,    // м — зазор между подиумом и нижним краем ленты
    topClearance:  0.14,    // м — выступ столба над верхним краем ленты
    minSafeBend:   0.20,    // м — минимальный допустимый радиус изгиба P4 (200 мм)
    moduleW:       0.32,    // м — длина модуля вдоль ленты (гибкая ось)
    moduleH:       0.16,    // м — высота модуля (160 мм)
    segsPerTurn:   90,      // сегментов на 1 виток (высокая плавность кривой)

    // Текст и экраны
    customText:    "★ С НАСТУПАЮЩИМ 2027 ГОДОМ! ★ ЭКРАН СВ. ВЛАДИМИРА ★ ВСЕМ ЗДОРОВЬЯ И СЧАСТЬЯ! ★ СПАСИБО ДОКТОРАМ! ★ МИШАНЯ, ПОПРАВЛЯЙСЯ! ",
    scrollSpeed:   1.0,     // множитель скорости бегущей строки
    renderMode:    'render',// 'render' (праздничный текст) | 'grid' (инженерная сетка)
    displayMode:   'assembled', // 'assembled' (в сборе) | 'bareFrame' (чистый каркас)
    showBareFrame: false,   // флаг снятия модулей
    magnetsPerMod: 4,       // 4 | 8 магнитов на модуль 320x160

    // Окружение и стили
    envPreset:     'day',   // 'day' | 'dusk' | 'cad' | 'night'
    pipeColor:     'silver',// 'silver' | 'graphite' | 'gold'

    // Параметры фасадной волновой ленты (Металлокаркас под модули P4-N 320×160: Трасса-Подъём-Вершина-Спуск)
    waveRibbon: {
        preset:       'spatial',// 'spatial' (3D пространственная волна) | 'loop' (скульптурная петля)
        viewMode:     'render', // 'render' (3D рендер) | 'modules' (раскладка P4-N) | 'subframe' (металлокаркас)
        crestHeight:  3.55,     // м — высота вершины купола («2027»)
        cradleHeight: 1.82,     // м — глубина нижней колыбели у окна (чаша)
        depthWave:    0.55,     // м — пространственный 3D вынос от стены (35-75 см)
        twist:        1.0,      // множитель 3D крена / твиста ленты (чаша -42° / навес +20°)
        height:       0.48,     // м — высота ленты (480 мм = 3 ряда модулей по 160 мм)
        depth:        0.14,     // м — толщина пространственного короба (140 мм)
        elevationY:   0.00,     // смещение Y
        offsetX:      0.00,     // смещение X
        text:         "С Новым 2027 годом!",
        showPillars:  true,     // опорные архитектурные стойки-пилоны
        showWallDims: false,    // чертёжные линии DWG
        showGrid:     false,    // сетка фасада
    },

    // Конструктивные тумблеры
    showCallouts:  false,    // 3D выноски с пояснениями на узлах
    showStruts:    true,    // силовые кронштейны-распорки
    showCaps:      true,    // герметичные заглушки и гофра кабель-ввода
    showMagnets:   true,    // магнитные стойки 9 мм и продольные стальные полосы каркаса
    showStar:      true,    // светящаяся верхушка
    showDims:      false,   // 3D размерные линии и выноски
    showSnow:      true,    // частицы снегопада
};

// ==========================================================================
// 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==========================================================================
let scene, camera, renderer, controls;
let treeGroup = null;
let dimsGroup = null;
let snowParticles = null;
let snowGeo = null;

let textTexture = null;
let gridTexture = null;
let woodTexture = null;
let snowTexture = null;

let defaultGroundMaterial = null;
let shadowGroundMaterial = null;
let squarePhotoTexture = null;
let customPhotoTexture = null;

let modulesMesh = null;
let frameMesh = null;
let modulesGeo = null;
let frameGeo = null;
let modulesBasePos = null;
let frameBasePos = null;
let samplesRef = [];

let ballastGroup = null;
let cablesGroup = null;
let magnetsGroup = null;
let magneticStripsGroup = null;
let magneticStripsBasePos = null;
let psuGroup = null;
let receivingCardsGroup = null;
let moduleInspectorActive = false;
let modScene = null, modCamera = null, modRenderer = null, modControls = null;
let singleModuleGroup = null, singleModMagnets = [], singleModStrips = null;
let strutsGroup = null;
let podiumDeckGroup = null;
let topAssemblyGroup = null;
let poleMesh = null;

let currentExplosion = 0.0;
let targetExplosion = 0.0;

let tourActive = false;
let tourStartTime = 0;
let tourShotIndex = -1;
let tourSavedEnv = null;
let tourSavedPos = new THREE.Vector3();
let tourSavedLook = new THREE.Vector3();

// Архитектурный ансамбль: Фасадный волновой экран и мозаичный павильон
let facadeGroup = null;
let wallDimsGroup = null;
let waveGridGroup = null;
let waveBracketsGroup = null;
let waveSubframeGroup = null;
let wavePillarsGroup = null;

let waveScreenMesh = null;
let waveTextTexture = null;
let showFacade = false;
let ensembleMode = 'tree'; // 'all' | 'tree' | 'facade'

let ledMaterial = null;
let casingMaterial = null;
let pipeMaterial = null;

let dirLight, ambientLight, fillLight, rimLight;
let groundMesh, gridHelper;

// Точки для 3D выносок
let calloutNodes = [];

// ==========================================================================
// 3. ИНИЦИАЛИЗАЦИЯ СЦЕНЫ
// ==========================================================================
function init() {
    try {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 120);
        camera.position.set(4.2, 2.5, 6.2);

        renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas3d'),
            antialias: true,
            preserveDrawingBuffer: true,
        });
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.20;

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.target.set(0, 2.0, 0);
        controls.minDistance = 1.0;
        controls.maxDistance = 28;
        controls.update();

        setupLighting();
        setupGround();

        textTexture = generateTextTexture(cfg.customText);
        gridTexture = generateGridTexture();
        woodTexture = generateWoodTexture();
        snowTexture = generateSnowflakeTexture();

        // Материалы основания и фотомонтажа
        defaultGroundMaterial = new THREE.MeshStandardMaterial({
            color: 0xedf2f8,
            roughness: 0.82,
            metalness: 0.05,
        });
        shadowGroundMaterial = new THREE.ShadowMaterial({
            opacity: 0.55,
        });

        // Фоновая текстура реальной площади св. Владимира
        const texLoader = new THREE.TextureLoader();
        texLoader.load(
            'square_photo.jpg',
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                squarePhotoTexture = tex;
                if (cfg.envPreset === 'photo') {
                    scene.background = squarePhotoTexture;
                }
            },
            undefined,
            (err) => console.warn('square_photo.jpg load warning:', err)
        );

        updatePipeMaterial();
        rebuildTree();
        setupSnowParticles();

        // Построение архитектурного ансамбля св. Владимира (мозаичный фасад и волновой экран)
        buildFacadeGroup();

        applyEnvironment(cfg.envPreset);

        try { setupUI(); } catch (uiErr) { console.warn('setupUI non-critical warning:', uiErr); }

        // Чтение параметров URL для быстрого тестирования и прямых ссылок (?mode=bareFrame&cam=rear)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('modal') === 'module') {
                openModuleInspector();
                if (urlParams.get('modview') === 'back') {
                    setTimeout(() => {
                        if (modCamera && modControls) {
                            modCamera.position.set(0.10, 0.06, -0.38);
                            modControls.target.set(0, 0, 0);
                            modControls.update();
                            modRenderer.render(modScene, modCamera);
                        }
                    }, 50);
                }
            }
            if (urlParams.get('mag')) {
                setMagnetsPerMod(+urlParams.get('mag'), false);
            }
            if (urlParams.get('modal') === 'passport' || urlParams.get('modal') === 'kmd') {
                const modal = document.getElementById('modal-passport');
                if (modal) modal.classList.add('open');
                if (urlParams.get('modal') === 'kmd') {
                    document.querySelectorAll('.tab-btn').forEach(b => {
                        b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-kmd');
                    });
                    document.querySelectorAll('.tab-pane').forEach(p => {
                        p.classList.toggle('active', p.id === 'tab-kmd');
                    });
                }
            }
            if (urlParams.get('mode') === 'bareFrame') {
                setDisplayMode('bareFrame', false);
            }
            if (urlParams.get('env')) {
                applyEnvironment(urlParams.get('env'));
            }
            if (urlParams.get('cam')) {
                const cam = urlParams.get('cam');
                setCameraPreset(cam, true);
                ['btn-front', 'btn-side', 'btn-rear', 'btn-top', 'btn-free'].forEach(b => {
                    const el = document.getElementById(b);
                    if (el) el.classList.remove('active');
                });
                const camBtn = document.getElementById(`btn-${cam}`);
                if (camBtn) camBtn.classList.add('active');
            }
        } catch (paramErr) {
            console.warn('URL params check warning:', paramErr);
        }
        try { setupCalloutsDOM(); } catch (calErr) { console.warn('setupCalloutsDOM warning:', calErr); }

        addEventListener('resize', onResize);
    } catch (criticalErr) {
        console.error('CRITICAL INIT ERROR:', criticalErr);
    } finally {
        requestAnimationFrame(() => {
            const loader = document.getElementById('loading');
            if (loader) loader.classList.add('hidden');
        });
    }

    animate();
}

// ==========================================================================
// 4. ОСВЕЩЕНИЕ И ОКРУЖАЮЩАЯ СРЕДА
// ==========================================================================
function setupLighting() {
    ambientLight = new THREE.AmbientLight(0xdde8f5, 0.85);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(7, 11, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    const sc = dirLight.shadow.camera;
    sc.near = 0.1; sc.far = 35;
    sc.left = -7; sc.right = 7; sc.top = 8; sc.bottom = -1;
    sc.bias = -0.0005;
    scene.add(dirLight);

    fillLight = new THREE.DirectionalLight(0x88a8d0, 0.5);
    fillLight.position.set(-7, 5, -5);
    scene.add(fillLight);

    rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(-2, 7, -6);
    scene.add(rimLight);
}

function setupGround() {
    groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(48, 48),
        defaultGroundMaterial
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    gridHelper = new THREE.GridHelper(20, 40, 0x94a3b8, 0xcfd8e3);
    gridHelper.position.y = 0.002;
    scene.add(gridHelper);
}

function applyEnvironment(preset) {
    cfg.envPreset = preset;

    ['btn-env-day', 'btn-env-dusk', 'btn-env-night'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-env-${preset}`);
    if (activeBtn) activeBtn.classList.add('active');

    const badge = document.getElementById('env-badge');
    if (badge) {
        if (preset === 'day') {
            badge.textContent = 'ДЕНЬ';
            badge.style.color = '#38bdf8';
            badge.style.background = 'rgba(56, 189, 248, 0.15)';
        } else if (preset === 'dusk') {
            badge.textContent = 'СУМЕРКИ';
            badge.style.color = '#f59e0b';
            badge.style.background = 'rgba(245, 158, 11, 0.15)';
        } else if (preset === 'night') {
            badge.textContent = 'НОЧЬ';
            badge.style.color = '#a855f7';
            badge.style.background = 'rgba(168, 85, 247, 0.15)';
        }
    }

    if (groundMesh) groundMesh.material = defaultGroundMaterial;
    if (gridHelper) gridHelper.visible = true;

    if (preset === 'day') {
        scene.background = new THREE.Color(0xdce7f2);
        scene.fog = new THREE.FogExp2(0xdce7f2, 0.022);
        ambientLight.color.setHex(0xdce7f2);
        ambientLight.intensity = 0.95;
        dirLight.color.setHex(0xffffff);
        dirLight.intensity = 1.35;
        fillLight.color.setHex(0x9cb8d6);
        rimLight.intensity = 0.65;
        groundMesh.material.color.setHex(0xedf3f8);
        gridHelper.material.opacity = 0.25;
        gridHelper.material.transparent = true;
    } else if (preset === 'dusk') {
        scene.background = new THREE.Color(0x131a30);
        scene.fog = new THREE.FogExp2(0x131a30, 0.030);
        ambientLight.color.setHex(0x283858);
        ambientLight.intensity = 0.65;
        dirLight.color.setHex(0xffdfb8);
        dirLight.intensity = 1.10;
        fillLight.color.setHex(0x3860aa);
        rimLight.intensity = 0.90;
        groundMesh.material.color.setHex(0x1c2438);
        gridHelper.material.opacity = 0.15;
    } else if (preset === 'night') {
        scene.background = new THREE.Color(0x070810);
        scene.fog = new THREE.FogExp2(0x070810, 0.035);
        ambientLight.color.setHex(0x1c2034);
        ambientLight.intensity = 0.45;
        dirLight.color.setHex(0xccd8ff);
        dirLight.intensity = 0.60;
        fillLight.color.setHex(0x182855);
        rimLight.intensity = 1.10;
        groundMesh.material.color.setHex(0x0e111a);
        gridHelper.material.opacity = 0.12;
    }

    if (ledMaterial && cfg.renderMode === 'render') {
        ledMaterial.emissiveIntensity = preset === 'day' ? 0.70 : (preset === 'night' ? 1.05 : 0.85);
    }
}

function updatePipeMaterial() {
    let col = 0xb4c0d0;
    let met = 0.88;
    let rou = 0.28;

    if (cfg.pipeColor === 'graphite') {
        col = 0x363a45;
        met = 0.75;
        rou = 0.45;
    } else if (cfg.pipeColor === 'gold') {
        col = 0xd4af37;
        met = 0.85;
        rou = 0.25;
    }

    if (!pipeMaterial) {
        pipeMaterial = new THREE.MeshStandardMaterial({
            color: col,
            metalness: met,
            roughness: rou,
        });
    } else {
        pipeMaterial.color.setHex(col);
        pipeMaterial.metalness = met;
        pipeMaterial.roughness = rou;
    }
}

// ==========================================================================
// 5. ГЕНЕРАТОРЫ ТЕКСТУР
// ==========================================================================
function generateTextTexture(customStr) {
    const W = 4096, H = 256;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0.0, '#7a060d');
    grad.addColorStop(0.08, '#be1019');
    grad.addColorStop(0.5, '#d91621');
    grad.addColorStop(0.92, '#be1019');
    grad.addColorStop(1.0, '#660409');
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    g.fillStyle = 'rgba(0, 0, 0, 0.40)';
    g.fillRect(0, 0, W, 8);
    g.fillRect(0, H - 8, W, 8);

    const numCols = 16;
    const colW = W / numCols;
    g.strokeStyle = 'rgba(0, 0, 0, 0.30)';
    g.lineWidth = 2.5;
    for (let x = 0; x <= W; x += colW) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();

    g.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let y = 10; y < H - 10; y += 8) {
        for (let x = 4; x < W; x += 8) {
            g.fillRect(x, y, 2.2, 2.2);
        }
    }

    const textToDraw = (customStr || cfg.customText).trim() + "   ";
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.font = '900 84px "Inter", "Arial Black", sans-serif';

    const metrics = g.measureText(textToDraw);
    const blockW = Math.max(metrics.width, 200);
    const repeats = Math.ceil(W / blockW) + 2;

    g.shadowColor = 'rgba(255, 240, 210, 0.95)';
    g.shadowBlur = 20;
    g.fillStyle = '#ffffff';

    for (let r = 0; r < repeats; r++) {
        g.fillText(textToDraw, r * blockW, H / 2);
    }

    g.shadowBlur = 6;
    for (let r = 0; r < repeats; r++) {
        g.fillText(textToDraw, r * blockW, H / 2);
    }
    g.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

function generateGridTexture() {
    const W = 256, H = 128;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, W, H);

    g.strokeStyle = 'rgba(0, 0, 0, 0.50)';
    g.lineWidth = 5;
    g.strokeRect(2.5, 2.5, W - 5, H - 5);

    g.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    g.lineWidth = 1;
    for (let x = 16; x < W; x += 16) {
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }
    for (let y = 16; y < H; y += 16) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }

    g.fillStyle = 'rgba(0, 0, 0, 0.40)';
    g.font = '700 20px "Inter", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('P4-N 320×160', W / 2, H / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

function generateWoodTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');

    g.fillStyle = '#d4b790';
    g.fillRect(0, 0, S, S);

    g.strokeStyle = 'rgba(100, 65, 30, 0.08)';
    g.lineWidth = 2;
    for (let r = 10; r < S * 0.8; r += 7) {
        g.beginPath();
        g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
        g.stroke();
    }

    g.strokeStyle = 'rgba(80, 50, 20, 0.05)';
    for (let i = 0; i < 500; i++) {
        const a = Math.random() * Math.PI * 2;
        const r1 = Math.random() * (S * 0.45);
        const r2 = r1 + Math.random() * 40 + 10;
        g.beginPath();
        g.moveTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1);
        g.lineTo(S / 2 + Math.cos(a) * r2, S / 2 + Math.sin(a) * r2);
        g.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function generateSnowflakeTexture() {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');

    const grad = g.createRadialGradient(S/2, S/2, 0, S/2, S/2, S/2);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.3, 'rgba(230, 245, 255, 0.8)');
    grad.addColorStop(0.7, 'rgba(200, 230, 255, 0.2)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    g.fillStyle = grad;
    g.beginPath();
    g.arc(S/2, S/2, S/2, 0, Math.PI * 2);
    g.fill();

    return new THREE.CanvasTexture(c);
}

// ==========================================================================
// 6. ПОСТРОЕНИЕ 3D ГЕОМЕТРИИ ЛЕНТЫ
// ==========================================================================
function buildRibbonGeometry() {
    const baseR = cfg.baseDiameter / 2;
    const topR  = cfg.topDiameter / 2;
    const H     = cfg.height;
    const N     = cfg.turns;
    const rw    = cfg.ribbonWidth;
    const rd    = cfg.ribbonDepth;
    const hw    = rw / 2;
    const hd    = rd / 2;
    const segs  = Math.round(N * cfg.segsPerTurn);

    const yStart = cfg.podiumHeight + cfg.baseClearance + hw;
    const yEnd   = H - cfg.topClearance - hw;
    const ySpan  = yEnd - yStart;

    const pitch  = ySpan / N;
    const pParam = pitch / (2 * Math.PI);

    const samples = [];
    let arcLen = 0;

    for (let i = 0; i <= segs; i++) {
        const t     = i / segs;
        const angle = 2 * Math.PI * N * t;
        const r     = baseR + (topR - baseR) * t;
        const y     = yStart + ySpan * t;
        const pos   = new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle));

        const dt = 1e-4;
        const t2 = Math.min(t + dt, 1.0);
        const a2 = 2 * Math.PI * N * t2;
        const r2 = baseR + (topR - baseR) * t2;
        const p2 = new THREE.Vector3(r2 * Math.cos(a2), yStart + ySpan * t2, r2 * Math.sin(a2));
        const tangent = p2.clone().sub(pos).normalize();

        let radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const widthDir = new THREE.Vector3().crossVectors(tangent, radial).normalize();
        const normal   = new THREE.Vector3().crossVectors(widthDir, tangent).normalize();

        if (i > 0) arcLen += pos.distanceTo(samples[i - 1].pos);

        const bendRadius = (r * r + pParam * pParam) / r;

        samples.push({ pos, tangent, normal, widthDir, arcLen, bendRadius, r, y, t });
    }

    const textRepeats = Math.max(2, Math.round(arcLen / 7.5));
    const dc = 0.18;

    // 1. Геометрия лицевой поверхности LED модулей P4-N
    const modPosArr = new Float32Array((segs + 1) * 2 * 3);
    const modUvArr  = new Float32Array((segs + 1) * 2 * 2);
    const modColArr = new Float32Array((segs + 1) * 2 * 3);
    const modIdx    = [];

    // 2. Геометрия алюминиевого несущего короба 130 мм (тыл, борта, заглушки)
    const framePosArr = new Float32Array((segs + 1) * 8 * 3 + 8 * 3);
    const frameUvArr  = new Float32Array((segs + 1) * 8 * 2 + 8 * 2);
    const frameColArr = new Float32Array((segs + 1) * 8 * 3 + 8 * 3);
    const frameIdx    = [];

    for (let i = 0; i <= segs; i++) {
        const { pos, normal, widthDir, arcLen: al, bendRadius: br } = samples[i];

        const ft = _corner(pos, normal, hd, widthDir, hw);
        const fb = _corner(pos, normal, hd, widthDir, -hw);
        const bt = _corner(pos, normal, -hd, widthDir, hw);
        const bb = _corner(pos, normal, -hd, widthDir, -hw);

        // Заполнение модулей P4-N
        const mBase = i * 2;
        _setV3(modPosArr, mBase + 0, ft);
        _setV3(modPosArr, mBase + 1, fb);

        if (cfg.renderMode === 'render') {
            const u = (1.0 - (al / arcLen)) * textRepeats;
            _setV2(modUvArr, mBase + 0, u, 1);
            _setV2(modUvArr, mBase + 1, u, 0);
        } else {
            const u = al / cfg.moduleW;
            const vMax = rw / cfg.moduleH;
            _setV2(modUvArr, mBase + 0, u, vMax);
            _setV2(modUvArr, mBase + 1, u, 0);
        }

        let cr = 1.0, cg = 1.0, cb = 1.0;
        if (cfg.renderMode !== 'render') {
            if (br >= 0.25) {
                cr = 0.20; cg = 0.85; cb = 0.35;
            } else if (br >= 0.18) {
                cr = 1.00; cg = 0.70; cb = 0.05;
            } else {
                cr = 1.00; cg = 0.15; cb = 0.15;
            }
        }
        _setV3Col(modColArr, mBase + 0, cr, cg, cb);
        _setV3Col(modColArr, mBase + 1, cr, cg, cb);

        if (i < segs) {
            const b = mBase, n = (i + 1) * 2;
            modIdx.push(b, n, n + 1, b, n + 1, b + 1);
        }

        // Заполнение алюминиевого каркаса 130 мм
        const fBase = i * 8;
        _setV3(framePosArr, fBase + 0, ft);
        _setV3(framePosArr, fBase + 1, fb);
        _setV3(framePosArr, fBase + 2, bb);
        _setV3(framePosArr, fBase + 3, bt);
        _setV3(framePosArr, fBase + 4, ft);
        _setV3(framePosArr, fBase + 5, bt);
        _setV3(framePosArr, fBase + 6, bb);
        _setV3(framePosArr, fBase + 7, fb);

        for (let j = 0; j < 8; j++) {
            _setV2(frameUvArr, fBase + j, 0, 0);
            _setV3Col(frameColArr, fBase + j, dc, dc, dc);
        }

        if (i < segs) {
            const b = fBase, n = (i + 1) * 8;
            frameIdx.push(b + 3, n + 3, n + 2, b + 3, n + 2, b + 2);
            frameIdx.push(b + 4, n + 4, n + 5, b + 4, n + 5, b + 5);
            frameIdx.push(b + 7, n + 7, n + 6, b + 7, n + 6, b + 6);
        }
    }

    // Торцевые герметичные крышки 130 мм
    const startCapBase = (segs + 1) * 8;
    const endCapBase   = startCapBase + 4;

    const s0 = samples[0];
    const s0_ft = _corner(s0.pos, s0.normal, hd, s0.widthDir, hw);
    const s0_fb = _corner(s0.pos, s0.normal, hd, s0.widthDir, -hw);
    const s0_bt = _corner(s0.pos, s0.normal, -hd, s0.widthDir, hw);
    const s0_bb = _corner(s0.pos, s0.normal, -hd, s0.widthDir, -hw);

    _setV3(framePosArr, startCapBase + 0, s0_fb);
    _setV3(framePosArr, startCapBase + 1, s0_ft);
    _setV3(framePosArr, startCapBase + 2, s0_bt);
    _setV3(framePosArr, startCapBase + 3, s0_bb);
    for (let k = 0; k < 4; k++) {
        _setV2(frameUvArr, startCapBase + k, 0, 0);
        _setV3Col(frameColArr, startCapBase + k, dc * 1.5, dc * 1.5, dc * 1.5);
    }
    frameIdx.push(startCapBase + 0, startCapBase + 1, startCapBase + 2,
                  startCapBase + 0, startCapBase + 2, startCapBase + 3);

    const s1 = samples[segs];
    const s1_ft = _corner(s1.pos, s1.normal, hd, s1.widthDir, hw);
    const s1_fb = _corner(s1.pos, s1.normal, hd, s1.widthDir, -hw);
    const s1_bt = _corner(s1.pos, s1.normal, -hd, s1.widthDir, hw);
    const s1_bb = _corner(s1.pos, s1.normal, -hd, s1.widthDir, -hw);

    _setV3(framePosArr, endCapBase + 0, s1_ft);
    _setV3(framePosArr, endCapBase + 1, s1_fb);
    _setV3(framePosArr, endCapBase + 2, s1_bb);
    _setV3(framePosArr, endCapBase + 3, s1_bt);
    for (let k = 0; k < 4; k++) {
        _setV2(frameUvArr, endCapBase + k, 0, 0);
        _setV3Col(frameColArr, endCapBase + k, dc * 1.5, dc * 1.5, dc * 1.5);
    }
    frameIdx.push(endCapBase + 0, endCapBase + 1, endCapBase + 2,
                  endCapBase + 0, endCapBase + 2, endCapBase + 3);

    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute('position', new THREE.BufferAttribute(modPosArr, 3));
    mGeo.setAttribute('uv',       new THREE.BufferAttribute(modUvArr, 2));
    mGeo.setAttribute('color',    new THREE.BufferAttribute(modColArr, 3));
    mGeo.setIndex(modIdx);
    mGeo.computeVertexNormals();

    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.BufferAttribute(framePosArr, 3));
    fGeo.setAttribute('uv',       new THREE.BufferAttribute(frameUvArr, 2));
    fGeo.setAttribute('color',    new THREE.BufferAttribute(frameColArr, 3));
    fGeo.setIndex(frameIdx);
    fGeo.computeVertexNormals();

    const totalArc   = samples[segs].arcLen;
    const minBend    = Math.min(...samples.map(s => s.bendRadius));
    const modsAlong  = Math.ceil(totalArc / cfg.moduleW);
    const modsAcross = Math.round(rw / cfg.moduleH);

    return {
        modulesGeo: mGeo,
        frameGeo: fGeo,
        modulesBasePos: new Float32Array(modPosArr),
        frameBasePos:   new Float32Array(framePosArr),
        samples,
        stats: {
            arcLength:     totalArc,
            minBendRadius: minBend,
            totalModules:  modsAlong * modsAcross,
            modsAlong,
            modsAcross,
            ledArea:       totalArc * rw,
        },
    };
}

function _corner(pos, d1, s1, d2, s2) {
    return new THREE.Vector3(
        pos.x + d1.x * s1 + d2.x * s2,
        pos.y + d1.y * s1 + d2.y * s2,
        pos.z + d1.z * s1 + d2.z * s2,
    );
}
function _setV3(arr, idx, v) { const o = idx * 3; arr[o] = v.x; arr[o+1] = v.y; arr[o+2] = v.z; }
function _setV2(arr, idx, u, v) { const o = idx * 2; arr[o] = u; arr[o+1] = v; }
function _setV3Col(arr, idx, r, g, b) { const o = idx * 3; arr[o] = r; arr[o+1] = g; arr[o+2] = b; }

// ==========================================================================
// 7. СБОРКА ВСЕХ 3D УЗЛОВ ЁЛКИ
// ==========================================================================
function rebuildTree() {
    if (treeGroup) {
        treeGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
        scene.remove(treeGroup);
    }

    treeGroup = new THREE.Group();

    // 1. Построение геометрии модулей и каркаса
    const {
        modulesGeo: mGeo,
        frameGeo: fGeo,
        modulesBasePos: mBasePos,
        frameBasePos: fBasePos,
        samples,
        stats
    } = buildRibbonGeometry();

    modulesGeo = mGeo;
    frameGeo = fGeo;
    modulesBasePos = mBasePos;
    frameBasePos = fBasePos;
    samplesRef = samples;

    const activeTex = cfg.renderMode === 'render' ? textTexture : gridTexture;

    ledMaterial = new THREE.MeshStandardMaterial({
        map: activeTex,
        vertexColors: cfg.renderMode !== 'render',
        color: 0xffffff,
        emissive: cfg.renderMode === 'render' ? 0x881018 : 0x220000,
        emissiveIntensity: cfg.renderMode === 'render' ? 0.85 : 0.40,
        emissiveMap: cfg.renderMode === 'render' ? textTexture : null,
        roughness: 0.28,
        metalness: 0.12,
        side: THREE.DoubleSide,
    });

    casingMaterial = new THREE.MeshStandardMaterial({
        color: 0x222630, // конструкционный анодированный алюминиевый короб 130 мм
        roughness: 0.48,
        metalness: 0.62,
        side: THREE.DoubleSide,
    });

    modulesMesh = new THREE.Mesh(modulesGeo, ledMaterial);
    modulesMesh.castShadow = true;
    modulesMesh.receiveShadow = true;
    treeGroup.add(modulesMesh);

    frameMesh = new THREE.Mesh(frameGeo, casingMaterial);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    treeGroup.add(frameMesh);

    // 2. ПРОДОЛЬНЫЕ СТАЛЬНЫЕ НАПРАВЛЯЮЩИЕ ПОЛОСЫ КАРКАСА (По чертежу P4-N)
    magneticStripsGroup = new THREE.Group();
    magneticStripsGroup.name = 'magneticLongitudinalStrips';

    const segsCount = samples.length - 1;
    const hd = cfg.ribbonDepth / 2;
    const hw = cfg.ribbonWidth / 2;
    const stripDepth = hd - 0.020; // 20 мм от лица (11 мм модуль + 9 мм вылет магнита)

    // Геометрия 3 сплошных стальных полос (верхняя, средняя двойная, нижняя)
    // Каждая полоса имеет 2 вершины на каждый сэмпл (segsCount + 1)*2
    const totalStripVerts = (segsCount + 1) * 2 * 3;
    const stripsPosArr = new Float32Array(totalStripVerts * 3);
    const stripsIdx = [];

    const steelStripMat = new THREE.MeshStandardMaterial({
        color: 0xdbe2ec, // ярко-серебристые вальцованные полосы Ст3 под магниты
        metalness: 0.95,
        roughness: 0.18,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i <= segsCount; i++) {
        const s = samples[i];

        // 1. Верхняя полоса (ширина 28 мм, под верхние магниты)
        const p1_top = _corner(s.pos, s.normal, stripDepth, s.widthDir, hw - 0.004);
        const p1_bot = _corner(s.pos, s.normal, stripDepth, s.widthDir, hw - 0.032);
        _setV3(stripsPosArr, (0 * (segsCount + 1) + i) * 2 + 0, p1_top);
        _setV3(stripsPosArr, (0 * (segsCount + 1) + i) * 2 + 1, p1_bot);

        // 2. Средняя широкая полоса (ширина 50 мм, по центру стыка двух рядов)
        const p2_top = _corner(s.pos, s.normal, stripDepth, s.widthDir, 0.025);
        const p2_bot = _corner(s.pos, s.normal, stripDepth, s.widthDir, -0.025);
        _setV3(stripsPosArr, (1 * (segsCount + 1) + i) * 2 + 0, p2_top);
        _setV3(stripsPosArr, (1 * (segsCount + 1) + i) * 2 + 1, p2_bot);

        // 3. Нижняя полоса (ширина 28 мм, под нижние магниты)
        const p3_top = _corner(s.pos, s.normal, stripDepth, s.widthDir, -hw + 0.032);
        const p3_bot = _corner(s.pos, s.normal, stripDepth, s.widthDir, -hw + 0.004);
        _setV3(stripsPosArr, (2 * (segsCount + 1) + i) * 2 + 0, p3_top);
        _setV3(stripsPosArr, (2 * (segsCount + 1) + i) * 2 + 1, p3_bot);

        if (i < segsCount) {
            for (let strip = 0; strip < 3; strip++) {
                const base = strip * (segsCount + 1) * 2 + i * 2;
                stripsIdx.push(base + 0, base + 1, base + 2);
                stripsIdx.push(base + 1, base + 3, base + 2);
            }
        }
    }

    const stripsGeo = new THREE.BufferGeometry();
    stripsGeo.setAttribute('position', new THREE.BufferAttribute(stripsPosArr, 3));
    stripsGeo.setIndex(stripsIdx);
    stripsGeo.computeVertexNormals();

    const stripsMesh = new THREE.Mesh(stripsGeo, steelStripMat);
    stripsMesh.castShadow = true;
    stripsMesh.receiveShadow = true;
    magneticStripsGroup.add(stripsMesh);
    magneticStripsGroup.visible = Boolean(cfg.showMagnets);
    magneticStripsBasePos = new Float32Array(stripsPosArr);
    treeGroup.add(magneticStripsGroup);

    // 2b. МАГНИТНЫЕ СТОЙКИ 9 ММ (М4 × 4 мм заход в модуль + 9 мм тело магнита)
    magnetsGroup = new THREE.Group();
    magnetsGroup.name = 'neodymiumMagneticStuds';

    // Цилиндрическое никелированное тело магнита ⌀12 мм × 9 мм вылет
    const magnetBodyGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.009, 14);
    magnetBodyGeo.rotateX(Math.PI / 2);
    const magnetBodyMat = new THREE.MeshStandardMaterial({
        color: 0xedf2f7,
        metalness: 0.98,
        roughness: 0.12,
    });

    // Резьбовой хвостовик М4 (4 мм захода в латунную втулку модуля)
    const m4ThreadGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.005, 10);
    m4ThreadGeo.rotateX(Math.PI / 2);
    const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // латунь
        metalness: 0.88,
        roughness: 0.25,
    });

    // Шаг модулей вдоль спирали (поддержка 4 шт. или 8 шт. магнитов на модуль)
    const samplesPerMod = Math.max(4, Math.round(samples.length / Math.max(1, stats.modsAlong)));
    const magnetPitchSub = samplesPerMod / 4;
    // При 4 магнитах: берутся крайние отверстия sub = 0 и sub = 3; при 8 магнитах: все 4 отверстия
    const subCols = (cfg.magnetsPerMod === 4) ? [0, 3] : [0, 1, 2, 3];

    for (let m = 0; m < stats.modsAlong; m++) {
        for (let sCol = 0; sCol < subCols.length; sCol++) {
            const sub = subCols[sCol];
            const idx = Math.min(Math.round(m * samplesPerMod + (sub + 0.5) * magnetPitchSub), samples.length - 1);
            const s = samples[idx];

            // 4 линии магнитов по чертежу P4-N (Y = +145, +18, -18, -145 мм)
            const yOffsets = [hw - 0.018, 0.018, -0.018, -hw + 0.018];
            yOffsets.forEach(yOff => {
                const stud = new THREE.Group();
                const mMesh = new THREE.Mesh(magnetBodyGeo, magnetBodyMat);
                mMesh.position.z = -0.0045; // тело магнита 9 мм назад
                mMesh.castShadow = true;

                const tMesh = new THREE.Mesh(m4ThreadGeo, brassMat);
                tMesh.position.z = 0.002; // резьба М4 вперед в модуль
                stud.add(mMesh);
                stud.add(tMesh);

                const pStud = _corner(s.pos, s.normal, hd - 0.011, s.widthDir, yOff);
                stud.position.copy(pStud);
                stud.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), s.normal);
                stud.userData = { basePos: pStud.clone(), normal: s.normal.clone() };
                magnetsGroup.add(stud);
            });
        }
    }
    magnetsGroup.visible = Boolean(cfg.showMagnets);
    treeGroup.add(magnetsGroup);

    // 2c. БЛОКИ ПИТАНИЯ 5V 40A (P10 / G-ENERGY / CZCL) ВНУТРИ КАРКАСА (Адаптивный авторасчёт)
    // Выровнены строго вертикально вдоль образующей стенки короба (высота 165 мм, ширина 60 мм, глубина 28 мм)
    // 100% утоплены в короб, прижаты к задней стенке, оставляя спереди свободный воздушный коридор охлаждения
    psuGroup = new THREE.Group();
    psuGroup.name = 'p10PowerSuppliesAdaptive';

    {
        const psuCount = Math.max(4, Math.ceil(stats.totalModules / 6));
        const psuBoxGeo = new THREE.BoxGeometry(0.060, 0.165, 0.026);
        const psuBoxMat = new THREE.MeshStandardMaterial({
            color: 0xd4dce6, // штампованный никелированный алюминий
            metalness: 0.88,
            roughness: 0.28,
        });

        const psuPlateGeo = new THREE.BoxGeometry(0.054, 0.115, 0.002);
        const psuPlateMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.92,
            roughness: 0.22,
        });

        const psuLabelGeo = new THREE.BoxGeometry(0.048, 0.038, 0.001);
        const psuLabelMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.40,
            metalness: 0.15,
        });

        const psuTermGeo = new THREE.BoxGeometry(0.054, 0.028, 0.020);
        const psuTermMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.20,
            roughness: 0.80,
        });

        const psuScrewGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 0.004, 8);
        const psuScrewMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.88,
            roughness: 0.25,
        });

        const psuLedGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 0.003, 10);
        const psuLedMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x22c55e,
            emissiveIntensity: 2.2,
            roughness: 0.2,
        });

        const psuWireRedGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.060, 8);
        psuWireRedGeo.rotateX(Math.PI / 2);
        const psuWireRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });

        const psuWireBlackGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.060, 8);
        psuWireBlackGeo.rotateX(Math.PI / 2);
        const psuWireBlackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });

        const psuEarGeo = new THREE.BoxGeometry(0.040, 0.012, 0.003);
        const psuEarMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c4, metalness: 0.85, roughness: 0.3 });
        const psuBoltGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8);

        for (let pIdx = 0; pIdx < psuCount; pIdx++) {
            const sampleIdx = Math.min(
                Math.round(((pIdx + 0.5) / psuCount) * (samples.length - 1)),
                samples.length - 1
            );
            const s = samples[sampleIdx];

            const unit = new THREE.Group();

            const body = new THREE.Mesh(psuBoxGeo, psuBoxMat);
            body.castShadow = true;
            unit.add(body);

            const plateMesh = new THREE.Mesh(psuPlateGeo, psuPlateMat);
            plateMesh.position.set(0, 0.015, 0.0135);
            unit.add(plateMesh);

            const label = new THREE.Mesh(psuLabelGeo, psuLabelMat);
            label.position.set(0, 0.015, 0.0145);
            unit.add(label);

            const term = new THREE.Mesh(psuTermGeo, psuTermMat);
            term.position.set(0, -0.065, 0.002);
            unit.add(term);

            for (let sc = -2; sc <= 2; sc++) {
                const scr = new THREE.Mesh(psuScrewGeo, psuScrewMat);
                scr.position.set(sc * 0.011, -0.065, 0.012);
                unit.add(scr);
            }

            const led = new THREE.Mesh(psuLedGeo, psuLedMat);
            led.position.set(0.018, -0.042, 0.0135);
            unit.add(led);

            const topEar = new THREE.Mesh(psuEarGeo, psuEarMat);
            topEar.position.set(0, 0.088, -0.011);
            unit.add(topEar);
            const topBolt = new THREE.Mesh(psuBoltGeo, psuEarMat);
            topBolt.position.set(0, 0.088, -0.008);
            unit.add(topBolt);

            const botEar = new THREE.Mesh(psuEarGeo, psuEarMat);
            botEar.position.set(0, -0.088, -0.011);
            unit.add(botEar);
            const botBolt = new THREE.Mesh(psuBoltGeo, psuEarMat);
            botBolt.position.set(0, -0.088, -0.008);
            unit.add(botBolt);

            const wRed = new THREE.Mesh(psuWireRedGeo, psuWireRedMat);
            wRed.position.set(0.014, -0.078, 0.018);
            unit.add(wRed);

            const wBlack = new THREE.Mesh(psuWireBlackGeo, psuWireBlackMat);
            wBlack.position.set(-0.014, -0.078, 0.018);
            unit.add(wBlack);

            const psuPos = _corner(s.pos, s.normal, -hd + 0.014, s.widthDir, 0);
            unit.position.copy(psuPos);

            const rotM = new THREE.Matrix4();
            rotM.makeBasis(s.tangent, s.widthDir, s.normal);
            unit.quaternion.setFromRotationMatrix(rotM);

            unit.userData = {
                basePos: psuPos.clone(),
                normal: s.normal.clone(),
            };

            psuGroup.add(unit);
        }
    }

    psuGroup.visible = Boolean(cfg.showBareFrame) || currentExplosion > 0.02;
    treeGroup.add(psuGroup);

    // 2d. ПРИЁМНЫЕ КАРТЫ NOVASTAR MRV416-N (Адаптивный авторасчёт и каскадная сеть)
    receivingCardsGroup = new THREE.Group();
    receivingCardsGroup.name = 'novastarMRV416CardsAdaptive';

    {
        const cardCount = Math.max(2, Math.ceil(stats.totalModules / 24));
        const cardPcbGeo = new THREE.BoxGeometry(0.085, 0.140, 0.0025);
        const cardPcbMat = new THREE.MeshStandardMaterial({
            color: 0x064e3b, // изумрудно-зеленый текстолит NovaStar
            roughness: 0.42,
            metalness: 0.18,
        });

        const rj45Geo = new THREE.BoxGeometry(0.034, 0.020, 0.014);
        const rj45Mat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            metalness: 0.95,
            roughness: 0.18,
        });

        const hub75Geo = new THREE.BoxGeometry(0.014, 0.009, 0.008);
        const hub75Mat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.85,
            metalness: 0.15,
        });

        const fpgaGeo = new THREE.BoxGeometry(0.024, 0.024, 0.003);
        const fpgaMat = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            metalness: 0.80,
            roughness: 0.30,
        });
        const fpgaHeatGeo = new THREE.BoxGeometry(0.018, 0.018, 0.001);
        const fpgaHeatMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.95,
            roughness: 0.15,
        });

        const cardLedGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.003, 8);
        const ledPowerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.2 });
        const ledRunMat   = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 2.5 });

        const netCableGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 0.080, 8);
        netCableGeo.rotateX(Math.PI / 2);
        const netCableMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });

        const standoffGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.010, 8);
        standoffGeo.rotateX(Math.PI / 2);
        const standoffMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.25 });

        const cardNodes = [];

        for (let cIdx = 0; cIdx < cardCount; cIdx++) {
            const sampleIdx = Math.min(
                Math.round(((cIdx + 0.5) / cardCount) * (samples.length - 1)),
                samples.length - 1
            );
            const s = samples[sampleIdx];

            const card = new THREE.Group();

            const pcb = new THREE.Mesh(cardPcbGeo, cardPcbMat);
            pcb.castShadow = true;
            card.add(pcb);

            const rj45 = new THREE.Mesh(rj45Geo, rj45Mat);
            rj45.position.set(0, -0.052, 0.008);
            card.add(rj45);

            for (let row = 0; row < 8; row++) {
                const yH = -0.032 + row * 0.011;
                const hLeft = new THREE.Mesh(hub75Geo, hub75Mat);
                hLeft.position.set(-0.025, yH, 0.005);
                card.add(hLeft);

                const hRight = new THREE.Mesh(hub75Geo, hub75Mat);
                hRight.position.set(0.025, yH, 0.005);
                card.add(hRight);
            }

            const fpga = new THREE.Mesh(fpgaGeo, fpgaMat);
            fpga.position.set(0, 0.012, 0.0025);
            card.add(fpga);

            const fpgaHeat = new THREE.Mesh(fpgaHeatGeo, fpgaHeatMat);
            fpgaHeat.position.set(0, 0.012, 0.0042);
            card.add(fpgaHeat);

            const ledP = new THREE.Mesh(cardLedGeo, ledPowerMat);
            ledP.position.set(-0.032, 0.058, 0.0028);
            card.add(ledP);

            const ledR = new THREE.Mesh(cardLedGeo, ledRunMat);
            ledR.position.set(-0.024, 0.058, 0.0028);
            card.add(ledR);

            const nCable = new THREE.Mesh(netCableGeo, netCableMat);
            nCable.position.set(0, -0.068, 0.008);
            card.add(nCable);

            const stOffsets = [
                [-0.036,  0.060],
                [ 0.036,  0.060],
                [-0.036, -0.060],
                [ 0.036, -0.060],
            ];
            stOffsets.forEach(([sx, sy]) => {
                const st = new THREE.Mesh(standoffGeo, standoffMat);
                st.position.set(sx, sy, -0.006);
                card.add(st);
            });

            const cardPos = _corner(s.pos, s.normal, -hd + 0.014, s.widthDir, 0);
            card.position.copy(cardPos);

            const rotM = new THREE.Matrix4();
            rotM.makeBasis(s.tangent, s.widthDir, s.normal);
            card.quaternion.setFromRotationMatrix(rotM);

            card.userData = {
                basePos: cardPos.clone(),
                normal: s.normal.clone(),
            };

            receivingCardsGroup.add(card);
            cardNodes.push({ sampleIdx, pos: cardPos });
        }

        // Каскадные синие кабели CAT6 RJ45 между всеми платами NovaStar вдоль спирали
        if (cardNodes.length >= 2) {
            for (let c = 0; c < cardNodes.length - 1; c++) {
                const n1 = cardNodes[c];
                const n2 = cardNodes[c + 1];
                const pts = [];
                const step = Math.max(1, Math.round((n2.sampleIdx - n1.sampleIdx) / 8));
                for (let si = n1.sampleIdx; si <= n2.sampleIdx; si += step) {
                    const smp = samples[si];
                    pts.push(_corner(smp.pos, smp.normal, -hd + 0.018, smp.widthDir, -0.048));
                }
                if (pts.length >= 2) {
                    const curve = new THREE.CatmullRomCurve3(pts);
                    const tubeGeo = new THREE.TubeGeometry(curve, pts.length * 3, 0.0022, 6, false);
                    const tubeMesh = new THREE.Mesh(tubeGeo, netCableMat);
                    receivingCardsGroup.add(tubeMesh);
                }
            }
        }
    }

    receivingCardsGroup.visible = Boolean(cfg.showBareFrame) || currentExplosion > 0.02;
    treeGroup.add(receivingCardsGroup);

    // 3. Центральная стальная мачта ⌀160 мм и внутренние кабельные трассы
    const poleGeo = new THREE.CylinderGeometry(cfg.poleRadius, cfg.poleRadius, cfg.height, 32);
    poleMesh = new THREE.Mesh(poleGeo, pipeMaterial.clone());
    poleMesh.position.y = cfg.height / 2;
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    treeGroup.add(poleMesh);

    cablesGroup = new THREE.Group();
    cablesGroup.name = 'internalCables';
    const cableData = [
        { color: 0xff6b00, r: 0.009, x: -0.022, z: -0.014 },
        { color: 0x0088ff, r: 0.008, x:  0.022, z: -0.014 },
        { color: 0xee2222, r: 0.011, x:  0.000, z:  0.024 },
        { color: 0x22cc44, r: 0.007, x: -0.010, z:  0.010 },
    ];
    cableData.forEach(c => {
        const cGeo = new THREE.CylinderGeometry(c.r, c.r, cfg.height - 0.1, 12);
        const cMat = new THREE.MeshStandardMaterial({
            color: c.color,
            roughness: 0.45,
            metalness: 0.15,
            emissive: c.color,
            emissiveIntensity: 0.35,
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(c.x, cfg.height / 2, c.z);
        cablesGroup.add(cMesh);
    });
    cablesGroup.visible = false;
    treeGroup.add(cablesGroup);

    // 4. Палуба подиума (поднимается при взрыв-схеме)
    podiumDeckGroup = new THREE.Group();
    podiumDeckGroup.name = 'podiumDeckSystem';

    const podiumR = cfg.baseDiameter / 2 + 0.35;
    const rimGeo = new THREE.CylinderGeometry(podiumR + 0.06, podiumR + 0.08, 0.04, 48);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x161822, roughness: 0.85, metalness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.02;
    rim.receiveShadow = true;
    podiumDeckGroup.add(rim);

    const deckGeo = new THREE.CylinderGeometry(podiumR, podiumR, cfg.podiumHeight - 0.04, 48);
    const deckMat = new THREE.MeshStandardMaterial({ map: woodTexture, roughness: 0.65, metalness: 0.15 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.04 + (cfg.podiumHeight - 0.04) / 2;
    deck.receiveShadow = true;
    podiumDeckGroup.add(deck);

    const flangeGeo = new THREE.CylinderGeometry(cfg.poleRadius * 2.2, cfg.poleRadius * 2.4, 0.03, 24);
    const flange = new THREE.Mesh(flangeGeo, pipeMaterial);
    flange.position.y = cfg.podiumHeight + 0.015;
    podiumDeckGroup.add(flange);

    // Нижний узел крепления к подиуму
    const botS = samples[0];
    const botBackPos = botS.pos.clone().sub(botS.normal.clone().multiplyScalar(hd));
    if (cfg.showCaps) {
        const legH = botBackPos.y - cfg.podiumHeight;
        const legGeo = new THREE.CylinderGeometry(0.032, 0.042, legH, 16);
        const leg = new THREE.Mesh(legGeo, pipeMaterial);
        leg.position.set(botBackPos.x, cfg.podiumHeight + legH / 2, botBackPos.z);
        podiumDeckGroup.add(leg);

        const plateGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.015, 16);
        const plate = new THREE.Mesh(plateGeo, pipeMaterial);
        plate.position.set(botBackPos.x, cfg.podiumHeight + 0.008, botBackPos.z);
        podiumDeckGroup.add(plate);
    }
    treeGroup.add(podiumDeckGroup);

    // 5. Фундаментное основание и 6 блоков бетонного балласта ФБС 800 кг
    ballastGroup = new THREE.Group();
    ballastGroup.name = 'ballastSystem';

    const baseFlangeGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.025, 24);
    const baseFlangeMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.85, roughness: 0.35 });
    const basePlate = new THREE.Mesh(baseFlangeGeo, baseFlangeMat);
    basePlate.position.y = 0.012;
    basePlate.receiveShadow = true;
    ballastGroup.add(basePlate);

    const boltGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12);
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    for (let b = 0; b < 8; b++) {
        const ang = (b / 8) * Math.PI * 2;
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(Math.cos(ang) * 0.18, 0.03, Math.sin(ang) * 0.18);
        ballastGroup.add(bolt);
    }

    const ringGeo = new THREE.TorusGeometry(podiumR * 0.70, 0.022, 12, 36);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x2b303c, metalness: 0.8, roughness: 0.4 });
    const baseRing = new THREE.Mesh(ringGeo, ringMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.025;
    ballastGroup.add(baseRing);

    for (let r = 0; r < 6; r++) {
        const ang = (r / 6) * Math.PI * 2;
        const beamGeo = new THREE.BoxGeometry(0.03, 0.035, podiumR * 0.70);
        const beam = new THREE.Mesh(beamGeo, ringMat);
        beam.position.set(Math.cos(ang) * (podiumR * 0.35), 0.02, Math.sin(ang) * (podiumR * 0.35));
        beam.rotation.y = -ang + Math.PI / 2;
        ballastGroup.add(beam);
    }

    const blockGeo = new THREE.BoxGeometry(0.38, 0.09, 0.22);
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x949ba8, roughness: 0.92, metalness: 0.08 });
    const loopGeo = new THREE.TorusGeometry(0.022, 0.005, 8, 16, Math.PI);
    const loopMat = new THREE.MeshStandardMaterial({ color: 0xc8d0db, metalness: 0.85, roughness: 0.3 });

    for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const bx = Math.cos(ang) * (podiumR * 0.70);
        const bz = Math.sin(ang) * (podiumR * 0.70);

        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(bx, 0.045, bz);
        block.rotation.y = -ang;
        block.castShadow = true;
        block.receiveShadow = true;
        ballastGroup.add(block);

        const loop = new THREE.Mesh(loopGeo, loopMat);
        loop.position.set(bx, 0.09, bz);
        loop.rotation.y = -ang;
        ballastGroup.add(loop);
    }
    treeGroup.add(ballastGroup);

    // 6. Радиальные стальные кронштейны-распорки
    if (cfg.showStruts) {
        strutsGroup = new THREE.Group();
        strutsGroup.name = 'strutsSystem';
        const step = Math.max(8, Math.round(cfg.segsPerTurn * (65 / 360)));
        for (let i = Math.round(step * 0.5); i < samples.length - Math.round(step * 0.5); i += step) {
            const s = samples[i];
            const attachPoint = s.pos.clone().sub(s.normal.clone().multiplyScalar(hd));
            const polePoint   = new THREE.Vector3(0, s.y, 0);
            const strutLen    = polePoint.distanceTo(attachPoint);

            const strutGeo = new THREE.CylinderGeometry(0.020, 0.020, strutLen, 14);
            const strut = new THREE.Mesh(strutGeo, pipeMaterial);
            strut.position.copy(polePoint).lerp(attachPoint, 0.5);
            strut.quaternion.setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                attachPoint.clone().sub(polePoint).normalize()
            );
            strut.castShadow = true;
            strut.userData = {
                basePos: strut.position.clone(),
                radialDir: attachPoint.clone().sub(polePoint).normalize(),
            };
            strutsGroup.add(strut);

            const bandGeo = new THREE.CylinderGeometry(cfg.poleRadius * 1.08, cfg.poleRadius * 1.08, 0.04, 20);
            const band = new THREE.Mesh(bandGeo, pipeMaterial);
            band.position.copy(polePoint);
            strutsGroup.add(band);

            const padGeo = new THREE.BoxGeometry(0.09, 0.14, 0.02);
            const pad = new THREE.Mesh(padGeo, pipeMaterial);
            pad.position.copy(attachPoint);
            pad.quaternion.copy(strut.quaternion);
            pad.userData = {
                basePos: pad.position.clone(),
                radialDir: s.normal.clone(),
            };
            strutsGroup.add(pad);
        }
        treeGroup.add(strutsGroup);
    }

    // 7. Верхний узел крепления и звезда (topAssemblyGroup)
    topAssemblyGroup = new THREE.Group();
    topAssemblyGroup.name = 'topAssembly';

    const topS = samples[samples.length - 1];
    const topBackPos = topS.pos.clone().sub(topS.normal.clone().multiplyScalar(hd));
    const poleMountPos = new THREE.Vector3(0, topS.y, 0);

    const poleCapGeo = new THREE.CylinderGeometry(cfg.poleRadius * 1.18, cfg.poleRadius * 1.18, 0.04, 32);
    const poleCap = new THREE.Mesh(poleCapGeo, pipeMaterial);
    poleCap.position.y = cfg.height + 0.02;
    topAssemblyGroup.add(poleCap);

    if (cfg.showCaps) {
        const collarGeo = new THREE.CylinderGeometry(cfg.poleRadius * 1.14, cfg.poleRadius * 1.14, 0.12, 24);
        const collar = new THREE.Mesh(collarGeo, pipeMaterial);
        collar.position.set(0, topS.y, 0);
        topAssemblyGroup.add(collar);

        const dist = poleMountPos.distanceTo(topBackPos);
        const bracketGeo = new THREE.BoxGeometry(0.06, 0.08, dist);
        const bracket = new THREE.Mesh(bracketGeo, pipeMaterial);
        bracket.position.copy(poleMountPos).lerp(topBackPos, 0.5);
        bracket.lookAt(topBackPos);
        topAssemblyGroup.add(bracket);

        const conduitCurve = new THREE.QuadraticBezierCurve3(
            topBackPos.clone().add(new THREE.Vector3(0, -0.05, 0)),
            poleMountPos.clone().lerp(topBackPos, 0.5).add(new THREE.Vector3(0, -0.15, 0)),
            poleMountPos.clone().add(new THREE.Vector3(0, -0.08, 0))
        );
        const conduitGeo = new THREE.TubeGeometry(conduitCurve, 16, 0.018, 12, false);
        const conduitMat = new THREE.MeshStandardMaterial({ color: 0x12141c, roughness: 0.85, metalness: 0.1 });
        const conduit = new THREE.Mesh(conduitGeo, conduitMat);
        topAssemblyGroup.add(conduit);
    }

    if (cfg.showStar) {
        const starGroup = new THREE.Group();
        starGroup.name = 'treeTopStar';

        const starShape = new THREE.Shape();
        const pts = 5;
        const rOut = 0.22;
        const rIn  = 0.095;
        for (let i = 0; i < pts * 2; i++) {
            const r = i % 2 === 0 ? rOut : rIn;
            const a = (i * Math.PI) / pts - Math.PI / 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) starShape.moveTo(x, y);
            else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const extrudeSettings = {
            depth: 0.035,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.025,
        };
        const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        starGeo.center();

        const starMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            emissiveIntensity: 0.95,
            roughness: 0.16,
            metalness: 0.92,
        });

        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.y = cfg.height + 0.26;
        starMesh.castShadow = true;
        starGroup.add(starMesh);

        const gemGeo = new THREE.OctahedronGeometry(0.065, 0);
        const gemMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfff4cc,
            emissiveIntensity: 1.25,
            roughness: 0.1,
            metalness: 0.9,
        });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.copy(starMesh.position);
        starGroup.add(gem);

        const starLight = new THREE.PointLight(0xffb733, 1.8, 8);
        starLight.name = 'treeTopLight';
        starLight.position.copy(starMesh.position);
        starGroup.add(starLight);

        topAssemblyGroup.add(starGroup);
    }
    treeGroup.add(topAssemblyGroup);

    // 8. Красное LED свечение
    const glowLight = new THREE.PointLight(0xff1e0e, 1.4, 6.5);
    glowLight.position.set(0, cfg.height * 0.38, 0);
    treeGroup.add(glowLight);

    scene.add(treeGroup);

    // Применяем текущее состояние взрыв-схемы
    applyExplosion(currentExplosion);

    // Координаты для 3D выносок
    const midSample = samples[Math.round(samples.length * 0.35)];
    calloutNodes = [
        {
            pos: topBackPos.clone().add(new THREE.Vector3(0, 0.12, 0)),
            title: `Верхний узел: R = ${Math.round(stats.minBendRadius * 1000)} мм`,
            desc: "Безопасный радиус изгиба силикона P4-N. Стальной хомут + гермозаглушка 130 мм + гофра кабель-ввода.",
        },
        {
            pos: new THREE.Vector3(0, cfg.height * 0.58, cfg.poleRadius + 0.05),
            title: `Мачта ⌀${Math.round(cfg.poleRadius * 2000)} мм`,
            desc: "Несущая стальная труба с радиальными распорками каждые 65° для ветроустойчивости каркаса.",
        },
        {
            pos: botBackPos.clone().add(new THREE.Vector3(0, 0.05, 0)),
            title: `Нижний узел: зазор ${Math.round(cfg.baseClearance * 100)} см`,
            desc: "Опорный подпятник на палубе подиума. Защита от снега, наледи и влаги.",
        },
        {
            pos: midSample.pos.clone().add(midSample.normal.clone().multiplyScalar(0.1)),
            title: `LED-полотно: ${stats.totalModules} шт. P4-N`,
            desc: `Разрешение ${stats.modsAlong * 80} × ${stats.modsAcross * 40} px. Длина развёртки ${stats.arcLength.toFixed(1)} м.`,
        },
        {
            pos: topBackPos.clone().add(new THREE.Vector3(0.18, 0.08, -0.08)),
            title: "Магнитные стойки 9 мм & 3 стальные полосы",
            desc: "8 неодимовых стоек М4 на модуль (заход 4 мм, вылет 9 мм, прижим 24 кг). 3 сплошные стальные полосы Ст3 (база 152 мм по чертежу P4-N). Моментальный монтаж без сверления отверстий.",
        },
        {
            pos: new THREE.Vector3(cfg.baseDiameter * 0.38, cfg.height * 0.44, cfg.baseDiameter * 0.38),
            title: "24 Блока питания 5V внутри короба 130 мм",
            desc: "Ультратонкие БП CZCL 200W (28 мм) стоят за магнитными полосами. Запас глубины 108 мм. Замена любого БП с лица за 1 минуту вакуумной присоской.",
        },
    ];

    if (cfg.showDims) {
        rebuildDimensions();
    }

    updateInfoPanel(stats);
    setDisplayMode(cfg.displayMode || 'assembled', false);
}

// ==========================================================================
// 7.1. ИНЖЕНЕРНАЯ ВЗРЫВ-СХЕМА (EXPLODED VIEW)
// ==========================================================================
function applyExplosion(p) {
    currentExplosion = p;

    // 1. Смещение светодиодных модулей наружу вдоль нормали
    if (modulesGeo && modulesBasePos && samplesRef && samplesRef.length > 0) {
        const mPos = modulesGeo.attributes.position.array;
        const segs = samplesRef.length - 1;
        for (let i = 0; i <= segs; i++) {
            const s = samplesRef[i];
            const ox = s.normal.x * (p * 0.58);
            const oy = s.normal.y * (p * 0.58);
            const oz = s.normal.z * (p * 0.58);

            const b = i * 2 * 3;
            mPos[b + 0] = modulesBasePos[b + 0] + ox;
            mPos[b + 1] = modulesBasePos[b + 1] + oy;
            mPos[b + 2] = modulesBasePos[b + 2] + oz;
            mPos[b + 3] = modulesBasePos[b + 3] + ox;
            mPos[b + 4] = modulesBasePos[b + 4] + oy;
            mPos[b + 5] = modulesBasePos[b + 5] + oz;
        }
        modulesGeo.attributes.position.needsUpdate = true;
        modulesGeo.computeVertexNormals();
    }

    // 2. Смещение алюминиевого профиля короба 130 мм
    if (frameGeo && frameBasePos && samplesRef && samplesRef.length > 0) {
        const fPos = frameGeo.attributes.position.array;
        const segs = samplesRef.length - 1;
        for (let i = 0; i <= segs; i++) {
            const s = samplesRef[i];
            const ox = s.normal.x * (p * 0.24);
            const oy = s.normal.y * (p * 0.24);
            const oz = s.normal.z * (p * 0.24);

            for (let v = 0; v < 8; v++) {
                const b = (i * 8 + v) * 3;
                fPos[b + 0] = frameBasePos[b + 0] + ox;
                fPos[b + 1] = frameBasePos[b + 1] + oy;
                fPos[b + 2] = frameBasePos[b + 2] + oz;
            }
        }
        const capBase = (segs + 1) * 8 * 3;
        const s0 = samplesRef[0];
        const ox0 = s0.normal.x * (p * 0.24);
        const oy0 = s0.normal.y * (p * 0.24);
        const oz0 = s0.normal.z * (p * 0.24);
        for (let v = 0; v < 4; v++) {
            const b = capBase + v * 3;
            fPos[b + 0] = frameBasePos[b + 0] + ox0;
            fPos[b + 1] = frameBasePos[b + 1] + oy0;
            fPos[b + 2] = frameBasePos[b + 2] + oz0;
        }
        const s1 = samplesRef[segs];
        const ox1 = s1.normal.x * (p * 0.24);
        const oy1 = s1.normal.y * (p * 0.24);
        const oz1 = s1.normal.z * (p * 0.24);
        for (let v = 0; v < 4; v++) {
            const b = capBase + 12 + v * 3;
            fPos[b + 0] = frameBasePos[b + 0] + ox1;
            fPos[b + 1] = frameBasePos[b + 1] + oy1;
            fPos[b + 2] = frameBasePos[b + 2] + oz1;
        }
        frameGeo.attributes.position.needsUpdate = true;
        frameGeo.computeVertexNormals();
    }

    // 3. Магнитные стойки 9 мм (смещаются с модулями наружу)
    if (magnetsGroup) {
        magnetsGroup.children.forEach(m => {
            if (m.userData && m.userData.normal) {
                const ox = m.userData.normal.x * (p * 0.54);
                const oy = m.userData.normal.y * (p * 0.54);
                const oz = m.userData.normal.z * (p * 0.54);
                m.position.copy(m.userData.basePos).add(new THREE.Vector3(ox, oy, oz));
            }
        });
    }

    // 3b. Продольные стальные полосы каркаса (смещаются с несущим коробом p * 0.24)
    if (magneticStripsGroup && magneticStripsBasePos && samplesRef && samplesRef.length > 0) {
        const mesh = magneticStripsGroup.children[0];
        if (mesh && mesh.geometry) {
            const pos = mesh.geometry.attributes.position.array;
            const segs = samplesRef.length - 1;
            for (let strip = 0; strip < 3; strip++) {
                for (let i = 0; i <= segs; i++) {
                    const s = samplesRef[i];
                    const ox = s.normal.x * (p * 0.24);
                    const oy = s.normal.y * (p * 0.24);
                    const oz = s.normal.z * (p * 0.24);
                    const baseIdx = (strip * (segs + 1) + i) * 2;
                    for (let v = 0; v < 2; v++) {
                        const b = (baseIdx + v) * 3;
                        pos[b + 0] = magneticStripsBasePos[b + 0] + ox;
                        pos[b + 1] = magneticStripsBasePos[b + 1] + oy;
                        pos[b + 2] = magneticStripsBasePos[b + 2] + oz;
                    }
                }
            }
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.computeVertexNormals();
        }
        magnetsGroup.visible = !cfg.showBareFrame && (p > 0.02);
    }

    // 3c. Смещение блоков питания 5V 40A и приёмных карт NovaStar MRV416-N
    if (psuGroup) {
        psuGroup.children.forEach(psu => {
            if (psu.userData && psu.userData.normal && psu.userData.basePos) {
                const ox = psu.userData.normal.x * (p * 0.24);
                const oy = psu.userData.normal.y * (p * 0.24);
                const oz = psu.userData.normal.z * (p * 0.24);
                psu.position.copy(psu.userData.basePos).add(new THREE.Vector3(ox, oy, oz));
            }
        });
        psuGroup.visible = Boolean(cfg.showBareFrame) || (p > 0.02);
    }

    if (receivingCardsGroup) {
        receivingCardsGroup.children.forEach(card => {
            if (card.userData && card.userData.normal && card.userData.basePos) {
                const ox = card.userData.normal.x * (p * 0.24);
                const oy = card.userData.normal.y * (p * 0.24);
                const oz = card.userData.normal.z * (p * 0.24);
                card.position.copy(card.userData.basePos).add(new THREE.Vector3(ox, oy, oz));
            }
        });
        receivingCardsGroup.visible = Boolean(cfg.showBareFrame) || (p > 0.02);
    }

    // Учёт текущего режима отображения при взрыв-схеме
    if (cfg.displayMode === 'bareFrame') {
        if (modulesMesh) modulesMesh.visible = false;
        if (magnetsGroup) magnetsGroup.visible = false;
        if (frameMesh) frameMesh.visible = true;
        if (magneticStripsGroup) magneticStripsGroup.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
    } else if (cfg.displayMode === 'electronics') {
        if (modulesMesh) modulesMesh.visible = false;
        if (frameMesh) frameMesh.visible = false;
        if (magnetsGroup) magnetsGroup.visible = true;
        if (magneticStripsGroup) magneticStripsGroup.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
    } else if (cfg.displayMode === 'xray') {
        if (modulesMesh) modulesMesh.visible = true;
        if (frameMesh) frameMesh.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
    }

    // 4. Подъём палубы подиума (открытие балластной рамы)
    if (podiumDeckGroup) {
        podiumDeckGroup.position.y = p * 0.55;
    }

    // 5. Подъём верхушки и звезды
    if (topAssemblyGroup) {
        topAssemblyGroup.position.y = p * 0.45;
    }

    // 6. Смещение кронштейнов-распорок
    if (strutsGroup) {
        strutsGroup.children.forEach(c => {
            if (c.userData && c.userData.radialDir && c.userData.basePos) {
                const isPad = c.geometry && c.geometry.type === 'BoxGeometry';
                const dist = isPad ? p * 0.24 : p * 0.10;
                c.position.copy(c.userData.basePos).addScaledVector(c.userData.radialDir, dist);
            }
        });
    }

    // 7. Прозрачность мачты и видимость внутренних кабелей
    if (poleMesh && poleMesh.material) {
        poleMesh.material.transparent = p > 0.03;
        poleMesh.material.opacity = Math.max(0.32, 1.0 - p * 0.65);
    }
    if (cablesGroup) {
        cablesGroup.visible = p > 0.03;
    }

    // 8. Обновление значений в UI
    const sl = document.getElementById('sl-explode');
    if (sl && Math.abs(+sl.value - Math.round(p * 100)) > 1) {
        sl.value = Math.round(p * 100);
    }
    const valExp = document.getElementById('val-explode');
    if (valExp) {
        const pct = Math.round(p * 100);
        if (pct === 0) valExp.textContent = '0% (В сборе)';
        else if (pct === 50) valExp.textContent = '50% (Узлы)';
        else if (pct === 100) valExp.textContent = '100% (Взрыв)';
        else valExp.textContent = `${pct}% (Узлы)`;
    }

    ['btn-exp-0', 'btn-exp-50', 'btn-exp-100'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.remove('active');
    });
    if (Math.round(p * 100) === 0) {
        const b0 = document.getElementById('btn-exp-0');
        if (b0) b0.classList.add('active');
    } else if (Math.round(p * 100) === 50) {
        const b50 = document.getElementById('btn-exp-50');
        if (b50) b50.classList.add('active');
    } else if (Math.round(p * 100) === 100) {
        const b100 = document.getElementById('btn-exp-100');
        if (b100) b100.classList.add('active');
    }
}

// ==========================================================================
// 7.2. КИНЕМАТОГРАФИЧЕСКИЙ РЕЖИМ (ПРЕЗЕНТАЦИЯ ДЛЯ ЗАКАЗЧИКА)
// ==========================================================================
const tourShots = [
    {
        title: "ПЛАН 1/4: Монументальный ракурс снизу вверх",
        sub: "Высота конструкции 4.0 м · Конусная спираль св. Владимира · База ⌀2.4 м",
        startPos: new THREE.Vector3(0.5, 0.45, 4.4),
        endPos:   new THREE.Vector3(3.2, 0.95, 3.2),
        startLook: new THREE.Vector3(0, 2.1, 0),
        endLook:   new THREE.Vector3(0, 2.3, 0),
        env: 'day',
    },
    {
        title: "ПЛАН 2/4: Верхний узел — Безопасный радиус R = 260 мм",
        sub: "Силиконовые модули P4-N · Запас гибкости 44% над критическим пределом R_min",
        startPos: new THREE.Vector3(0.95, 3.85, 1.15),
        endPos:   new THREE.Vector3(-0.75, 4.05, 0.95),
        startLook: new THREE.Vector3(0.08, 3.75, 0.08),
        endLook:   new THREE.Vector3(-0.05, 3.85, 0.05),
        env: 'day',
    },
    {
        title: "ПЛАН 3/4: Динамическая спираль и панорама конструкции",
        sub: "Сплошная лента 22.4 м · 140 гибких модулей P4-N · Обзор на 360°",
        startPos: new THREE.Vector3(4.8, 2.6, 5.8),
        endPos:   new THREE.Vector3(1.8, 1.9, 6.4),
        startLook: new THREE.Vector3(0, 2.0, 0),
        endLook:   new THREE.Vector3(0, 1.8, 0),
        env: 'dusk',
    },
    {
        title: "ПЛАН 4/4: Вечерняя иллюминация и сияние звезды",
        sub: "Золотая верхушка · Тёплый ореол света и праздничный зимний снегопад",
        startPos: new THREE.Vector3(-3.2, 2.7, 2.5),
        endPos:   new THREE.Vector3(1.6, 3.3, 3.6),
        startLook: new THREE.Vector3(0, 2.2, 0),
        endLook:   new THREE.Vector3(0, 2.5, 0),
        env: 'night',
    }
];

function startTour() {
    if (tourActive) return;
    tourActive = true;
    tourStartTime = performance.now();
    tourShotIndex = -1;
    tourSavedEnv = cfg.envPreset;
    tourSavedPos.copy(camera.position);
    tourSavedLook.copy(controls.target);

    if (currentExplosion > 0) {
        targetExplosion = 0.0;
        currentExplosion = 0.0;
        applyExplosion(0.0);
    }

    const hud = document.getElementById('tour-hud');
    if (hud) hud.style.display = 'block';

    controls.enabled = false;
    showToast('🎬 Презентация запущена (кликните в любом месте или ESC для выхода)');
}

function stopTour() {
    if (!tourActive) return;
    tourActive = false;
    tourShotIndex = -1;
    controls.enabled = true;

    const hud = document.getElementById('tour-hud');
    if (hud) hud.style.display = 'none';

    if (tourSavedEnv && tourSavedEnv !== cfg.envPreset) {
        applyEnvironment(tourSavedEnv);
    }
    showToast('⏹️ Презентация завершена');
}

function rebuildDimensions() {
    if (dimsGroup) {
        scene.remove(dimsGroup);
        dimsGroup = null;
    }
    if (!cfg.showDims) return;

    dimsGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });

    const hX = cfg.baseDiameter / 2 + 0.65;
    const hPoints = [
        new THREE.Vector3(hX, 0, 0),
        new THREE.Vector3(hX, cfg.height, 0),
        new THREE.Vector3(hX - 0.15, 0, 0), new THREE.Vector3(hX + 0.15, 0, 0),
        new THREE.Vector3(hX - 0.15, cfg.height, 0), new THREE.Vector3(hX + 0.15, cfg.height, 0),
    ];
    const hGeo = new THREE.BufferGeometry().setFromPoints(hPoints);
    dimsGroup.add(new THREE.LineSegments(hGeo, lineMat));

    const bR = cfg.baseDiameter / 2;
    const bY = cfg.podiumHeight + 0.02;
    const bPoints = [
        new THREE.Vector3(-bR, bY, 0), new THREE.Vector3(bR, bY, 0),
        new THREE.Vector3(-bR, bY - 0.1, 0), new THREE.Vector3(-bR, bY + 0.1, 0),
        new THREE.Vector3(bR, bY - 0.1, 0), new THREE.Vector3(bR, bY + 0.1, 0),
    ];
    dimsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bPoints), lineMat));

    const tR = cfg.topDiameter / 2;
    const tY = cfg.height - cfg.topClearance;
    const tPoints = [
        new THREE.Vector3(-tR, tY, 0), new THREE.Vector3(tR, tY, 0),
        new THREE.Vector3(-tR, tY - 0.08, 0), new THREE.Vector3(-tR, tY + 0.08, 0),
        new THREE.Vector3(tR, tY - 0.08, 0), new THREE.Vector3(tR, tY + 0.08, 0),
    ];
    dimsGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tPoints), lineMat));

    scene.add(dimsGroup);
}

// ==========================================================================
// 9. АНИМИРОВАННЫЙ СНЕГОПАД
// ==========================================================================
// ==========================================================================
// 8.1. ФАСАД БОЛЬНИЦЫ СВ. ВЛАДИМИРА И ВЫСОКОКАЧЕСТВЕННЫЙ ВОЛНОВОЙ ЭКРАН
// ==========================================================================
function generateMosaicTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Тёмный цементный шов между плитками
    ctx.fillStyle = '#1c2f42';
    ctx.fillRect(0, 0, 1024, 1024);

    const tileSize = 16;
    const cols = 1024 / tileSize;
    const rows = 1024 / tileSize;

    // Палитра стеклянной бирюзовой мозаики в точности с фасада павильона из концепт-фото заказчика
    const colors = [
        '#6eb8dc', '#8ecfea', '#5a9ec2', '#a6dff4',
        '#7bbcdc', '#4690b8', '#d6f1fa', '#3b81a8',
        '#9cd3eb', '#5498bf', '#74bee3', '#bee6f6',
        '#f0f8fd', '#e2f2fb', '#5c9fc2', '#86c9e8'
    ];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillStyle = color;
            ctx.fillRect(c * tileSize + 1, r * tileSize + 1, tileSize - 2, tileSize - 2);

            // Мягкий стеклянный блик на части плиток для реалистичной игры света
            if ((r + c) % 3 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                ctx.fillRect(c * tileSize + 2, r * tileSize + 2, tileSize - 4, (tileSize - 4) / 2);
            }
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    return tex;
}

function createDimSprite(text, color = '#38bdf8', scale = 0.35) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 96, 16);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale * 2.2, scale * 0.55, 1);
    return sprite;
}

function generateWaveScreenTexture(customStr, modeOverride) {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const wr = cfg.waveRibbon || {};
    const viewMode = modeOverride || wr.viewMode || 'render';
    const wrText = (customStr || wr.text || "С Новым 2027 годом!").trim();

    const cols = 17; // 17 колонок по 320 мм (5.44 м)
    const rows = 3;  // 3 ряда по 160 мм (480 мм)
    const colW = 4096 / cols; // ~240.94 px
    const rowH = 512 / rows;  // ~170.67 px

    if (viewMode === 'modules') {
        // ==================================================================
        // РЕЖИМ «РАСКЛАДКА МОДУЛЕЙ P4-N 320×160» (Инженерная схема)
        // ==================================================================
        ctx.fillStyle = '#080d1a';
        ctx.fillRect(0, 0, 4096, 512);

        // Рисуем все 51 модуль (17 колонок × 3 ряда)
        for (let c = 0; c < cols; c++) {
            const x0 = c * colW;

            // Зонирование колонок
            let zoneColor = '#0284c7';
            let zoneTitle = '3D ПОДЪЁМ';
            let zoneR = 'R ≈ 1.5 м';

            if (c < 4) {
                zoneColor = '#10b981'; // Изумрудный
                zoneTitle = 'ЧАША-КОЛЫБЕЛЬ';
                zoneR = 'Roll -42° (ВВЕРХ)';
            } else if (c < 8) {
                zoneColor = '#f59e0b'; // Янтарный
                zoneTitle = 'ВОСХОДЯЩАЯ ВОЛНА';
                zoneR = 'R ≈ 1.3-2.0 м';
            } else if (c < 11) {
                zoneColor = '#38bdf8'; // Небесно-голубой
                zoneTitle = 'КУПОЛ «2027»';
                zoneR = 'R = 235 мм (НОРМА)';
            } else if (c < 13) {
                zoneColor = '#a855f7'; // Фиолетовый
                zoneTitle = 'СЕДЛОВИНА';
                zoneR = 'R ≈ 1.2 м';
            } else {
                zoneColor = '#06b6d4'; // Циан
                zoneTitle = 'ФИНИШ «годом!»';
                zoneR = 'R ≈ 1.5-3.3 м';
            }

            for (let r = 0; r < rows; r++) {
                const y0 = r * rowH;

                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x0 + 3, y0 + 3, colW - 6, rowH - 6);

                ctx.strokeStyle = zoneColor;
                ctx.lineWidth = 2.0;
                ctx.strokeRect(x0 + 4, y0 + 4, colW - 8, rowH - 8);

                // 4 магнитных пятака по углам
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                const padR = 4;
                [[x0 + 14, y0 + 14], [x0 + colW - 14, y0 + 14],
                 [x0 + 14, y0 + rowH - 14], [x0 + colW - 14, y0 + rowH - 14]].forEach(([mx, my]) => {
                    ctx.beginPath();
                    ctx.arc(mx, my, padR, 0, Math.PI * 2);
                    ctx.fill();
                });

                ctx.fillStyle = '#f8fafc';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 22px monospace';
                ctx.fillText(`M${String(c + 1).padStart(2, '0')}-R${r + 1}`, x0 + colW / 2, y0 + rowH * 0.40);

                ctx.font = '14px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('320×160 P4-N', x0 + colW / 2, y0 + rowH * 0.65);
            }

            ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
            ctx.fillRect(x0 + 4, 4, colW - 8, 28);
            ctx.strokeStyle = zoneColor;
            ctx.strokeRect(x0 + 4, 4, colW - 8, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(`КОЛОНКА #${c + 1}`, x0 + colW / 2, 18);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fillRect(x0 + 4, 512 - 32, colW - 8, 28);
            ctx.strokeStyle = zoneColor;
            ctx.strokeRect(x0 + 4, 512 - 32, colW - 8, 28);
            ctx.fillStyle = zoneColor;
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.fillText(zoneR, x0 + colW / 2, 512 - 18);
        }

        // Полупрозрачный водяной знак текста
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "900 170px 'Inter', Arial, sans-serif";
        ctx.fillText("С Новым", 720, 256);
        ctx.font = "900 240px 'Inter', Arial, sans-serif";
        ctx.fillText("2027", 2170, 252);
        ctx.font = "900 185px 'Inter', Arial, sans-serif";
        ctx.fillText("годом!", 3480, 256);

    } else {
        // ==================================================================
        // РЕЖИМ «ПРЕДСТАВИТЕЛЬСКИЙ 3D РЕНДЕР» (Рубиновый праздничный шелк)
        // ==================================================================
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.00, '#ea1d33');
        grad.addColorStop(0.25, '#c60c20');
        grad.addColorStop(0.70, '#960515');
        grad.addColorStop(1.00, '#66020c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 4096, 512);

        // Реалистичные швы между 51 модулем P4-N
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.lineWidth = 1.8;
        for (let c = 1; c < cols; c++) {
            const x = c * colW;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
            const y = r * rowH;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(4096, y);
            ctx.stroke();
        }

        // Тонкий благородный кант короба
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, 4096, 7);
        ctx.fillRect(0, 505, 4096, 7);
        ctx.fillStyle = 'rgba(255, 235, 180, 0.40)';
        ctx.fillRect(0, 7, 4096, 2.5);
        ctx.fillRect(0, 502, 4096, 2.5);

        // Праздничная надпись «С Новым 2027 годом!»
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';

        if (wrText.includes("2027") || wrText.toLowerCase().includes("новым")) {
            ctx.textAlign = 'center';
            ctx.font = "900 175px 'Inter', 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = '#ff283a';
            ctx.shadowBlur = 35;
            ctx.fillText("С Новым", 720, 256);
            ctx.shadowBlur = 0;
            ctx.fillText("С Новым", 720, 256);

            ctx.font = "900 245px 'Inter', 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = '#ff384d';
            ctx.shadowBlur = 50;
            ctx.fillText("2027", 2170, 250);
            ctx.shadowBlur = 0;
            ctx.fillText("2027", 2170, 250);

            ctx.font = "900 185px 'Inter', 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = '#ff283a';
            ctx.shadowBlur = 35;
            ctx.fillText("годом!", 3480, 256);
            ctx.shadowBlur = 0;
            ctx.fillText("годом!", 3480, 256);
        } else {
            ctx.textAlign = 'center';
            ctx.font = "900 195px 'Inter', 'Segoe UI', Arial, sans-serif";
            ctx.shadowColor = '#ff283a';
            ctx.shadowBlur = 35;
            ctx.fillText(wrText, 2048, 256);
            ctx.shadowBlur = 0;
            ctx.fillText(wrText, 2048, 256);
        }

        // Оптическая точечная маска светодиодов SMD/DIP 4 мм (P4-N)
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = 8;
        dotCanvas.height = 8;
        const dctx = dotCanvas.getContext('2d');
        dctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
        dctx.fillRect(0, 0, 8, 8);
        dctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        dctx.beginPath();
        dctx.arc(4, 4, 2.2, 0, Math.PI * 2);
        dctx.fill();

        const pattern = ctx.createPattern(dotCanvas, 'repeat');
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, 4096, 512);
        ctx.globalCompositeOperation = 'source-over';
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

function buildWaveScreenGeometry() {
    const wr = cfg.waveRibbon || {};
    const preset = wr.preset || 'spatial';
    const crestHeight = wr.crestHeight !== undefined ? wr.crestHeight : 3.55;
    const cradleHeight = wr.cradleHeight !== undefined ? wr.cradleHeight : 1.82;
    const yOff = wr.elevationY || 0.00;
    const xOff = wr.offsetX || 0.00;
    const depthZ = wr.depthWave !== undefined ? wr.depthWave : 0.55;
    const depthScale = depthZ / 0.55;
    const twistMul = wr.twist !== undefined ? wr.twist : 1.0;
    const ribH = wr.height || 0.48; // 480 мм (3 ряда по 160 мм)
    const ribD = wr.depth || 0.14;  // 140 мм толщина пространственного короба

    const wallD = 0.35;
    const zBase = wallD / 2; // передняя плоскость мозаичного фасада (0.175 м)

    let ctrlPoints = [];
    let rollsCtrl = [];
    let tsCtrl = [];

    if (preset === 'loop') {
        // ==================================================================
        // ПРЕСЕТ «СКУЛЬПТУРНАЯ ПЕТЛЯ» (По реальному арт-объекту «Спасибо Докторам!»)
        // ==================================================================
        ctrlPoints = [
            new THREE.Vector3(-0.95 + xOff, 1.90 + yOff, zBase + 0.65 * depthScale),
            new THREE.Vector3(-1.35 + xOff, 2.75 + yOff, zBase + 0.60 * depthScale),
            new THREE.Vector3(-0.95 + xOff, 3.75 + yOff, zBase + 0.50 * depthScale),
            new THREE.Vector3(-0.55 + xOff, 2.75 + yOff, zBase + 0.45 * depthScale),
            new THREE.Vector3(-0.10 + xOff, 1.45 + yOff, zBase + 0.65 * depthScale),
            new THREE.Vector3( 0.95 + xOff, 2.45 + yOff, zBase + 0.55 * depthScale),
            new THREE.Vector3( 2.15 + xOff, crestHeight + yOff, zBase + 0.50 * depthScale),
            new THREE.Vector3( 3.10 + xOff, 2.85 + yOff, zBase + 0.42 * depthScale),
            new THREE.Vector3( 4.10 + xOff, 3.45 + yOff, zBase + 0.52 * depthScale)
        ];
        tsCtrl    = [0.00,  0.12,  0.25,  0.38,  0.50,  0.65,  0.80,  0.92,  1.00];
        rollsCtrl = [0.0,   90.0,  180.0, -90.0, -48.0, -18.0, +20.0, -10.0, -15.0];
    } else {
        // ==================================================================
        // ПРЕСЕТ «ПРОСТРАНСТВЕННАЯ 3D ВОЛНА» (Концепт св. Владимира 2027)
        // ==================================================================
        ctrlPoints = [
            new THREE.Vector3(-0.85 + xOff, 2.25 + yOff, zBase + 0.72 * depthScale), // 0: приподнятый левый завиток у окна
            new THREE.Vector3(-0.35 + xOff, cradleHeight + yOff, zBase + 0.65 * depthScale), // 1: нижняя колыбель («С Новым»)
            new THREE.Vector3( 0.45 + xOff, 2.25 + yOff, zBase + 0.52 * depthScale), // 2: выход на диагональный подъем
            new THREE.Vector3( 1.35 + xOff, 2.95 + yOff, zBase + 0.45 * depthScale), // 3: восхождение над павильоном
            new THREE.Vector3( 2.20 + xOff, crestHeight + yOff, zBase + 0.50 * depthScale), // 4: купол арки («2027»)
            new THREE.Vector3( 3.00 + xOff, 3.12 + yOff, zBase + 0.40 * depthScale), // 5: седловина
            new THREE.Vector3( 3.70 + xOff, 3.52 + yOff, zBase + 0.48 * depthScale), // 6: правый взлет («годом!»)
            new THREE.Vector3( 4.25 + xOff, 3.82 + yOff, zBase + 0.55 * depthScale)  // 7: парящий стяг у карниза
        ];
        tsCtrl    = [0.00,  0.15,  0.30,  0.48,  0.65,  0.78,  0.90,  1.00];
        rollsCtrl = [-30.0, -42.0, -15.0,  +5.0, +20.0,  -5.0, -12.0, -15.0];
    }

    const evalRibbonProfile = (t) => {
        let idx = 0;
        while (idx < tsCtrl.length - 2 && t > tsCtrl[idx + 1]) idx++;
        const t0 = tsCtrl[idx], t1 = tsCtrl[idx + 1];
        const frac = THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1);
        const s = frac * frac * (3 - 2 * frac); // smoothstep
        const rollDeg = (rollsCtrl[idx] + (rollsCtrl[idx + 1] - rollsCtrl[idx]) * s) * twistMul;
        return { rollDeg, width: ribH };
    };

    const curve = new THREE.CatmullRomCurve3(ctrlPoints, false, 'catmullrom', 0.5);
    const segs = 120;
    const samples = [];
    let arcLen = 0;

    for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const pos = curve.getPointAt(t);
        if (i > 0) arcLen += pos.distanceTo(samples[i - 1].pos);
        samples.push({ pos, t, arcLen });
    }

    let minCurvRadius = 999.0;
    const refNorm = new THREE.Vector3(0, 0, 1);

    for (let i = 0; i <= segs; i++) {
        const s = samples[i];
        const t = s.t;
        const tangent = curve.getTangentAt(t).normalize();

        let w0 = new THREE.Vector3().crossVectors(refNorm, tangent);
        if (w0.y < 0) w0.negate();
        if (w0.lengthSq() < 0.001) w0.set(0, 1, 0);
        w0.normalize();

        let n0 = new THREE.Vector3().crossVectors(tangent, w0).normalize();
        if (n0.z < 0) {
            n0.negate();
            w0.negate();
        }

        const profile = evalRibbonProfile(t);
        const rad = profile.rollDeg * (Math.PI / 180);
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const widthDir = new THREE.Vector3()
            .copy(w0).multiplyScalar(cosA)
            .addScaledVector(n0, sinA)
            .normalize();

        const normal = new THREE.Vector3().crossVectors(tangent, widthDir).normalize();

        s.tangent = tangent;
        s.widthDir = widthDir;
        s.normal = normal;
        s.w = profile.width;

        if (i > 0 && i < segs) {
            const pPrev = samples[i - 1].pos;
            const pCurr = samples[i].pos;
            const pNext = samples[i + 1].pos;
            const v1 = new THREE.Vector3().subVectors(pCurr, pPrev).normalize();
            const v2 = new THREE.Vector3().subVectors(pNext, pCurr).normalize();
            const angle = v1.angleTo(v2);
            const ds = (pCurr.distanceTo(pPrev) + pNext.distanceTo(pCurr)) * 0.5;
            if (angle > 0.0001 && ds > 0.0001) {
                const r = ds / angle;
                if (r < minCurvRadius) minCurvRadius = r;
            }
        }
    }

    const posArr = new Float32Array((segs + 1) * 8 * 3 + 8 * 3);
    const uvArr  = new Float32Array((segs + 1) * 8 * 2 + 8 * 2);
    const frontIdx = [];
    const caseIdx  = [];

    const hd = ribD / 2; // полуглубина короба

    for (let i = 0; i <= segs; i++) {
        const s = samples[i];
        const hw = s.w / 2;
        const base = i * 8;

        const ft = _corner(s.pos, s.normal, hd, s.widthDir, hw);
        const fb = _corner(s.pos, s.normal, hd, s.widthDir, -hw);
        const bt = _corner(s.pos, s.normal, -hd, s.widthDir, hw);
        const bb = _corner(s.pos, s.normal, -hd, s.widthDir, -hw);

        _setV3(posArr, base + 0, ft);
        _setV3(posArr, base + 1, fb);
        _setV3(posArr, base + 2, bb);
        _setV3(posArr, base + 3, bt);
        _setV3(posArr, base + 4, ft);
        _setV3(posArr, base + 5, bt);
        _setV3(posArr, base + 6, bb);
        _setV3(posArr, base + 7, fb);

        const u = arcLen > 0 ? (s.arcLen / arcLen) : s.t;
        _setV2(uvArr, base + 0, u, 1);
        _setV2(uvArr, base + 1, u, 0);
        for (let j = 2; j < 8; j++) _setV2(uvArr, base + j, 0, 0);

        if (i < segs) {
            const b = base, n = (i + 1) * 8;
            frontIdx.push(b, n, n + 1, b, n + 1, b + 1);
            caseIdx.push(b + 3, n + 3, n + 2, b + 3, n + 2, b + 2);
            caseIdx.push(b + 4, n + 4, n + 5, b + 4, n + 5, b + 5);
            caseIdx.push(b + 7, n + 7, n + 6, b + 7, n + 6, b + 6);
        }
    }

    // Торцы короба
    const startCapBase = (segs + 1) * 8;
    const endCapBase   = startCapBase + 4;

    const s0 = samples[0];
    const s0_hw = s0.w / 2;
    const s0_ft = _corner(s0.pos, s0.normal, hd, s0.widthDir, s0_hw);
    const s0_fb = _corner(s0.pos, s0.normal, hd, s0.widthDir, -s0_hw);
    const s0_bt = _corner(s0.pos, s0.normal, -hd, s0.widthDir, s0_hw);
    const s0_bb = _corner(s0.pos, s0.normal, -hd, s0.widthDir, -s0_hw);

    _setV3(posArr, startCapBase + 0, s0_fb);
    _setV3(posArr, startCapBase + 1, s0_ft);
    _setV3(posArr, startCapBase + 2, s0_bt);
    _setV3(posArr, startCapBase + 3, s0_bb);
    for (let k = 0; k < 4; k++) _setV2(uvArr, startCapBase + k, 0, 0);
    caseIdx.push(startCapBase + 0, startCapBase + 1, startCapBase + 2,
                 startCapBase + 0, startCapBase + 2, startCapBase + 3);

    const s1 = samples[segs];
    const s1_hw = s1.w / 2;
    const s1_ft = _corner(s1.pos, s1.normal, hd, s1.widthDir, s1_hw);
    const s1_fb = _corner(s1.pos, s1.normal, hd, s1.widthDir, -s1_hw);
    const s1_bt = _corner(s1.pos, s1.normal, -hd, s1.widthDir, s1_hw);
    const s1_bb = _corner(s1.pos, s1.normal, -hd, s1.widthDir, -s1_hw);

    _setV3(posArr, endCapBase + 0, s1_ft);
    _setV3(posArr, endCapBase + 1, s1_fb);
    _setV3(posArr, endCapBase + 2, s1_bb);
    _setV3(posArr, endCapBase + 3, s1_bt);
    for (let k = 0; k < 4; k++) _setV2(uvArr, endCapBase + k, 0, 0);
    caseIdx.push(endCapBase + 0, endCapBase + 1, endCapBase + 2,
                 endCapBase + 0, endCapBase + 2, endCapBase + 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
    geo.setIndex([...frontIdx, ...caseIdx]);
    geo.addGroup(0, frontIdx.length, 0);
    geo.addGroup(frontIdx.length, caseIdx.length, 1);
    geo.computeVertexNormals();

    return { geometry: geo, arcLength: arcLen, minRadius: minCurvRadius, samples };
}

// 3D Архитектурные опорные стойки-пилоны к земле и горизонтальные консоли к стене (по реальному фото!)
function buildWavePillars(samples, ribH, hd, wallFaceZ) {
    const pGroup = new THREE.Group();
    pGroup.name = 'wavePillars';

    const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x1e2430,
        metalness: 0.70,
        roughness: 0.40
    });
    const flangeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.80,
        roughness: 0.30
    });
    const strutMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.65,
        roughness: 0.45
    });

    const segs = samples.length - 1;
    // 3 вертикальные опорные стойки-колонны из профильной трубы (как в реальном арт-объекте!)
    const pillarIndices = [
        Math.round(segs * 0.12), // под чашей колыбели (x ~ -0.4м)
        Math.round(segs * 0.38), // под подъемом (x ~ +0.9м)
        Math.round(segs * 0.72)  // под седловиной (x ~ +3.0м)
    ];

    pillarIndices.forEach(idx => {
        const smp = samples[idx];
        const groundY = 0.0;
        const bottomY = smp.pos.y - ribH * 0.45;
        const h = Math.max(0.2, bottomY - groundY);

        // Вертикальная стойка ⌀70 мм
        const colGeo = new THREE.CylinderGeometry(0.038, 0.042, h, 16);
        const colMesh = new THREE.Mesh(colGeo, pillarMat);
        colMesh.position.set(smp.pos.x, groundY + h / 2, smp.pos.z - hd * 0.3);
        colMesh.castShadow = true;
        pGroup.add(colMesh);

        // Опорная база-башмак на земле
        const baseGeo = new THREE.BoxGeometry(0.24, 0.03, 0.24);
        const baseMesh = new THREE.Mesh(baseGeo, flangeMat);
        baseMesh.position.set(smp.pos.x, 0.015, smp.pos.z - hd * 0.3);
        pGroup.add(baseMesh);

        // Хомут крепления к ленте
        const clampGeo = new THREE.BoxGeometry(0.10, 0.08, 0.10);
        const clampMesh = new THREE.Mesh(clampGeo, flangeMat);
        clampMesh.position.set(smp.pos.x, bottomY, smp.pos.z - hd * 0.3);
        pGroup.add(clampMesh);
    });

    // 5 горизонтальных силовых консолей-распорок к фасаду здания
    const consoleIndices = [
        Math.round(segs * 0.05),
        Math.round(segs * 0.28),
        Math.round(segs * 0.52),
        Math.round(segs * 0.76),
        Math.round(segs * 0.95)
    ];

    consoleIndices.forEach(idx => {
        const smp = samples[idx];
        const backZ = smp.pos.z - smp.normal.z * hd;
        const strutLen = Math.max(0.06, backZ - wallFaceZ);

        const strGeo = new THREE.BoxGeometry(0.06, 0.05, strutLen);
        const strMesh = new THREE.Mesh(strGeo, strutMat);
        strMesh.position.set(smp.pos.x, smp.pos.y, wallFaceZ + strutLen / 2);
        strMesh.castShadow = true;
        pGroup.add(strMesh);

        const plateGeo = new THREE.BoxGeometry(0.14, 0.14, 0.01);
        const plateMesh = new THREE.Mesh(plateGeo, flangeMat);
        plateMesh.position.set(smp.pos.x, smp.pos.y, wallFaceZ + 0.005);
        pGroup.add(plateMesh);
    });

    return pGroup;
}

// 3D Металлоконструкция несущего подкаркаса (профильная труба 40×20, ребра каждые 320 мм, магниты)
function buildWaveSubframe(samples, hd, ribH, wallFaceZ) {
    const subGroup = new THREE.Group();
    subGroup.name = 'waveSubframe';

    const steelMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.85,
        roughness: 0.35,
    });
    const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.90,
        roughness: 0.25,
    });

    const hw = ribH / 2;
    const segs = samples.length - 1;

    for (let i = 0; i < segs; i += 2) {
        const sA = samples[i];
        const sB = samples[Math.min(segs, i + 2)];

        const pTopA = new THREE.Vector3().addVectors(sA.pos, sA.widthDir.clone().multiplyScalar(hw - 0.03)).sub(sA.normal.clone().multiplyScalar(hd * 0.5));
        const pTopB = new THREE.Vector3().addVectors(sB.pos, sB.widthDir.clone().multiplyScalar(hw - 0.03)).sub(sB.normal.clone().multiplyScalar(hd * 0.5));
        const vTop = new THREE.Vector3().subVectors(pTopB, pTopA);
        const lTop = vTop.length();
        if (lTop > 0.01) {
            const tGeo = new THREE.BoxGeometry(0.04, 0.02, lTop);
            const tMesh = new THREE.Mesh(tGeo, steelMat);
            tMesh.position.copy(pTopA).addScaledVector(vTop, 0.5);
            tMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vTop.clone().normalize());
            subGroup.add(tMesh);
        }

        const pBotA = new THREE.Vector3().subVectors(sA.pos, sA.widthDir.clone().multiplyScalar(hw - 0.03)).sub(sA.normal.clone().multiplyScalar(hd * 0.5));
        const pBotB = new THREE.Vector3().subVectors(sB.pos, sB.widthDir.clone().multiplyScalar(hw - 0.03)).sub(sB.normal.clone().multiplyScalar(hd * 0.5));
        const vBot = new THREE.Vector3().subVectors(pBotB, pBotA);
        const lBot = vBot.length();
        if (lBot > 0.01) {
            const bGeo = new THREE.BoxGeometry(0.04, 0.02, lBot);
            const bMesh = new THREE.Mesh(bGeo, steelMat);
            bMesh.position.copy(pBotA).addScaledVector(vBot, 0.5);
            bMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vBot.clone().normalize());
            subGroup.add(bMesh);
        }
    }

    const totalArc = samples[segs].arcLen;
    const stepM = 0.32;
    const nRibs = Math.round(totalArc / stepM) + 1;

    for (let r = 0; r < nRibs; r++) {
        const targetLen = Math.min(totalArc, r * stepM);
        let sIdx = 0;
        while (sIdx < segs && samples[sIdx].arcLen < targetLen) sIdx++;
        const smp = samples[sIdx];

        const ribGeo = new THREE.BoxGeometry(0.025, ribH - 0.05, 0.025);
        const ribMesh = new THREE.Mesh(ribGeo, steelMat);
        const ribPos = smp.pos.clone().sub(smp.normal.clone().multiplyScalar(hd * 0.50));
        ribMesh.position.copy(ribPos);

        const mRot = new THREE.Matrix4().makeBasis(smp.tangent, smp.widthDir, smp.normal);
        ribMesh.setRotationFromMatrix(mRot);
        subGroup.add(ribMesh);

        const magGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 12);
        [-0.14, -0.05, 0.05, 0.14].forEach(offY => {
            const mag = new THREE.Mesh(magGeo, brassMat);
            const magP = smp.pos.clone()
                .add(smp.widthDir.clone().multiplyScalar(offY))
                .sub(smp.normal.clone().multiplyScalar(hd * 0.05));
            mag.position.copy(magP);
            mag.setRotationFromMatrix(mRot);
            subGroup.add(mag);
        });
    }

    return subGroup;
}

function updateWaveRibbonTelemetry(arcLen = 5.44, minR = 0.235) {
    const wr = cfg.waveRibbon;
    if (!wr) return;

    const actualLen = arcLen || 5.44;
    const cols = 17;
    const rows = 3;
    const totalModules = cols * rows;
    const resX = cols * 80;
    const resY = rows * 40;
    const powerKW = ((totalModules * 35) / 1000).toFixed(1);
    const psuCount = Math.ceil((totalModules * 35) / 200);
    const bendMM = Math.round((minR || 0.235) * 1000);

    const elMod = document.getElementById('info-wave-modules');
    if (elMod) elMod.textContent = `${totalModules} шт (${cols}×${rows})`;

    const elZones = document.getElementById('info-wave-zones');
    if (elZones) elZones.textContent = `Вынос 35-75 см + чаша 42°`;

    const elRes = document.getElementById('info-wave-res');
    if (elRes) elRes.textContent = `${resX} × ${resY} px`;

    const elBend = document.getElementById('info-wave-bend');
    if (elBend) {
        const safetyMargin = Math.round(((bendMM - 200) / 200) * 100);
        if (bendMM >= 230) {
            elBend.style.color = '#22c55e';
            elBend.textContent = `R = ${bendMM} мм (+${safetyMargin}% норма ≥ 200 мм)`;
        } else if (bendMM >= 200) {
            elBend.style.color = '#facc15';
            elBend.textContent = `R = ${bendMM} мм (норма)`;
        } else {
            elBend.style.color = '#ef4444';
            elBend.textContent = `R = ${bendMM} мм (предел)`;
        }
    }

    const elPower = document.getElementById('info-wave-power');
    if (elPower) elPower.textContent = `${powerKW} кВт (${psuCount} БП 5V 40A)`;
}

function buildFacadeGroup() {
    if (facadeGroup) {
        scene.remove(facadeGroup);
        facadeGroup = null;
    }
    if (!showFacade) return;

    facadeGroup = new THREE.Group();
    facadeGroup.name = 'facadeSystem';
    facadeGroup.position.set(3.8, 0, -2.4);
    facadeGroup.rotation.y = -0.12;

    const wallW = 8.66; // 8660 мм ширина
    const wallH = 4.73; // 4730 мм высота
    const wallD = 0.35;

    // 1. Стена павильона с бирюзовой мозаикой
    const wallGeo = new THREE.BoxGeometry(wallW, wallH, wallD);
    const mosaicTex = generateMosaicTexture();
    const mosaicMat = new THREE.MeshStandardMaterial({
        map: mosaicTex,
        roughness: 0.30,
        metalness: 0.18,
    });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const wallMats = [concreteMat, concreteMat, concreteMat, concreteMat, mosaicMat, concreteMat];
    const wall = new THREE.Mesh(wallGeo, wallMats);
    wall.position.set(0, wallH / 2, 0);
    wall.receiveShadow = true;
    facadeGroup.add(wall);

    // Архитектурные стыки панелей по чертежу
    const panelJointMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.65 });
    const panelXs = [
        -4.33 + 0.045,
        -4.33 + 0.045 + 1.070,
        -4.33 + 0.045 + 1.070 + 1.090,
        -4.33 + 0.045 + 1.070 + 1.090 + 1.434,
        -4.33 + 0.045 + 1.070 + 1.090 + 1.434 + 0.950,
        -4.33 + 0.045 + 1.070 + 1.090 + 1.434 + 0.950 + 1.010,
        -4.33 + 0.045 + 1.070 + 1.090 + 1.434 + 0.950 + 1.010 + 1.010,
        -4.33 + 0.045 + 1.070 + 1.090 + 1.434 + 0.950 + 1.010 + 1.010 + 1.010,
    ];
    panelXs.forEach(px => {
        const jGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(px, 0, wallD / 2 + 0.005),
            new THREE.Vector3(px, wallH, wallD / 2 + 0.005)
        ]);
        const jLine = new THREE.Line(jGeo, panelJointMat);
        facadeGroup.add(jLine);
    });

    // Карниз крыши и снег
    const roofCopingGeo = new THREE.BoxGeometry(wallW + 0.20, 0.14, wallD + 0.16);
    const roofCopingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });
    const roofCoping = new THREE.Mesh(roofCopingGeo, roofCopingMat);
    roofCoping.position.set(0, wallH + 0.07, 0.02);
    facadeGroup.add(roofCoping);

    const snowRoofGeo = new THREE.BoxGeometry(wallW + 0.15, 0.12, wallD + 0.14);
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f8fc, roughness: 0.90 });
    const snowRoof = new THREE.Mesh(snowRoofGeo, snowMat);
    snowRoof.position.set(0, wallH + 0.18, 0.03);
    snowRoof.receiveShadow = true;
    facadeGroup.add(snowRoof);

    // 2. Окно в секции 3
    const winW = 1.40;
    const winH = 1.40;
    const winGeo = new THREE.PlaneGeometry(winW, winH);
    const texLoader = new THREE.TextureLoader();
    const winTex = texLoader.load('win_reflection.jpg');
    winTex.colorSpace = THREE.SRGBColorSpace;
    
    const winGlassMat = new THREE.MeshStandardMaterial({
        map: winTex,
        roughness: 0.10,
        metalness: 0.70,
        emissive: 0x112233,
        emissiveIntensity: 0.20
    });
    const win = new THREE.Mesh(winGeo, winGlassMat);
    win.position.set(-1.41, 2.45, wallD / 2 + 0.035);
    facadeGroup.add(win);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.50, metalness: 0.30 });
    const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.12, winH + 0.12, 0.04), frameMat);
    frameOuter.position.set(-1.41, 2.45, wallD / 2 + 0.015);
    facadeGroup.add(frameOuter);

    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.05, winH, 0.05), frameMat);
    mullion.position.set(-1.41, 2.45, wallD / 2 + 0.04);
    facadeGroup.add(mullion);

    // 3. Трёхмерная пространственная волновая лента св. Владимира
    const { geometry: waveGeo, arcLength: arcLen, minRadius: minR, samples: splineSamples } = buildWaveScreenGeometry();
    const wr = cfg.waveRibbon || {};
    const viewMode = wr.viewMode || 'render';

    waveTextTexture = generateWaveScreenTexture(wr.text, viewMode);

    let waveLedMat, waveCaseMat;

    if (viewMode === 'subframe') {
        waveLedMat = new THREE.MeshStandardMaterial({
            map: waveTextTexture,
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.40,
            transparent: true,
            opacity: 0.32,
            roughness: 0.20,
            metalness: 0.10,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        waveCaseMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            transparent: true,
            opacity: 0.35,
            roughness: 0.50,
            metalness: 0.50,
            side: THREE.DoubleSide,
        });
    } else if (viewMode === 'modules') {
        waveLedMat = new THREE.MeshStandardMaterial({
            map: waveTextTexture,
            color: 0xffffff,
            emissive: 0x38bdf8,
            emissiveIntensity: 0.90,
            emissiveMap: waveTextTexture,
            roughness: 0.25,
            metalness: 0.15,
            side: THREE.DoubleSide,
        });
        waveCaseMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.35,
            metalness: 0.30,
            side: THREE.DoubleSide,
        });
    } else {
        waveLedMat = new THREE.MeshStandardMaterial({
            map: waveTextTexture,
            color: 0xffffff,
            emissive: 0xff1a2b,
            emissiveIntensity: 0.85,
            emissiveMap: waveTextTexture,
            roughness: 0.25,
            metalness: 0.15,
            side: THREE.DoubleSide,
        });
        // Благородный рубиновый автомобильный глянец корпуса
        waveCaseMat = new THREE.MeshStandardMaterial({
            color: 0xba0819,
            roughness: 0.22,
            metalness: 0.30,
            side: THREE.DoubleSide,
        });
    }

    waveScreenMesh = new THREE.Mesh(waveGeo, [waveLedMat, waveCaseMat]);
    waveScreenMesh.position.set(0, 0, 0);
    waveScreenMesh.castShadow = true;
    waveScreenMesh.receiveShadow = true;
    facadeGroup.add(waveScreenMesh);

    // 3.1. Несущий пространственный металлокаркас
    const ribH = wr.height || 0.48;
    const hd = (wr.depth || 0.14) / 2;
    waveSubframeGroup = buildWaveSubframe(splineSamples, hd, ribH, wallD / 2);
    waveSubframeGroup.visible = (viewMode === 'subframe');
    facadeGroup.add(waveSubframeGroup);

    // 3.2. Архитектурные опорные стойки-пилоны и консоли (как на реальном фото!)
    wavePillarsGroup = buildWavePillars(splineSamples, ribH, hd, wallD / 2);
    wavePillarsGroup.visible = (wr.showPillars !== false);
    facadeGroup.add(wavePillarsGroup);

    // Мягкое праздничное освещение от парящей ленты на мозаичный фасад
    const pMid = splineSamples[Math.round(splineSamples.length * 0.45)].pos;
    const waveGlowLight = new THREE.PointLight(0xff2233, 2.2, 7.5);
    waveGlowLight.position.set(pMid.x, pMid.y, pMid.z + 0.35);
    facadeGroup.add(waveGlowLight);

    // 4. 3D Чертёжные размеры стены и ленты
    wallDimsGroup = new THREE.Group();
    wallDimsGroup.name = 'wallDims';

    const dimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    const bottomDimGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.33, -0.15, wallD / 2 + 0.12),
        new THREE.Vector3(4.33, -0.15, wallD / 2 + 0.12)
    ]);
    wallDimsGroup.add(new THREE.Line(bottomDimGeo, dimMat));
    [-4.33, 4.33].forEach(tx => {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(tx, -0.25, wallD / 2 + 0.12),
            new THREE.Vector3(tx, -0.05, wallD / 2 + 0.12)
        ]);
        wallDimsGroup.add(new THREE.Line(tickGeo, dimMat));
    });
    const lblBottom = createDimSprite('8660 мм (Ширина фасада)', '#38bdf8', 0.38);
    lblBottom.position.set(0, -0.35, wallD / 2 + 0.15);
    wallDimsGroup.add(lblBottom);

    const leftDimGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-4.55, 0, wallD / 2 + 0.12),
        new THREE.Vector3(-4.55, wallH, wallD / 2 + 0.12)
    ]);
    wallDimsGroup.add(new THREE.Line(leftDimGeo, dimMat));
    [0, wallH].forEach(ty => {
        const tickGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-4.65, ty, wallD / 2 + 0.12),
            new THREE.Vector3(-4.45, ty, wallD / 2 + 0.12)
        ]);
        wallDimsGroup.add(new THREE.Line(tickGeo, dimMat));
    });
    const lblLeft = createDimSprite('4730 мм (Высота)', '#38bdf8', 0.38);
    lblLeft.position.set(-4.95, wallH / 2, wallD / 2 + 0.15);
    wallDimsGroup.add(lblLeft);

    const boxX = -0.85 + (wr.offsetX || 0);
    const boxW = 5.10;
    const boxY = 1.80 + (wr.elevationY || 0);
    const boxH = 2.10;

    const boxPoints = [
        new THREE.Vector3(boxX, boxY, wallD / 2 + 0.08),
        new THREE.Vector3(boxX + boxW, boxY, wallD / 2 + 0.08),
        new THREE.Vector3(boxX + boxW, boxY + boxH, wallD / 2 + 0.08),
        new THREE.Vector3(boxX, boxY + boxH, wallD / 2 + 0.08),
        new THREE.Vector3(boxX, boxY, wallD / 2 + 0.08)
    ];
    const boxMat = new THREE.LineDashedMaterial({ color: 0x0ea5e9, dashSize: 0.12, gapSize: 0.08, linewidth: 2 });
    const boxGeo = new THREE.BufferGeometry().setFromPoints(boxPoints);
    const boxLine = new THREE.Line(boxGeo, boxMat);
    boxLine.computeLineDistances();
    wallDimsGroup.add(boxLine);

    const lblBoxTop = createDimSprite('4410 мм (Зона ленты)', '#0ea5e9', 0.32);
    lblBoxTop.position.set(boxX + boxW / 2, boxY + boxH + 0.22, wallD / 2 + 0.12);
    wallDimsGroup.add(lblBoxTop);

    wallDimsGroup.visible = Boolean(wr.showWallDims);
    facadeGroup.add(wallDimsGroup);

    // 5. Модульная сетка
    waveGridGroup = new THREE.Group();
    waveGridGroup.name = 'waveGrid';
    const gridCols = 12;
    const gridRows = 4;
    const gridMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.45 });
    for (let c = 0; c <= gridCols; c++) {
        const gx = boxX + (c / gridCols) * boxW;
        const gGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(gx, boxY, wallD / 2 + 0.06),
            new THREE.Vector3(gx, boxY + boxH, wallD / 2 + 0.06)
        ]);
        waveGridGroup.add(new THREE.Line(gGeo, gridMat));
    }
    for (let r = 0; r <= gridRows; r++) {
        const gy = boxY + (r / gridRows) * boxH;
        const gGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(boxX, gy, wallD / 2 + 0.06),
            new THREE.Vector3(boxX + boxW, gy, wallD / 2 + 0.06)
        ]);
        waveGridGroup.add(new THREE.Line(gGeo, gridMat));
    }
    waveGridGroup.visible = Boolean(wr.showGrid);
    facadeGroup.add(waveGridGroup);

    // Обновляем телеметрию
    updateWaveRibbonTelemetry(arcLen, minR);

    facadeGroup.visible = showFacade && ensembleMode !== 'tree' && cfg.envPreset !== 'photo';
    scene.add(facadeGroup);
}
function setEnsembleMode(mode) {
    ensembleMode = mode;
    ['btn-ens-tree', 'btn-ens-all', 'btn-ens-facade'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.remove('active');
    });
    const activeBtn = document.getElementById(`btn-ens-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (treeGroup) {
        treeGroup.visible = mode === 'tree' || mode === 'all';
    }
    if (facadeGroup) {
        facadeGroup.visible = (mode === 'facade' || mode === 'all') && showFacade;
    }
}

// Быстрая фокусировка камеры на ключевых зонах ансамбля
function focusCamera(name) {
    if (tourActive) stopTour();
    if (name === 'tree') {
        setCameraTarget(new THREE.Vector3(4.2, 2.5, 6.2), new THREE.Vector3(0, 2.0, 0));
        showToast('🎄 Фокус на конусной ёлке');
    } else if (name === 'wave') {
        setCameraTarget(new THREE.Vector3(1.6, 2.6, 5.2), new THREE.Vector3(3.4, 2.8, -1.8));
        showToast('🎗️ Фокус на фасадном волновом экране');
    } else if (name === 'all') {
        setCameraTarget(new THREE.Vector3(2.2, 2.7, 7.8), new THREE.Vector3(1.4, 2.2, -0.6));
        showToast('🏛️ Общий вид архитектурного ансамбля');
    }
}

function setCameraTarget(pos, look) {
    camera._targetPos = pos.clone();
    camera._targetLook = look.clone();
    camera._lerpT = 0;
}

// Скрытие и показ левой панели управления
function togglePanel(forceCollapse) {
    const panel = document.getElementById('panel');
    const btnShow = document.getElementById('btn-show-panel');
    if (!panel) return;

    const shouldCollapse = forceCollapse !== undefined ? forceCollapse : !panel.classList.contains('collapsed');
    if (shouldCollapse) {
        panel.classList.add('collapsed');
        if (btnShow) btnShow.classList.add('visible');
        showToast('Панель скрыта. Нажмите [⚙️ Параметры] или клавишу H для возврата');
    } else {
        panel.classList.remove('collapsed');
        if (btnShow) btnShow.classList.remove('visible');
    }
}

function setupSnowParticles() {
    const count = 1200;
    snowGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(count * 3);
    const velArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        posArr[i * 3 + 0] = (Math.random() - 0.5) * 16;
        posArr[i * 3 + 1] = Math.random() * 8;
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 16;
        velArr[i] = 0.012 + Math.random() * 0.020;
    }

    snowGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    snowGeo.userData = { velArr };

    const snowMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.10,
        map: snowTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);
}

function updateSnow() {
    if (!snowParticles || !cfg.showSnow) return;
    const pos = snowGeo.attributes.position.array;
    const vels = snowGeo.userData.velArr;
    const count = vels.length;

    for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= vels[i];
        pos[i * 3 + 0] += Math.sin(pos[i * 3 + 1] * 2 + i) * 0.003;
        if (pos[i * 3 + 1] < 0) {
            pos[i * 3 + 1] = 7.5;
            pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
        }
    }
    snowGeo.attributes.position.needsUpdate = true;
}

// ==========================================================================
// 10. 3D ВЫНОСКИ (CALLOUTS DOM)
// ==========================================================================
function setupCalloutsDOM() {
    const container = document.getElementById('callouts-container');
    if (!container) return;
    container.innerHTML = '';

    calloutNodes.forEach((node, idx) => {
        const badge = document.createElement('div');
        badge.className = 'callout-badge';
        badge.id = `callout-${idx}`;
        badge.innerHTML = `
            <div class="callout-header">
                <span class="callout-dot"></span>
                <span>${node.title}</span>
            </div>
            <div class="callout-text">${node.desc}</div>
            <div class="callout-arrow"></div>
        `;
        badge.addEventListener('click', () => {
            camera._targetLook = node.pos.clone();
            camera._lerpT = 0;
        });
        container.appendChild(badge);
    });
}

function updateCalloutsPosition() {
    const container = document.getElementById('callouts-container');
    if (!container) return;

    if (!cfg.showCallouts) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    const tempV = new THREE.Vector3();

    calloutNodes.forEach((node, idx) => {
        const el = document.getElementById(`callout-${idx}`);
        if (!el) return;

        tempV.copy(node.pos);
        tempV.project(camera);

        // Проверка: точка находится перед камерой
        if (tempV.z > 1.0) {
            el.style.display = 'none';
            return;
        }

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

        el.style.display = 'block';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
    });
}

// ==========================================================================

// ==========================================================================
// 12c. ПЕРЕКЛЮЧЕНИЕ КОЛИЧЕСТВА МАГНИТОВ (4 шт. vs 8 шт. на модуль 320x160)
// ==========================================================================
function setMagnetsPerMod(count, showToastMsg = true) {
    cfg.magnetsPerMod = count;

    const btn4 = document.getElementById('btn-mag-4');
    const btn8 = document.getElementById('btn-mag-8');
    const insp4 = document.getElementById('btn-inspect-mag4');
    const insp8 = document.getElementById('btn-inspect-mag8');
    const badge = document.getElementById('mag-badge');
    const hint = document.getElementById('mag-hint');

    if (count === 4) {
        if (btn4) btn4.classList.add('active');
        if (btn8) btn8.classList.remove('active');
        if (insp4) insp4.classList.add('active');
        if (insp8) insp8.classList.remove('active');
        if (badge) {
            badge.textContent = '4 МАГНИТА';
            badge.style.color = '#06b6d4';
            badge.style.background = 'rgba(6, 182, 212, 0.2)';
            badge.style.borderColor = 'rgba(6, 182, 212, 0.4)';
        }
        if (hint) {
            hint.innerHTML = 'Выбрано 4 магнита: <strong>560 шт.</strong> на всю ёлку • Прижим <strong>12 кг/модуль</strong> • Сборка в 2 раза быстрее!';
        }
        if (showToastMsg) {
            showToast('🧲 Режим: по 4 магнита на модуль (560 шт на ёлку, прижим 12 кг/модуль)');
        }
    } else {
        if (btn4) btn4.classList.remove('active');
        if (btn8) btn8.classList.add('active');
        if (insp4) insp4.classList.remove('active');
        if (insp8) insp8.classList.add('active');
        if (badge) {
            badge.textContent = '8 МАГНИТОВ';
            badge.style.color = '#c084fc';
            badge.style.background = 'rgba(192, 132, 252, 0.2)';
            badge.style.borderColor = 'rgba(192, 132, 252, 0.4)';
        }
        if (hint) {
            hint.innerHTML = 'Выбрано 8 магнитов: <strong>1120 шт.</strong> на всю ёлку • Прижим <strong>24 кг/модуль</strong> • Максимальная фиксация дуги R260!';
        }
        if (showToastMsg) {
            showToast('🧲 Режим: по 8 магнитов на модуль (1120 шт на ёлку, прижим 24 кг/модуль)');
        }
    }

    rebuildTree();
    updateSingleModuleMagnets(count);
}

// ==========================================================================
// 12d. ИНТЕРАКТИВНЫЙ 3D ИНСПЕКТОР ОДНОГО МОДУЛЯ P4-N (320x160 мм)
// ==========================================================================
function openModuleInspector() {
    const modal = document.getElementById('modal-module-inspector');
    if (!modal) return;
    modal.classList.add('open');
    moduleInspectorActive = true;

    requestAnimationFrame(() => {
        initModuleInspector();
    });
}

function closeModuleInspector() {
    const modal = document.getElementById('modal-module-inspector');
    if (modal) modal.classList.remove('open');
    moduleInspectorActive = false;
}

function initModuleInspector() {
    const canvas = document.getElementById('canvas-module');
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent.clientWidth || 800;
    const height = parent.clientHeight || 380;

    if (!modRenderer) {
        modRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        modRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        modRenderer.setSize(width, height);
        modRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        modRenderer.toneMappingExposure = 1.1;

        modScene = new THREE.Scene();
        modCamera = new THREE.PerspectiveCamera(40, width / height, 0.05, 10);
        modCamera.position.set(0.12, 0.08, 0.38);

        modControls = new OrbitControls(modCamera, canvas);
        modControls.target.set(0, 0, 0);
        modScene.background = new THREE.Color(0x131926);
        modControls.enableDamping = true;
        modControls.dampingFactor = 0.05;
        modControls.minDistance = 0.18;
        modControls.maxDistance = 0.90;

        // Освещение инспектора
        const aLight = new THREE.AmbientLight(0xffffff, 0.9);
        modScene.add(aLight);

        const dLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
        dLight1.position.set(1, 2, 2);
        modScene.add(dLight1);

        const dLight2 = new THREE.DirectionalLight(0x60a5fa, 0.8);
        dLight2.position.set(-2, -1, -2);
        modScene.add(dLight2);

        // Построение детальной 3D модели модуля P4-N 320x160x11 мм
        buildSingleModuleModel();
        modControls.update();
        modRenderer.render(modScene, modCamera);

        // Анимационный цикл инспектора
        function animateMod() {
            if (moduleInspectorActive) {
                requestAnimationFrame(animateMod);
                modControls.update();
                modRenderer.render(modScene, modCamera);
            }
        }
        animateMod();
    } else {
        modRenderer.setSize(width, height);
        modCamera.aspect = width / height;
        modCamera.updateProjectionMatrix();
    }

    updateSingleModuleMagnets(cfg.magnetsPerMod || 4);
}

function buildSingleModuleModel() {
    singleModuleGroup = new THREE.Group();
    singleModuleGroup.name = 'singleP4NModule';

    const mW = 0.3194; // 320 мм номинал
    const mH = 0.1594; // 160 мм номинал

    // Генерация текстуры пиксельной сетки светодиодов SMD1921 (80x40 px)
    const ledCv = document.createElement('canvas');
    ledCv.width = 512;
    ledCv.height = 256;
    const ctx = ledCv.getContext('2d');
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, 512, 256);

    // Рисуем сетку светодиодов P4
    const cols = 40;
    const rows = 20;
    const dx = 512 / cols;
    const dy = 256 / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = (c + 0.5) * dx;
            const cy = (r + 0.5) * dy;
            // Корпус SMD
            ctx.fillStyle = '#161a22';
            ctx.fillRect(cx - 3, cy - 3, 6, 6);
            // Светящаяся линза LED
            const isRed = (c + r) % 3 === 0;
            const isGold = (c + r) % 5 === 0;
            ctx.fillStyle = isRed ? '#ef4444' : (isGold ? '#eab308' : '#22c55e');
            ctx.beginPath();
            ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Маркировка модели
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('SMDLED P4-N 320×160 SILICONE', 30, 235);

    const ledTex = new THREE.CanvasTexture(ledCv);
    ledTex.colorSpace = THREE.SRGBColorSpace;

    // 1. Лицевая сторона: силиконовая маска со светодиодами
    const faceGeo = new THREE.BoxGeometry(mW, mH, 0.003);
    const faceMat = new THREE.MeshStandardMaterial({
        map: ledTex,
        roughness: 0.35,
        metalness: 0.20,
        emissive: 0xffffff,
        emissiveMap: ledTex,
        emissiveIntensity: 0.45,
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.z = 0.004;
    singleModuleGroup.add(faceMesh);

    // 2. Силиконовый эластичный тыльный корпус (морозостойкий силикон 70 Shore A)
    const baseGeo = new THREE.BoxGeometry(mW - 0.004, mH - 0.004, 0.008);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x242c38,
        roughness: 0.65,
        metalness: 0.15,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.z = -0.0015;
    singleModuleGroup.add(baseMesh);

    // 10 вертикальных гибких сегментов с компенсаторами изгиба (шаг 29 мм)
    const ribGeo = new THREE.BoxGeometry(0.0035, mH - 0.006, 0.0045);
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x181f2a, roughness: 0.85 });
    for (let g = -4; g <= 4; g++) {
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(g * 0.029, 0, -0.005);
        singleModuleGroup.add(rib);
    }

    // Разъёмы на тыле (HUB75 вход, HUB75 выход и 5V DC)
    const hubBoxGeo = new THREE.BoxGeometry(0.026, 0.015, 0.008);
    const hubBoxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.2 });
    const hubIn = new THREE.Mesh(hubBoxGeo, hubBoxMat);
    hubIn.position.set(-0.065, 0, -0.006);
    singleModuleGroup.add(hubIn);

    const hubOut = new THREE.Mesh(hubBoxGeo, hubBoxMat);
    hubOut.position.set(0.065, 0, -0.006);
    singleModuleGroup.add(hubOut);

    const pwrGeo = new THREE.BoxGeometry(0.020, 0.014, 0.008);
    const pwrMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const pwr = new THREE.Mesh(pwrGeo, pwrMat);
    pwr.position.set(0, 0, -0.006);
    singleModuleGroup.add(pwr);

    // 3. Латунные глухие втулки М4
    const bushingGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.003, 14);
    bushingGeo.rotateX(Math.PI / 2);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.20 });

    // 4. Неодимовые магнитные стойки ⌀12 мм × вылет 9.0 мм
    const studBodyGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.009, 20);
    studBodyGeo.rotateX(Math.PI / 2);
    const studBodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.98,
        roughness: 0.08,
    });

    const threadGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.004, 12);
    threadGeo.rotateX(Math.PI / 2);

    singleModMagnets = [];

    // Отверстия по заводскому чертежу: 4 по X (-135, -45, +45, +135 мм), 2 по Y (+76 мм, -76 мм)
    const xCols = [-0.135, -0.045, 0.045, 0.135];
    const yRows = [0.076, -0.076];

    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
            const x = xCols[c];
            const y = yRows[r];

            // Латунная втулка М4
            const bsh = new THREE.Mesh(bushingGeo, brassMat);
            bsh.position.set(x, y, -0.0055);
            singleModuleGroup.add(bsh);

            // Магнитная стойка
            const studGroup = new THREE.Group();
            studGroup.name = `stud_${r}_${c}`;

            const mBody = new THREE.Mesh(studBodyGeo, studBodyMat);
            mBody.position.z = -0.010; // вылет тела магнита 9 мм
            studGroup.add(mBody);

            const mThrd = new THREE.Mesh(threadGeo, brassMat);
            mThrd.position.z = -0.0035;
            studGroup.add(mThrd);

            studGroup.position.set(x, y, 0);
            studGroup.userData = { isCorner: (c === 0 || c === 3) };

            singleModMagnets.push(studGroup);
            singleModuleGroup.add(studGroup);
        }
    }

    // 5. Стальные направляющие полосы каркаса (Ст3, 2.0 мм, вылет 9.0 мм)
    singleModStrips = new THREE.Group();
    singleModStrips.name = 'previewSteelStrips';

    const stripMat = new THREE.MeshStandardMaterial({
        color: 0xa8b4c4,
        metalness: 0.95,
        roughness: 0.20,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
    });

    const stripTopGeo = new THREE.BoxGeometry(mW + 0.040, 0.030, 0.002);
    const stripTop = new THREE.Mesh(stripTopGeo, stripMat);
    stripTop.position.set(0, 0.076, -0.0155);
    singleModStrips.add(stripTop);

    const stripBotGeo = new THREE.BoxGeometry(mW + 0.040, 0.030, 0.002);
    const stripBot = new THREE.Mesh(stripBotGeo, stripMat);
    stripBot.position.set(0, -0.076, -0.0155);
    singleModStrips.add(stripBot);

    singleModStrips.visible = false;
    singleModuleGroup.add(singleModStrips);

    modScene.add(singleModuleGroup);
}
function updateSingleModuleMagnets(count) {
    if (!singleModMagnets || singleModMagnets.length === 0) return;

    singleModMagnets.forEach(stud => {
        if (count === 4) {
            stud.visible = Boolean(stud.userData && stud.userData.isCorner);
        } else {
            stud.visible = true;
        }
    });

    const insp4 = document.getElementById('btn-inspect-mag4');
    const insp8 = document.getElementById('btn-inspect-mag8');
    if (insp4) insp4.classList.toggle('active', count === 4);
    if (insp8) insp8.classList.toggle('active', count === 8);
}

// 11. ПОДКЛЮЧЕНИЕ ЭЛЕМЕНТОВ ИНТЕРФЕЙСА (UI & МОДАЛЬНОЕ ОКНО)
// ==========================================================================
function setupUI() {

    // Управление конфигурацией магнитов (4 шт. vs 8 шт. на модуль)
    const btnMag4 = document.getElementById('btn-mag-4');
    if (btnMag4) btnMag4.addEventListener('click', () => setMagnetsPerMod(4));

    const btnMag8 = document.getElementById('btn-mag-8');
    if (btnMag8) btnMag8.addEventListener('click', () => setMagnetsPerMod(8));

    // Инспектор модуля крупным планом
    const btnOpenInspector = document.getElementById('btn-open-module-inspector');
    if (btnOpenInspector) btnOpenInspector.addEventListener('click', openModuleInspector);

    const btnCloseInspector = document.getElementById('btn-close-module-inspector');
    if (btnCloseInspector) btnCloseInspector.addEventListener('click', closeModuleInspector);

    const btnCloseInspAction = document.getElementById('btn-close-module-inspector-action');
    if (btnCloseInspAction) btnCloseInspAction.addEventListener('click', closeModuleInspector);

    const btnInspMag4 = document.getElementById('btn-inspect-mag4');
    if (btnInspMag4) btnInspMag4.addEventListener('click', () => setMagnetsPerMod(4));

    const btnInspMag8 = document.getElementById('btn-inspect-mag8');
    if (btnInspMag8) btnInspMag8.addEventListener('click', () => setMagnetsPerMod(8));

    // Быстрые ракурсы инспектора модуля
    const btnModFront = document.getElementById('btn-modview-front');
    if (btnModFront) {
        btnModFront.addEventListener('click', () => {
            if (modCamera && modControls) {
                modCamera.position.set(0, 0, 0.46);
                modControls.target.set(0, 0, 0);
                modControls.update();
            }
            btnModFront.classList.add('active');
            const bB = document.getElementById('btn-modview-back');
            if (bB) bB.classList.remove('active');
        });
    }

    const btnModBack = document.getElementById('btn-modview-back');
    if (btnModBack) {
        btnModBack.addEventListener('click', () => {
            if (modCamera && modControls) {
                modCamera.position.set(0.10, 0.06, -0.38);
                modControls.target.set(0, 0, 0);
                modControls.update();
            }
            btnModBack.classList.add('active');
            const bF = document.getElementById('btn-modview-front');
            if (bF) bF.classList.remove('active');
        });
    }

    const btnModStrip = document.getElementById('btn-modview-strip');
    if (btnModStrip) {
        btnModStrip.addEventListener('click', () => {
            if (singleModStrips) {
                singleModStrips.visible = !singleModStrips.visible;
                btnModStrip.classList.toggle('active', singleModStrips.visible);
                showToast(`🧲 Примерка стальных полос Ст3 к магнитам: ${singleModStrips.visible ? 'ВКЛ' : 'ВЫКЛ'}`);
            }
        });
    }

    // Переключение режимов: Экран в сборе / Рентген / Чистый каркас / Только электрика
    const modeBtnMap = {
        'btn-mode-assembled': 'assembled',
        'btn-mode-xray': 'xray',
        'btn-mode-bare-frame': 'bareFrame',
        'btn-mode-electronics': 'electronics',
    };
    Object.entries(modeBtnMap).forEach(([btnId, modeKey]) => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', () => setDisplayMode(modeKey));
    });

    // Панель управления (кнопка скрытия)
    const btnCollapse = document.getElementById('btn-collapse');
    if (btnCollapse) {
        btnCollapse.addEventListener('click', () => togglePanel(true));
    }

    // МОДАЛЬНОЕ ОКНО ТЕХПАСПОРТА
    const modalPassport = document.getElementById('modal-passport');
    const btnOpenPassport = document.getElementById('btn-open-passport');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnModalCloseAction = document.getElementById('btn-modal-close-action');

    const openModal = () => {
        modalPassport.classList.add('open');
    };
    const closeModal = () => {
        modalPassport.classList.remove('open');
    };

    btnOpenPassport.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnModalCloseAction.addEventListener('click', closeModal);
    modalPassport.addEventListener('click', e => {
        if (e.target === modalPassport) closeModal();
    });

    // Переключение вкладок в модальном окне
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const pane = document.getElementById(targetId);
            if (pane) pane.classList.add('active');
        });
    });

    // ПЕЧАТЬ / СКАЧИВАНИЕ PDF ОТЧЁТА
    const printReport = () => {
        generatePrintReport();
    };
    const bPrint = document.getElementById('btn-print-report');
    if (bPrint) bPrint.addEventListener('click', printReport);
    const bModalPrint = document.getElementById('btn-modal-print');
    if (bModalPrint) bModalPrint.addEventListener('click', printReport);

    // Пресеты времени суток (День / Сумерки / Ночь)
    ['day', 'dusk', 'night'].forEach(p => {
        const btn = document.getElementById(`btn-env-${p}`);
        if (btn) btn.addEventListener('click', () => applyEnvironment(p));
    });

    ['cad', 'photo'].forEach(p => {
        const btn = document.getElementById(`btn-env-${p}`);
        if (btn) btn.addEventListener('click', () => applyEnvironment(p));
    });

    // Загрузка пользовательского фото площадки
    const btnUploadBg = document.getElementById('btn-upload-bg');
    const fileBg = document.getElementById('file-bg');
    if (btnUploadBg && fileBg) {
        btnUploadBg.addEventListener('click', () => fileBg.click());
        fileBg.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    const tex = new THREE.Texture(img);
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.needsUpdate = true;
                    customPhotoTexture = tex;
                    applyEnvironment('photo');
                    showToast('🏙️ Пользовательское фото площадки загружено!');
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Управление взрыв-схемой (Exploded View)
    const slExplode = document.getElementById('sl-explode');
    if (slExplode) {
        slExplode.addEventListener('input', (e) => {
            targetExplosion = currentExplosion = (+e.target.value) / 100;
            applyExplosion(currentExplosion);
        });
    }
    const expMap = {
        'btn-exp-0': 0.0,
        'btn-exp-50': 0.5,
        'btn-exp-100': 1.0,
    };
    Object.entries(expMap).forEach(([id, val]) => {
        const b = document.getElementById(id);
        if (b) {
            b.addEventListener('click', () => {
                targetExplosion = val;
            });
        }
    });

    // Запуск и остановка кинематографического тура
    const btnTour = document.getElementById('btn-tour');
    if (btnTour) btnTour.addEventListener('click', startTour);

    const btnTourStop = document.getElementById('btn-tour-stop');
    if (btnTourStop) btnTourStop.addEventListener('click', stopTour);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tourActive) stopTour();
    });

    renderer.domElement.addEventListener('pointerdown', () => {
        if (tourActive) stopTour();
    });

    // Цвет металла
    ['silver', 'graphite', 'gold'].forEach(col => {
        const btn = document.getElementById(`btn-pipe-${col}`);
        if (btn) {
            btn.addEventListener('click', () => {
                ['silver', 'graphite', 'gold'].forEach(c => {
                    document.getElementById(`btn-pipe-${c}`).classList.remove('active');
                });
                btn.classList.add('active');
                cfg.pipeColor = col;
                updatePipeMaterial();
                rebuildTree();
                setupCalloutsDOM();
            });
        }
    });

    // Бегущая строка
    const inputTxt = document.getElementById('input-text');
    const btnApply = document.getElementById('btn-apply-text');
    const applyText = () => {
        const val = inputTxt.value.trim();
        if (val) {
            cfg.customText = val;
            textTexture = generateTextTexture(val);
            if (ledMaterial && cfg.renderMode === 'render') {
                ledMaterial.map = textTexture;
                ledMaterial.emissiveMap = textTexture;
                ledMaterial.needsUpdate = true;
            }
            waveTextTexture = generateWaveScreenTexture(val);
            if (waveScreenMesh && Array.isArray(waveScreenMesh.material) && cfg.renderMode === 'render') {
                waveScreenMesh.material[0].map = waveTextTexture;
                waveScreenMesh.material[0].emissiveMap = waveTextTexture;
                waveScreenMesh.material[0].needsUpdate = true;
            }
            showToast('✅ Текст бегущей строки обновлен!');
        }
    };
    btnApply.addEventListener('click', applyText);
    inputTxt.addEventListener('keydown', e => { if (e.key === 'Enter') applyText(); });

    bindSlider('sl-speed', 'val-speed', v => `${(+v).toFixed(1)}x`, v => { cfg.scrollSpeed = +v; });

    // Режим отображения
    const btnModeRender = document.getElementById('btn-mode-render');
    const btnModeGrid   = document.getElementById('btn-mode-grid');

    btnModeRender.addEventListener('click', () => {
        cfg.renderMode = 'render';
        btnModeRender.classList.add('active');
        btnModeGrid.classList.remove('active');
        rebuildTree();
    });
    btnModeGrid.addEventListener('click', () => {
        cfg.renderMode = 'grid';
        btnModeGrid.classList.add('active');
        btnModeRender.classList.remove('active');
        rebuildTree();
    });

    // Слайдеры геометрии и CAD-параметрики
    bindSlider('sl-depth',     'val-depth',     v => `${v} мм`,                v => { cfg.ribbonDepth = +v / 1000; updateVentClearanceUI(+v); });
    bindSlider('sl-height',    'val-height',    v => `${(+v).toFixed(1)} м`,    v => { cfg.height = +v; });
    bindSlider('sl-base',      'val-base',      v => `${(+v).toFixed(1)} м`,    v => { cfg.baseDiameter = +v; });
    bindSlider('sl-top',       'val-top',       v => `${(+v).toFixed(2)} м`,    v => { cfg.topDiameter = +v; });
    bindSlider('sl-turns',     'val-turns',     v => (+v).toFixed(1),           v => { cfg.turns = +v; });
    bindSlider('sl-ribbon',    'val-ribbon',    v => `${v} мм (${Math.round(v/160)} ряда)`, v => { cfg.ribbonWidth = +v / 1000; });
    bindSlider('sl-clearance', 'val-clearance', v => `${Math.round(+v * 100)} см`, v => { cfg.baseClearance = +v; });

    // Кнопка быстрого сброса параметров к базовому стандарту
    const btnResetParams = document.getElementById('btn-reset-params');
    if (btnResetParams) {
        btnResetParams.addEventListener('click', () => {
            cfg.ribbonDepth = 0.13;
            cfg.height = 4.0;
            cfg.turns = 5.2;
            cfg.baseDiameter = 2.4;
            cfg.topDiameter = 0.52;
            cfg.ribbonWidth = 0.32;
            cfg.baseClearance = 0.16;

            const syncSl = (id, val, textId, textVal) => {
                const el = document.getElementById(id);
                if (el) el.value = val;
                const tEl = document.getElementById(textId);
                if (tEl) tEl.textContent = textVal;
            };
            syncSl('sl-depth', 130, 'val-depth', '130 мм');
            syncSl('sl-height', 4.0, 'val-height', '4.0 м');
            syncSl('sl-turns', 5.2, 'val-turns', '5.2');
            syncSl('sl-base', 2.4, 'val-base', '2.4 м');
            syncSl('sl-top', 0.52, 'val-top', '0.52 м');
            syncSl('sl-ribbon', 320, 'val-ribbon', '320 мм (2 ряда)');
            syncSl('sl-clearance', 0.16, 'val-clearance', '16 см');
            updateVentClearanceUI(130);

            rebuildTree();
            setupCalloutsDOM();
            showToast('↺ Параметры елки сброшены к базовому стандарту (130 мм / 4.0 м)');
        });
    }

    // Слушатели фасадной волновой ленты (Пространственный 3D арт-объект)
    const onWaveRibbonChange = () => {
        buildFacadeGroup();
    };

    // Пресеты формы: 🌟 3D Волна (Концепт) vs 🎗️ Скульптура (Петля)
    const setWavePreset = (preset) => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.preset = preset;

        ['btn-wave-preset-spatial', 'btn-wave-preset-loop'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.classList.remove('active');
        });
        const activeBtn = document.getElementById(`btn-wave-preset-${preset}`);
        if (activeBtn) activeBtn.classList.add('active');

        onWaveRibbonChange();
        showToast(preset === 'loop' 
            ? '🎗️ Пресет: «Скульптурная петля» (По реальному объекту «Спасибо Докторам!»)' 
            : '🌟 Пресет: «Пространственная 3D волна» (Концепт св. Владимира)');
    };

    const bWavePresetSpatial = document.getElementById('btn-wave-preset-spatial');
    if (bWavePresetSpatial) bWavePresetSpatial.addEventListener('click', () => setWavePreset('spatial'));

    const bWavePresetLoop = document.getElementById('btn-wave-preset-loop');
    if (bWavePresetLoop) bWavePresetLoop.addEventListener('click', () => setWavePreset('loop'));

    // Режимы: 3D Рендер | Раскладка модулей | Металлокаркас
    const setWaveMode = (mode) => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.viewMode = mode;

        ['btn-wave-mode-render', 'btn-wave-mode-modules', 'btn-wave-mode-subframe'].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.classList.remove('active');
        });
        const activeBtn = document.getElementById(`btn-wave-mode-${mode}`);
        if (activeBtn) activeBtn.classList.add('active');

        onWaveRibbonChange();
        const toastMap = {
            render: '🌟 Режим: «Праздничный 3D рендер» (Рубиновый шелк и LED-свечение)',
            modules: '🧩 Режим: «Инженерная раскладка 51 модуля P4-N (17×3)»',
            subframe: '⚙️ Режим: «Несущий металлокаркас из профильной трубы»'
        };
        showToast(toastMap[mode] || mode);
    };

    const bWaveRender = document.getElementById('btn-wave-mode-render');
    if (bWaveRender) bWaveRender.addEventListener('click', () => setWaveMode('render'));

    const bWaveModules = document.getElementById('btn-wave-mode-modules');
    if (bWaveModules) bWaveModules.addEventListener('click', () => setWaveMode('modules'));

    const bWaveSubframe = document.getElementById('btn-wave-mode-subframe');
    if (bWaveSubframe) bWaveSubframe.addEventListener('click', () => setWaveMode('subframe'));

    // Слайдеры пространственного 3D рельефа
    bindSlider('sl-wave-depth', 'val-wave-depth', v => `${(+v).toFixed(2)} м (вынос в 3D)`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.depthWave = +v;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-twist', 'val-wave-twist', v => `${(+v).toFixed(1)}x`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.twist = +v;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-crest', 'val-wave-crest', v => `${(+v).toFixed(2)} м (купол)`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.crestHeight = +v;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-cradle', 'val-wave-cradle', v => `${(+v).toFixed(2)} м (чаша)`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.cradleHeight = +v;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-h', 'val-wave-h', v => `${v} мм (${Math.round(+v / 160)} ряда)`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.height = +v / 1000;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-y', 'val-wave-y', v => `${(+v >= 0 ? '+' : '')}${(+v).toFixed(2)} м`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.elevationY = +v;
        onWaveRibbonChange();
    });

    bindSlider('sl-wave-x', 'val-wave-x', v => `${(+v >= 0 ? '+' : '')}${(+v).toFixed(2)} м`, v => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.offsetX = +v;
        onWaveRibbonChange();
    });

    // Тумблер опорных стоек-пилонов
    bindToggle('btn-toggle-wave-pillars', () => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.showPillars = !cfg.waveRibbon.showPillars;
        const b = document.getElementById('btn-toggle-wave-pillars');
        if (b) {
            b.classList.toggle('active', cfg.waveRibbon.showPillars);
            b.textContent = `🏛️ Опорные стойки: ${cfg.waveRibbon.showPillars ? 'ВКЛ' : 'ВЫКЛ'}`;
        }
        if (wavePillarsGroup) wavePillarsGroup.visible = Boolean(cfg.waveRibbon.showPillars);
        showToast(`🏛️ Опорные стойки к земле: ${cfg.waveRibbon.showPillars ? 'ВКЛ' : 'ВЫКЛ'}`);
    });

    // Текст фасадной волновой ленты
    const inputWaveTxt = document.getElementById('input-wave-text');
    const btnApplyWaveTxt = document.getElementById('btn-apply-wave-text');
    const applyWaveTxt = (txt) => {
        const val = (txt || (inputWaveTxt && inputWaveTxt.value) || '').trim();
        if (val) {
            if (!cfg.waveRibbon) cfg.waveRibbon = {};
            cfg.waveRibbon.text = val;
            if (inputWaveTxt) inputWaveTxt.value = val;
            buildFacadeGroup();
            showToast(`🏢 Текст фасадной ленты: «${val.slice(0, 24)}...»`);
        }
    };
    if (btnApplyWaveTxt) btnApplyWaveTxt.addEventListener('click', () => applyWaveTxt());
    if (inputWaveTxt) inputWaveTxt.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyWaveTxt(); });

    const btnPresetNY = document.getElementById('btn-text-preset-ny');
    if (btnPresetNY) btnPresetNY.addEventListener('click', () => applyWaveTxt('С Новым 2027 годом!'));
    const btnPresetHealth = document.getElementById('btn-text-preset-health');
    if (btnPresetHealth) btnPresetHealth.addEventListener('click', () => applyWaveTxt('ВСЕМ ЗДОРОВЬЯ!'));

    // Тумблеры чертёжных размеров на стене
    bindToggle('btn-toggle-wall-dims', () => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.showWallDims = !cfg.waveRibbon.showWallDims;
        const b = document.getElementById('btn-toggle-wall-dims');
        if (b) b.textContent = `📐 Размеры DWG: ${cfg.waveRibbon.showWallDims ? 'ВКЛ' : 'ВЫКЛ'}`;
        if (wallDimsGroup) wallDimsGroup.visible = Boolean(cfg.waveRibbon.showWallDims);
    });

    bindToggle('btn-toggle-wave-grid', () => {
        if (!cfg.waveRibbon) cfg.waveRibbon = {};
        cfg.waveRibbon.showGrid = !cfg.waveRibbon.showGrid;
        const b = document.getElementById('btn-toggle-wave-grid');
        if (b) b.textContent = `🟦 Сетка 4410×1820: ${cfg.waveRibbon.showGrid ? 'ВКЛ' : 'ВЫКЛ'}`;
        if (waveGridGroup) waveGridGroup.visible = Boolean(cfg.waveRibbon.showGrid);
    });

    // Тумблеры конструктива
    bindToggle('btn-toggle-callouts', () => {
        cfg.showCallouts = !cfg.showCallouts;
        document.getElementById('btn-toggle-callouts').textContent = `🏷️ 3D Выноски: ${cfg.showCallouts ? 'ВКЛ' : 'ВЫКЛ'}`;
    });
    bindToggle('btn-toggle-dims', () => {
        cfg.showDims = !cfg.showDims;
        document.getElementById('btn-toggle-dims').textContent = `📐 3D Размеры: ${cfg.showDims ? 'ВКЛ' : 'ВЫКЛ'}`;
        rebuildDimensions();
    });
    bindToggle('btn-toggle-struts', () => {
        cfg.showStruts = !cfg.showStruts;
        document.getElementById('btn-toggle-struts').textContent = `Кронштейны: ${cfg.showStruts ? 'ВКЛ' : 'ВЫКЛ'}`;
        rebuildTree();
    });
    bindToggle('btn-toggle-caps', () => {
        cfg.showCaps = !cfg.showCaps;
        document.getElementById('btn-toggle-caps').textContent = `Заглушки: ${cfg.showCaps ? 'ВКЛ' : 'ВЫКЛ'}`;
        rebuildTree();
    });
    bindToggle('btn-toggle-fasteners', () => {
        cfg.showMagnets = !cfg.showMagnets;
        const b = document.getElementById('btn-toggle-fasteners');
        if (b) {
            b.textContent = `🧲 Магниты и полосы: ${cfg.showMagnets ? 'ВКЛ' : 'ВЫКЛ'}`;
            b.classList.toggle('active', cfg.showMagnets);
        }
        if (magnetsGroup) magnetsGroup.visible = Boolean(cfg.showMagnets);
        if (magneticStripsGroup) magneticStripsGroup.visible = Boolean(cfg.showMagnets);
        showToast(`🧲 Магнитные стойки 9 мм и стальные полосы каркаса: ${cfg.showMagnets ? 'ВКЛ' : 'ВЫКЛ'}`);
    });

    const btnOpenKmd = document.getElementById('btn-open-kmd');
    if (btnOpenKmd) {
        btnOpenKmd.addEventListener('click', () => {
            const modal = document.getElementById('modal-passport');
            if (modal) modal.classList.add('open');
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-kmd');
            });
            document.querySelectorAll('.tab-pane').forEach(p => {
                p.classList.toggle('active', p.id === 'tab-kmd');
            });
            showToast('🧲 Открыта спецификация магнитной системы (стойки 9 мм) и стальных полос');
        });
    }
    bindToggle('btn-toggle-star', () => {
        cfg.showStar = !cfg.showStar;
        document.getElementById('btn-toggle-star').textContent = `Верхушка: ${cfg.showStar ? 'ВКЛ' : 'ВЫКЛ'}`;
        rebuildTree();
    });
    bindToggle('btn-toggle-snow', () => {
        cfg.showSnow = !cfg.showSnow;
        document.getElementById('btn-toggle-snow').textContent = `Снегопад: ${cfg.showSnow ? 'ВКЛ' : 'ВЫКЛ'}`;
        if (snowParticles) snowParticles.visible = cfg.showSnow;
    });

        // Управление скрытием левой панели

    const btnShow = document.getElementById('btn-show-panel');
    if (btnShow) btnShow.addEventListener('click', () => togglePanel(false));

    window.addEventListener('keydown', (e) => {
        const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
            togglePanel();
        }
        if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
            setDisplayMode(cfg.showBareFrame ? 'assembled' : 'bareFrame');
        }
    });

    // Переключение режимов ансамбля
    ['tree', 'all', 'facade'].forEach(m => {
        const b = document.getElementById(`btn-ens-${m}`);
        if (b) b.addEventListener('click', () => setEnsembleMode(m));
    });

    // Быстрые кнопки фокусировки камеры
    const camFocusMap = {
        'btn-focus-tree': 'tree',
        'btn-focus-wave': 'wave',
        'btn-focus-all': 'all',
    };
    Object.entries(camFocusMap).forEach(([id, target]) => {
        const b = document.getElementById(id);
        if (b) b.addEventListener('click', () => focusCamera(target));
    });

    bindToggle('btn-toggle-facade', () => {
        showFacade = !showFacade;
        document.getElementById('btn-toggle-facade').textContent = `🏢 Фасад и волна: ${showFacade ? 'ВКЛ' : 'ВЫКЛ'}`;
        if (facadeGroup) facadeGroup.visible = showFacade && ensembleMode !== 'tree';
    });

    // Ракурсы камеры
    ['btn-front', 'btn-side', 'btn-rear', 'btn-top', 'btn-free'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                ['btn-front', 'btn-side', 'btn-rear', 'btn-top', 'btn-free'].forEach(b => {
                    document.getElementById(b).classList.remove('active');
                });
                btn.classList.add('active');
                setCameraPreset(id.replace('btn-', ''));
            });
        }
    });

    // Скриншот и спецификация
    document.getElementById('btn-screenshot').addEventListener('click', takeScreenshot);
    document.getElementById('btn-export').addEventListener('click', exportSpecs);
}

function bindSlider(sliderId, valId, fmt, setter) {
    const sl  = document.getElementById(sliderId);
    const val = document.getElementById(valId);
    if (!sl || !val) return;
    sl.addEventListener('input', () => {
        val.textContent = fmt(sl.value);
        setter(sl.value);
        rebuildTree();
        setupCalloutsDOM();
    });
}

function bindToggle(btnId, onClick) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        onClick();
        btn.classList.toggle('active');
    });
}

// ==========================================================================
// 12. ОБНОВЛЕНИЕ ИНФОРМАЦИОННОЙ ПАНЕЛИ
// ==========================================================================
// Функция динамической индикации вентиляционного зазора в коробе
function updateVentClearanceUI(depthMM) {
    const box = document.getElementById('box-vent-clearance');
    const valEl = document.getElementById('val-vent-clearance');
    const clearance = depthMM - 50; // 11 мм модуль + 9 мм стойка магнита + 28 мм БП + 2 мм стенка
    if (!box || !valEl) return;
    if (clearance >= 70) {
        box.style.background = 'rgba(34, 197, 94, 0.12)';
        box.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        box.style.color = '#4ade80';
        valEl.innerHTML = `${clearance} мм (Идеальная конвекция)`;
    } else if (clearance >= 50) {
        box.style.background = 'rgba(245, 158, 11, 0.12)';
        box.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        box.style.color = '#fbbf24';
        valEl.innerHTML = `${clearance} мм (Умеренный, допустимо)`;
    } else {
        box.style.background = 'rgba(239, 68, 68, 0.12)';
        box.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        box.style.color = '#f87171';
        valEl.innerHTML = `${clearance} мм (Критично мало для БП 28 мм!)`;
    }
}

function updateInfoPanel(stats) {
    const $ = id => document.getElementById(id);

    if ($('info-length')) $('info-length').textContent  = stats.arcLength.toFixed(1) + ' м';
    if ($('info-modules')) $('info-modules').textContent = `${stats.totalModules} шт (${stats.modsAlong}×${stats.modsAcross})`;
    if ($('info-res')) $('info-res').textContent     = `${stats.modsAlong * 80} × ${stats.modsAcross * 40} px`;

    // Расчёт мощности
    const peakKW = ((stats.totalModules * 35) / 1000).toFixed(1);
    const avgKW  = ((stats.totalModules * 15.7) / 1000).toFixed(1);
    if ($('info-power')) $('info-power').textContent   = `${peakKW} кВт (${avgKW} ср.)`;

    const psuCount = Math.max(4, Math.ceil(stats.totalModules / 6));
    if ($('info-psu')) $('info-psu').textContent     = `${psuCount} шт. (5V 40A)`;

    const cardCount = Math.max(2, Math.ceil(stats.totalModules / 24));
    if ($('info-novastar')) $('info-novastar').textContent = `${cardCount} шт. (MRV416-N)`;

    const magCount = stats.totalModules * (cfg.magnetsPerMod || 4);
    const pullForceKg = Math.round(magCount * 3.0);
    if ($('info-magnets-total')) $('info-magnets-total').textContent = `${magCount} шт. (${pullForceKg} кг)`;

    const stripsLenM = (stats.arcLength * 3).toFixed(1);
    if ($('info-strips-len')) $('info-strips-len').textContent = `${stripsLenM} пог. м (3 шт)`;

    const current220A = ((stats.totalModules * 35) / 220).toFixed(1);
    const breakerA = current220A > 32 ? '50A' : (current220A > 20 ? '32A' : (current220A > 12 ? '25A' : '16A'));
    if ($('info-current-220')) $('info-current-220').textContent = `${current220A} А (Автомат ${breakerA})`;

    const depthMM = Math.round(cfg.ribbonDepth * 1000);
    const clearanceMM = Math.max(0, depthMM - 50);
    if ($('info-clearance')) {
        $('info-clearance').textContent = `${clearanceMM} мм (${clearanceMM >= 70 ? 'Норма' : (clearanceMM >= 50 ? 'Умеренно' : 'Критично')})`;
        $('info-clearance').className = 'info-value ' + (clearanceMM >= 70 ? 'safe' : (clearanceMM >= 50 ? 'warn' : 'danger'));
    }

    const bendEl = $('info-bend');
    const statEl = $('info-status');
    const pillInd = $('pill-indicator');
    const pillTxt = $('pill-text');

    const bendMM = Math.round(stats.minBendRadius * 1000);
    if (bendEl) bendEl.textContent = `${bendMM} мм (R=${(bendMM/1000).toFixed(2)}м)`;

    if (stats.minBendRadius >= 0.25) {
        if (bendEl) bendEl.className = 'info-value safe';
        if (statEl) { statEl.textContent = '✅ Безопасно (≥250 мм)'; statEl.className = 'info-value safe'; }
        if (pillInd) pillInd.className = 'status-indicator safe';
        if (pillTxt) pillTxt.innerHTML = `Изгиб: <strong>${bendMM} мм (Безопасно)</strong> • Модулей: <strong>${stats.totalModules} шт</strong>`;
    } else if (stats.minBendRadius >= 0.18) {
        if (bendEl) bendEl.className = 'info-value warn';
        if (statEl) { statEl.textContent = '⚠️ Предел (180-250 мм)'; statEl.className = 'info-value warn'; }
        if (pillInd) pillInd.className = 'status-indicator warn';
        if (pillTxt) pillTxt.innerHTML = `Изгиб: <strong>${bendMM} мм (Предел)</strong> • Модулей: <strong>${stats.totalModules} шт</strong>`;
    } else {
        if (bendEl) bendEl.className = 'info-value danger';
        if (statEl) { statEl.textContent = '🔴 ОПАСНО (<180 мм)! Модуль сломается'; statEl.className = 'info-value danger'; }
        if (pillInd) pillInd.className = 'status-indicator danger';
        if (pillTxt) pillTxt.innerHTML = `Изгиб: <strong>${bendMM} мм (ОПАСНО!)</strong> • Модуль сломается`;
    }
}

// ==========================================================================
// 12b. ПЕРЕКЛЮЧЕНИЕ РЕЖИМА И СЛОЕВ КАРКАСА (В СБОРЕ / РЕНТГЕН / КАРКАС / ЭЛЕКТРИКА)
function setDisplayMode(mode, showToastMsg = true) {
    cfg.displayMode = mode;
    cfg.showBareFrame = (mode === 'bareFrame');

    const btnAssembled = document.getElementById('btn-mode-assembled');
    const btnXray = document.getElementById('btn-mode-xray');
    const btnBare = document.getElementById('btn-mode-bare-frame');
    const btnElectronics = document.getElementById('btn-mode-electronics');
    const badge = document.getElementById('mode-badge');
    const hint = document.getElementById('mode-hint');

    [btnAssembled, btnXray, btnBare, btnElectronics].forEach(b => {
        if (b) b.classList.remove('active');
    });

    // Сброс базовых свойств материалов
    if (modulesMesh && modulesMesh.material) {
        modulesMesh.visible = true;
        modulesMesh.material.transparent = false;
        modulesMesh.material.opacity = 1.0;
        modulesMesh.material.depthWrite = true;
    }
    if (frameMesh && frameMesh.material) {
        frameMesh.visible = true;
        frameMesh.material.transparent = false;
        frameMesh.material.opacity = 1.0;
        frameMesh.material.depthWrite = true;
    }

    if (mode === 'xray') {
        if (btnXray) btnXray.classList.add('active');
        if (badge) {
            badge.textContent = 'РЕНТГЕН (X-RAY)';
            badge.style.background = 'rgba(168, 85, 247, 0.2)';
            badge.style.color = '#c084fc';
            badge.style.borderColor = 'rgba(168, 85, 247, 0.4)';
        }
        if (hint) {
            hint.innerHTML = '🔮 <strong>Режим Рентген (X-Ray):</strong> внешние модули и короб полупрозрачны (opacity 25%). Насквозь видны блоки питания, карты NovaStar, кабели CAT6 и зазор охлаждения.';
        }

        if (modulesMesh && modulesMesh.material) {
            modulesMesh.visible = true;
            modulesMesh.material.transparent = true;
            modulesMesh.material.opacity = 0.32;
            modulesMesh.material.depthWrite = false;
        }
        if (frameMesh && frameMesh.material) {
            frameMesh.visible = true;
            frameMesh.material.transparent = true;
            frameMesh.material.opacity = 0.20;
            frameMesh.material.depthWrite = false;
        }
        if (magnetsGroup) magnetsGroup.visible = true;
        if (magneticStripsGroup) magneticStripsGroup.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
        if (strutsGroup) strutsGroup.visible = true;

        if (showToastMsg) {
            showToast('🔮 Режим «Рентген (X-Ray)»: видна вся внутренняя компоновка насквозь');
        }
    } else if (mode === 'bareFrame') {
        if (btnBare) btnBare.classList.add('active');
        if (badge) {
            badge.textContent = 'ЧИСТЫЙ КАРКАС';
            badge.style.background = 'rgba(245, 158, 11, 0.2)';
            badge.style.color = '#f59e0b';
            badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
        if (hint) {
            hint.innerHTML = '⚙️ <strong>Чистый каркас:</strong> модули сняты. Отображается алюминиевый короб, 3 стальные полосы Ст3 под магниты, блоки питания, карты NovaStar и силовой столб.';
        }

        if (modulesMesh) modulesMesh.visible = false;
        if (magnetsGroup) magnetsGroup.visible = false;
        if (frameMesh) frameMesh.visible = true;
        if (magneticStripsGroup) magneticStripsGroup.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
        if (strutsGroup) strutsGroup.visible = true;

        if (showToastMsg) {
            showToast('⚙️ Модули сняты: чистый силовой каркас и стальные направляющие полосы Ст3');
        }
    } else if (mode === 'electronics') {
        if (btnElectronics) btnElectronics.classList.add('active');
        if (badge) {
            badge.textContent = 'ТОЛЬКО ЭЛЕКТРИКА';
            badge.style.background = 'rgba(6, 182, 212, 0.2)';
            badge.style.color = '#06b6d4';
            badge.style.borderColor = 'rgba(6, 182, 212, 0.4)';
        }
        if (hint) {
            hint.innerHTML = '⚡ <strong>Только электрика и коммутация:</strong> короб и модули скрыты. В пространстве парят блоки питания 5V 40A, карты NovaStar MRV416-N, кабели CAT6 и магниты.';
        }

        if (modulesMesh) modulesMesh.visible = false;
        if (frameMesh) frameMesh.visible = false;
        if (magnetsGroup) magnetsGroup.visible = true;
        if (magneticStripsGroup) magneticStripsGroup.visible = true;
        if (psuGroup) psuGroup.visible = true;
        if (receivingCardsGroup) receivingCardsGroup.visible = true;
        if (cablesGroup) cablesGroup.visible = true;
        if (strutsGroup) strutsGroup.visible = false;

        if (showToastMsg) {
            showToast('⚡ Режим «Только электрика»: парящие в пространстве БП, карты NovaStar и кабельные шлейфы');
        }
    } else {
        // 'assembled'
        if (btnAssembled) btnAssembled.classList.add('active');
        if (badge) {
            badge.textContent = 'В СБОРЕ';
            badge.style.background = 'rgba(56, 189, 248, 0.2)';
            badge.style.color = '#38bdf8';
            badge.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        }
        if (hint) {
            hint.innerHTML = '🎄 <strong>Экран в сборе:</strong> показаны гибкие уличные модули P4-N 320×160 мм со сплошной бесшовной бегущей строкой.';
        }

        if (modulesMesh) modulesMesh.visible = true;
        if (frameMesh) frameMesh.visible = true;
        if (magnetsGroup) magnetsGroup.visible = currentExplosion > 0.02 || Boolean(cfg.showMagnets);
        if (magneticStripsGroup) magneticStripsGroup.visible = Boolean(cfg.showMagnets);
        if (psuGroup) psuGroup.visible = currentExplosion > 0.02;
        if (receivingCardsGroup) receivingCardsGroup.visible = currentExplosion > 0.02;
        if (cablesGroup) cablesGroup.visible = currentExplosion > 0.03;
        if (strutsGroup) strutsGroup.visible = Boolean(cfg.showStruts);

        if (showToastMsg) {
            showToast('🎄 Экран в сборе: светодиодные модули установлены на каркас');
        }
    }
}

// 13. РАКУРСЫ КАМЕРЫ
// ==========================================================================
function setCameraPreset(name, immediate = false) {
    const h   = cfg.height;
    const d   = cfg.baseDiameter;
    const mid = h * 0.45;

    const presets = {
        front: { pos: [0, mid, d * 2.2],          target: [0, mid, 0] },
        side:  { pos: [d * 2.2, mid, 0],          target: [0, mid, 0] },
        rear:  { pos: [0, mid, -d * 2.2],         target: [0, mid, 0] },
        top:   { pos: [0.01, h * 2.3, 0.01],      target: [0, mid, 0] },
        free:  { pos: [d * 1.5, h * 0.75, d * 1.5], target: [0, mid, 0] },
    };

    const p = presets[name];
    if (!p) return;

    if (immediate) {
        camera.position.set(...p.pos);
        if (controls) {
            controls.target.set(...p.target);
            controls.update();
        }
        camera._targetPos = null;
        camera._lerpT = 1;
    } else {
        camera._targetPos  = new THREE.Vector3(...p.pos);
        camera._targetLook = new THREE.Vector3(...p.target);
        camera._lerpT = 0;
    }
}

// ==========================================================================
// 14. СКРИНШОТ И ГЕНЕРАТОР ОФИЦИАЛЬНОГО PDF-ОТЧЁТА (A4 PRINT)
// ==========================================================================
function takeScreenshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `LED_Elka_3D_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    showToast('📸 Снимок высокого разрешения сохранён!');
}

function generatePrintReport() {
    showToast('⏳ Формирование инженерного PDF отчёта...');

    // 1. Снимок 3D сцены в максимальном разрешении
    renderer.render(scene, camera);
    const imgData = renderer.domElement.toDataURL('image/png', 1.0);

    // 2. Считываем актуальные параметры модели
    const length = document.getElementById('info-length').textContent;
    const modules = document.getElementById('info-modules').textContent;
    const res = document.getElementById('info-res').textContent;
    const bend = document.getElementById('info-bend').textContent;
    const power = document.getElementById('info-power').textContent;
    const psu = document.getElementById('info-psu').textContent;

    // 3. Закрываем модальное окно на экране
    const modalPassport = document.getElementById('modal-passport');
    if (modalPassport) modalPassport.classList.remove('open');

    // 4. Создаем или переиспользуем изолированный скрытый iframe для чистой печати
    let iframe = document.getElementById('print-iframe');
    if (iframe) {
        iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // 5. Формируем презентабельный исполнительный документ A4
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Инженерный паспорт изделия — LED Ёлка св. Владимира</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            font-size: 8.5pt;
            line-height: 1.36;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .page-break {
            page-break-before: always;
        }
        .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5pt solid #1e3a8a;
            padding-bottom: 6pt;
            margin-bottom: 7pt;
        }
        .header-left .brand-tag {
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.10em;
            text-transform: uppercase;
            color: #2563eb;
            margin-bottom: 2pt;
        }
        .header-left h1 {
            font-size: 13pt;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.15;
            letter-spacing: -0.01em;
        }
        .header-left .project-sub {
            font-size: 8pt;
            color: #475569;
            margin-top: 2pt;
        }
        .header-right {
            text-align: right;
            font-size: 7.5pt;
            color: #64748b;
        }
        .header-right .status-badge {
            display: inline-block;
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #10b981;
            padding: 2pt 6pt;
            border-radius: 4pt;
            font-weight: 700;
            font-size: 7.5pt;
            margin-bottom: 3pt;
        }
        
        /* KPI Cards Grid */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6pt;
            margin-bottom: 7pt;
        }
        .kpi-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-top: 2.5pt solid #2563eb;
            border-radius: 5pt;
            padding: 5pt 7pt;
        }
        .kpi-card.accent {
            border-top-color: #059669;
            background: #f0fdf4;
        }
        .kpi-label {
            font-size: 6.8pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .kpi-val {
            font-size: 11pt;
            font-weight: 900;
            color: #0f172a;
            margin-top: 1pt;
            font-feature-settings: "tnum";
        }
        .kpi-sub {
            font-size: 6.6pt;
            color: #475569;
            margin-top: 1pt;
        }

        /* 3D Visual Frame */
        .visual-frame {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6pt;
            padding: 6pt;
            text-align: center;
            margin-bottom: 7pt;
        }
        .visual-frame img {
            width: 100%;
            max-height: 180pt;
            object-fit: contain;
            border-radius: 4pt;
        }
        .visual-caption {
            font-size: 7pt;
            color: #64748b;
            margin-top: 3pt;
            font-style: italic;
        }

        /* Section Headings */
        .sec-title {
            font-size: 9pt;
            font-weight: 800;
            color: #1e3a8a;
            border-left: 3pt solid #2563eb;
            padding-left: 5pt;
            margin-top: 7pt;
            margin-bottom: 4pt;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        /* Tables */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.6pt;
            margin-bottom: 6pt;
        }
        .data-table th, .data-table td {
            border: 0.6pt solid #cbd5e1;
            padding: 3.5pt 5.5pt;
            text-align: left;
            vertical-align: middle;
        }
        .data-table th {
            background: #f1f5f9;
            font-weight: 800;
            color: #1e293b;
            font-size: 7.2pt;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }
        .data-table tr:nth-child(even) td {
            background: #f8fafc;
        }
        .data-table td strong {
            color: #0f172a;
        }

        /* Callout / Conclusion Box */
        .callout-box {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            border-left: 3pt solid #2563eb;
            border-radius: 4pt;
            padding: 5pt 7pt;
            font-size: 7.4pt;
            color: #1e3a8a;
            margin-bottom: 6pt;
            line-height: 1.35;
        }
        .callout-box strong {
            color: #1d4ed8;
            display: block;
            margin-bottom: 2pt;
            font-size: 7.8pt;
        }

        /* Signatures block */
        .sig-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12pt;
            margin-top: 12pt;
            padding-top: 8pt;
            border-top: 1pt solid #cbd5e1;
            page-break-inside: avoid;
        }
        .sig-block {
            font-size: 7.2pt;
            color: #334155;
        }
        .sig-block .role {
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2pt;
        }
        .sig-line {
            border-bottom: 1pt solid #64748b;
            margin-top: 24pt;
            margin-bottom: 3pt;
        }
        .sig-sub {
            font-size: 6.6pt;
            color: #64748b;
            display: flex;
            justify-content: space-between;
        }

        /* Document Footer */
        .doc-footer {
            margin-top: 6pt;
            padding-top: 3pt;
            border-top: 0.5pt solid #e2e8f0;
            font-size: 6.6pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <!-- ==================== СТРАНИЦА 1 ==================== -->
    <div class="header-bar">
        <div class="header-left">
            <div class="brand-tag">СМДЛЕД • Проектно-конструкторский отдел</div>
            <h1>ИНЖЕНЕРНЫЙ ПАСПОРТ И ПАСПОРТ БЕЗОПАСНОСТИ</h1>
            <div class="project-sub">Светодиодная конусная ёлка • Объект: «Экран св. Владимира» (зима 2026–2027)</div>
        </div>
        <div class="header-right">
            <div class="status-badge">✓ СОГЛАСОВАНО К МОНТАЖУ</div>
            <div>Шифр: <strong>СМД-ЕЛКА-2026-П4</strong></div>
            <div>Дата: <strong>${new Date().toLocaleDateString('ru-RU')}</strong></div>
        </div>
    </div>

    <!-- 4 KPI КАРТОЧКИ -->
    <div class="kpi-grid">
        <div class="kpi-card">
            <div class="kpi-label">Высота мачты</div>
            <div class="kpi-val">${cfg.height.toFixed(1)} м</div>
            <div class="kpi-sub">Труба ⌀160 мм (ст. 5 мм)</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Диаметры витков</div>
            <div class="kpi-val">⌀2.4 м → ⌀0.52 м</div>
            <div class="kpi-sub">${cfg.turns.toFixed(1)} витка (сход хомутом)</div>
        </div>
        <div class="kpi-card accent">
            <div class="kpi-label">Радиус верха (R)</div>
            <div class="kpi-val">${Math.round(cfg.topDiameter * 500)} мм</div>
            <div class="kpi-sub">Безопасная зона (норма &gt;200 мм)</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Видеополотно</div>
            <div class="kpi-val">${res}</div>
            <div class="kpi-sub">140 модулей P4-N (22.4 м)</div>
        </div>
    </div>

    <!-- 3D РЕНДЕР ИНСТАЛЛЯЦИИ -->
    <div class="visual-frame">
        <img src="${imgData}" alt="3D CAD Визуализация инсталляции">
        <div class="visual-caption">Рис. 1. Пространственная 3D модель конусной светодиодной конструкции (Three.js CAD Model). Фронтально-аксонометрический вид.</div>
    </div>

    <!-- РАЗДЕЛ 1: КОНСТРУКТИВ И ГЕОМЕТРИЯ -->
    <div class="sec-title">1. Габаритные параметры и геометрический расчёт конструкции</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="28%">Элемент конструкции</th>
                <th width="24%">Параметр / Значение</th>
                <th width="48%">Инженерное обоснование и тех. требования</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Высота несущей мачты</strong></td>
                <td><strong>${cfg.height.toFixed(1)} м</strong></td>
                <td>Стальная труба ⌀160 мм, толщина стенки 5 мм с верхним фланцевым оголовком</td>
            </tr>
            <tr>
                <td><strong>Диаметр основания спирали</strong></td>
                <td><strong>${cfg.baseDiameter.toFixed(1)} м (2400 мм)</strong></td>
                <td>Радиус R = 1200 мм. Угол изгиба 15° на модуль — абсолютно безопасная рабочая зона</td>
            </tr>
            <tr>
                <td><strong>Диаметр верхнего витка</strong></td>
                <td><strong>${cfg.topDiameter.toFixed(2)} м (${Math.round(cfg.topDiameter*1000)} мм)</strong></td>
                <td>Радиус изгиба R = 260 мм. Полная сохранность силиконового корпуса P4-N</td>
            </tr>
            <tr>
                <td><strong>Количество витков</strong></td>
                <td><strong>${cfg.turns.toFixed(1)} витка</strong></td>
                <td>Равномерный шаг подъёма спирали с фиксацией верхнего торца на силовой хомут</td>
            </tr>
            <tr>
                <td><strong>Габариты полотна в сборе</strong></td>
                <td><strong>Ширина 320 мм, короб 130 мм</strong></td>
                <td>2 ряда модулей по 160 мм + неодимовые магнитные стойки + алюминиевый профиль</td>
            </tr>
            <tr>
                <td><strong>Длина развёртки экрана</strong></td>
                <td><strong>${length}</strong></td>
                <td>Сплошная бесшовная лента, составленная из ${modules}</td>
            </tr>
            <tr>
                <td><strong>Зазор снизу от подиума</strong></td>
                <td><strong>${Math.round(cfg.baseClearance * 100)} см (160 мм)</strong></td>
                <td>Технологический отступ для предотвращения скопления сугробов и наледи</td>
            </tr>
            <tr>
                <td><strong>Подиум-основание</strong></td>
                <td><strong>⌀3.1 м, высота 12 см</strong></td>
                <td>Двухъярусная база: цоколь + палуба из берёзовой фанеры со стальным фланцем</td>
            </tr>
        </tbody>
    </table>

    <div class="callout-box">
        <strong>💡 Инженерное заключение по верхнему узлу изгиба:</strong>
        Геометрия верхнего витка спирали рассчитана строго с радиусом R = 260 мм (диаметр 520 мм). Первоначальный эскиз с изломом ленты вплотную к столбу (R ≈ 80–100 мм) категорически отклонён, так как превышал предельный порог модуля P4-N (R_min = 180–200 мм) и приводил к отрыву SMD светодиодов и нарушению гидроизоляции IP65. Решение верифицировано и готово к производству.
    </div>

    <div class="doc-footer">
        <div>Проект: Новогодняя светодиодная ёлка • Экран св. Владимира</div>
        <div>Лист 1 из 2</div>
    </div>

    <!-- ==================== СТРАНИЦА 2 ==================== -->
    <div class="page-break"></div>

    <div class="header-bar" style="margin-top: 4pt;">
        <div class="header-left">
            <div class="brand-tag">СМДЛЕД • Паспорт оборудования и электротехника</div>
            <h1 style="font-size: 11pt;">ТЕХНИЧЕСКИЕ ПАСПОРТНЫЕ ДАННЫЕ И СХЕМА ПИТАНИЯ</h1>
        </div>
        <div class="header-right">
            <div>Шифр: <strong>СМД-ЕЛКА-2026-П4</strong></div>
            <div>Лист: <strong>2 из 2</strong></div>
        </div>
    </div>

    <!-- РАЗДЕЛ 2: ПАСПОРТ МОДУЛЯ P4-N -->
    <div class="sec-title">2. Заводской паспорт гибкого светодиодного модуля P4-N</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="30%">Характеристика оборудования</th>
                <th width="30%">Заводской паспортный параметр</th>
                <th width="40%">Инженерные примечания и допуски</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Производитель и модель</strong></td>
                <td><strong>P4-N 户外软模组 (Версия V4)</strong></td>
                <td>Завод: Shenzhen Jinxinsheng Technology Co., Ltd. (чертёж от 2024-11-01)</td>
            </tr>
            <tr>
                <td><strong>Физические размеры модуля</strong></td>
                <td><strong>319.4 × 159.4 × 11.0 мм</strong></td>
                <td>Допуск +0.4 / −1.0 мм. Номинальный шаг сетки 320 × 160 мм</td>
            </tr>
            <tr>
                <td><strong>Материал гибкого корпуса</strong></td>
                <td><strong>Силиконовый каучук 70° Shore A</strong></td>
                <td>Высокоэластичный морозостойкий компаунд (эксплуатация до −35°C)</td>
            </tr>
            <tr>
                <td><strong>Компенсаторы изгиба</strong></td>
                <td><strong>10 пазов с шагом 29.01 мм</strong></td>
                <td>Трапециевидные компенсаторы. Изгиб СТРОГО по продольной оси 320 мм</td>
            </tr>
            <tr>
                <td><strong>Радиусы изгиба модуля</strong></td>
                <td><strong>R ≥ 250–300 мм (R_min = 180–200 мм)</strong></td>
                <td>В проекте R = 260 мм (запас безопасности над R_min составляет +30%)</td>
            </tr>
            <tr>
                <td><strong>Разрешение модуля / Шаг</strong></td>
                <td><strong>80 × 40 пикселей / Pitch 4.0 мм</strong></td>
                <td>3200 SMD LED на модуль. Контрастная чёрная антибликовая маска</td>
            </tr>
            <tr>
                <td><strong>Драйверы и сканирование</strong></td>
                <td><strong>Chipone 6373 + SM7559 (1/10S)</strong></td>
                <td>ШИМ-драйвер постоянного тока. Частота обновления до 3840 Гц (без мерцания)</td>
            </tr>
            <tr>
                <td><strong>Крепление и кабель-вводы</strong></td>
                <td><strong>18 точек M4 / 3 герметичных колодца</strong></td>
                <td>Неодимовые магниты с цековкой ⌀11.2 мм. Отсеки SIGNAL-IN, POWER, SIGNAL-OUT</td>
            </tr>
            <tr>
                <td><strong>Конфигурационный файл</strong></td>
                <td><code>S4-10S-80X40-6373+7559-JHT软.rcfgx</code></td>
                <td>Полная совместимость с приёмными картами NovaStar MRV412 / MRV208</td>
            </tr>
        </tbody>
    </table>

    <!-- РАЗДЕЛ 3: ЭЛЕКТРОТЕХНИКА И ВИДЕОКОНТЕНТ -->
    <div class="sec-title">3. Электротехнические нагрузки, энергоснабжение и видеоконтент</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="30%">Параметр системы</th>
                <th width="28%">Расчётное значение</th>
                <th width="42%">Требования к монтажу и подключению</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Общее количество модулей</strong></td>
                <td><strong>${modules}</strong></td>
                <td>70 шт. вдоль ленты × 2 шт. по высоте (сплошное бесшовное полотно)</td>
            </tr>
            <tr>
                <td><strong>Суммарная площадь экранов</strong></td>
                <td><strong>7.17 м²</strong></td>
                <td>Длина развёртки 22.4 м × ширина полотна 0.32 м</td>
            </tr>
            <tr>
                <td><strong>Пиковая мощность (100% белый)</strong></td>
                <td><strong>${power.split(' ')[0]} кВт</strong> (35 Вт / модуль)</td>
                <td>Максимальная кратковременная нагрузка при пуске и самодиагностике</td>
            </tr>
            <tr>
                <td><strong>Средняя эксплуатационная мощность</strong></td>
                <td><strong>2.2 кВт</strong> (~15.7 Вт / модуль)</td>
                <td>Штатное потребление в динамическом режиме бегущей строки</td>
            </tr>
            <tr>
                <td><strong>Блоки питания 5V 40A (200W)</strong></td>
                <td><strong>${psu}</strong></td>
                <td>По 6 модулей на 1 БП. Запас мощности 25% для стабильной работы зимой</td>
            </tr>
            <tr>
                <td><strong>Вводной автомат и сеть 220V</strong></td>
                <td><strong>Автомат 25А (1 фаза) / 16А (3 фазы)</strong></td>
                <td>Кабель питания: ВВГнг-FRLS 3 × 4.0 мм² (внутри трубы мачты ⌀160 мм)</td>
            </tr>
            <tr>
                <td><strong>Приёмные карты / Контроллер</strong></td>
                <td><strong>2× NovaStar MRV412 + Taurus TB30</strong></td>
                <td>Автономное расписание, синхронизация по NTP, управление по Wi-Fi/4G/LAN</td>
            </tr>
            <tr>
                <td><strong>Требования к видеоролику</strong></td>
                <td><strong>${res}, 60 fps, 70:1</strong></td>
                <td>Специальная сверхширокая развёртка контента под праздничное оформление</td>
            </tr>
        </tbody>
    </table>

    <!-- РАЗДЕЛ 4: МАГНИТНАЯ СИСТЕМА БЫСТРОГО МОНТАЖА (СТОЙКИ 9 ММ) И КМД КАРКАСА -->
    <div class="sec-title" style="margin-top: 10pt;">4. Магнитная система быстрого монтажа (стойки 9 мм), направляющие полосы каркаса и сервис</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="28%">Технологический узел</th>
                <th width="30%">Инженерный расчёт / Параметр</th>
                <th width="42%">Обязательное производственное требование (КМД)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>Магнитные стойки модулей</strong></td>
                <td><strong>Неодимовые стойки М4 (8 шт. на модуль)</strong></td>
                <td>4 мм резьбы М4 закручивается в глухую латунную втулку модуля. 9 мм цилиндр магнита (⌀12 мм) остаётся снаружи</td>
            </tr>
            <tr>
                <td><strong>Усилие прижима магнитов</strong></td>
                <td><strong>24.0 кг суммарно на 1 модуль P4-N</strong></td>
                <td>8 стоек × 3.0 кг = 24 кг прижима. Вес модуля 0.38 кг, ветер 25 м/с — 2.05 кг. Семикратный запас прочности без внешнего штапика!</td>
            </tr>
            <tr>
                <td><strong>Стальные полосы каркаса</strong></td>
                <td><strong>3 продольные полосы Ст3 (толщина 2 мм)</strong></td>
                <td>Вальцованные полосы по чертежу P4-N (база 152 мм). Сплошные полосы исключают сверление сотен отверстий — модуль садится в любой точке</td>
            </tr>
            <tr>
                <td><strong>Блоки питания 5V 40A внутри</strong></td>
                <td><strong>24 шт. CZCL 200W (толщина 28 мм)</strong></td>
                <td>Устанавливаются внутри короба 130 мм за стальными полосами. Запас глубины 108 мм. Шаг 93 см (1 БП на 3 модуля)</td>
            </tr>
            <tr>
                <td><strong>Переднее обслуживание</strong></td>
                <td><strong>Снятие модуля присоской за 10 секунд</strong></td>
                <td>Замена любого БП прямо с лица через открывшийся проём 320×160 мм без разборки каркаса и без работы в узком зазоре</td>
            </tr>
            <tr>
                <td><strong>Зимняя вентиляция и конденсат</strong></td>
                <td><strong>Естественный обогрев +18°C + дренаж ⌀6 мм</strong></td>
                <td>Тепловыделение БП предотвращает обледенение плат. Дренажные отверстия в нижних точках короба выводят конденсат</td>
            </tr>
        </tbody>
    </table>

    <!-- РАЗДЕЛ 5: БЛОК СОГЛАСОВАНИЯ И ПОДПИСЕЙ -->
    <div class="sec-title" style="margin-top: 10pt;">5. Согласование проектной документации и приёмка в производство</div>
    <div class="sig-container">
        <div class="sig-block">
            <div class="role">ЗАКАЗЧИК ПРОЕКТА</div>
            <div>«Конструктив и дизайн согласован»</div>
            <div class="sig-line"></div>
            <div class="sig-sub">
                <span>/ __________________________ /</span>
                <span>М.П.</span>
            </div>
            <div style="margin-top: 6pt; font-size: 6.8pt; color: #64748b;">«____» ________________ 2026 г.</div>
        </div>
        <div class="sig-block">
            <div class="role">ГЛАВНЫЙ КОНСТРУКТОР</div>
            <div>«Радиусный и силовой расчёт подтверждаю»</div>
            <div class="sig-line"></div>
            <div class="sig-sub">
                <span>/ __________________________ /</span>
                <span>М.П.</span>
            </div>
            <div style="margin-top: 6pt; font-size: 6.8pt; color: #64748b;">«____» ________________ 2026 г.</div>
        </div>
        <div class="sig-block">
            <div class="role">ПРОИЗВОДИТЕЛЬ (СМДЛЕД)</div>
            <div>«Спецификация принята к изготовлению»</div>
            <div class="sig-line"></div>
            <div class="sig-sub">
                <span>/ __________________________ /</span>
                <span>М.П.</span>
            </div>
            <div style="margin-top: 6pt; font-size: 6.8pt; color: #64748b;">«____» ________________ 2026 г.</div>
        </div>
    </div>

    <div class="doc-footer" style="margin-top: 10pt;">
        <div>СМДЛЕД • Проект: Светодиодная ёлка «Экран св. Владимира» • Сезон 2026–2027</div>
        <div>Лист 2 из 2</div>
    </div>
</body>
</html>`;

    // 6. Записываем контент в изолированный iframe
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // 7. Запуск диалога печати / сохранения PDF
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        showToast('📄 Диалог печати / сохранения PDF открыт!');
    }, 450);
}

// ==========================================================================
// 15. ЭКСПОРТ СПЕЦИФИКАЦИИ В БУФЕР ОБМЕНА
// ==========================================================================
function exportSpecs() {
    const statsEl = id => document.getElementById(id).textContent;

    const text = [
        '═══════════════════════════════════════════════',
        '  ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ: Спиральная LED-ёлка',
        '  Объект: Экран св. Владимира, зима 2026-2027',
        '  Модуль: P4-N Уличный Гибкий 320×160 мм (IP65)',
        '═══════════════════════════════════════════════',
        '',
        '── 1. ГЕОМЕТРИЯ И КОНСТРУКТИВ ──',
        `  • Высота столба:             ${cfg.height.toFixed(1)} м (труба ⌀${Math.round(cfg.poleRadius*2000)} мм)`,
        `  • Диаметр основания спирали: ${cfg.baseDiameter.toFixed(1)} м (R = 1200 мм)`,
        `  • Диаметр верхнего витка:    ${cfg.topDiameter.toFixed(2)} м (безопасный R = ${Math.round(cfg.topDiameter*500)} мм)`,
        `  • Количество витков:         ${cfg.turns.toFixed(1)}`,
        `  • Ширина полотна экрана:     ${Math.round(cfg.ribbonWidth * 1000)} мм (2 ряда модулей)`,
        `  • Толщина экрана с каркасом: 130 мм (13 см)`,
        `  • Зазор снизу от подиума:    ${Math.round(cfg.baseClearance * 100)} см`,
        `  • Длина ленты в развёртке:   ${statsEl('info-length')}`,
        '',
        '── 2. РАСЧЁТ МОДУЛЕЙ И ВИДЕОКОНТЕНТА ──',
        `  • Количество модулей P4-N:   ${statsEl('info-modules')}`,
        `  • Разрешение видеоролика:    ${statsEl('info-res')}`,
        `  • Заводской размер модуля:   319.4 × 159.4 × 11.0 мм (силикон 70°)`,
        `  • Мин. радиус изгиба:        ${statsEl('info-bend')}`,
        `  • Статус безопасности:       ${statsEl('info-status')}`,
        '',
        '── 3. ЭЛЕКТРОТЕХНИКА И ПИТАНИЕ ──',
        `  • Потребляемая мощность:     ${statsEl('info-power')}`,
        `  • Блоки питания 5V 40A:      ${statsEl('info-psu')}`,
        `  • Вводной автомат:           25А (1 фаза) / 16А (3 фазы)`,
        `  • Силовой кабель:            ВВГнг-FRLS 3 × 4.0 мм²`,
        `  • Конфиг NovaStar:           S4-10S-80X40-6373+7559-JHT软.rcfgx`,
        '',
        '═══════════════════════════════════════════════',
        `  Сформировано: ${new Date().toLocaleString('ru-RU')}`,
        '═══════════════════════════════════════════════',
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Спецификация скопирована для чата!');
    }).catch(() => {
        showToast('⚠️ Не удалось скопировать в буфер');
    });
}

function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
}

function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

// ==========================================================================
// 16. ГЛАВНЫЙ ЦИКЛ РЕНДЕРА И АНИМАЦИИ
// ==========================================================================
function animate() {
    requestAnimationFrame(animate);

    // Плавная анимация взрыв-схемы
    if (Math.abs(currentExplosion - targetExplosion) > 0.001) {
        currentExplosion += (targetExplosion - currentExplosion) * 0.14;
        if (Math.abs(currentExplosion - targetExplosion) <= 0.001) {
            currentExplosion = targetExplosion;
        }
        applyExplosion(currentExplosion);
    }

    // Кинематографический 4-плановый облёт для презентации
    if (tourActive) {
        const elapsed = (performance.now() - tourStartTime) / 1000;
        const totalDuration = 30.0;
        const shotDuration = 7.5;
        const progress = Math.min(elapsed / totalDuration, 1.0);

        const fill = document.getElementById('tour-progress-fill');
        if (fill) fill.style.width = `${(progress * 100).toFixed(1)}%`;

        const shotIdx = Math.min(Math.floor(elapsed / shotDuration), tourShots.length - 1);
        const shot = tourShots[shotIdx];

        if (shotIdx !== tourShotIndex) {
            tourShotIndex = shotIdx;
            const tEl = document.getElementById('hud-shot-title') || document.getElementById('tour-shot-title');
            const sEl = document.getElementById('hud-shot-sub') || document.getElementById('tour-shot-sub');
            if (tEl) tEl.textContent = shot.title;
            if (sEl) sEl.textContent = shot.sub;

            if (shot.env && shot.env !== cfg.envPreset) {
                applyEnvironment(shot.env);
            }
        }

        const shotT = (elapsed - shotIdx * shotDuration) / shotDuration;
        const smoothT = easeInOutCubic(Math.min(Math.max(shotT, 0), 1));

        camera.position.lerpVectors(shot.startPos, shot.endPos, smoothT);
        controls.target.lerpVectors(shot.startLook, shot.endLook, smoothT);

        if (elapsed >= totalDuration) {
            stopTour();
        }
    } else if (camera._targetPos && camera._lerpT < 1) {
        camera._lerpT = Math.min(camera._lerpT + 0.035, 1);
        const t = easeInOutCubic(camera._lerpT);
        camera.position.lerp(camera._targetPos, t);
        controls.target.lerp(camera._targetLook, t);
        if (camera._lerpT >= 1) camera._targetPos = null;
    }

    if (cfg.scrollSpeed > 0 && cfg.renderMode === 'render') {
        if (textTexture) textTexture.offset.x += 0.0015 * cfg.scrollSpeed;
        // Лента св. Владимира сохраняет архитектурную фиксацию надписей («2027» на гребне, «С Нов» под окном)
    if (waveScreenMesh && waveScreenMesh.material && Array.isArray(waveScreenMesh.material)) {
        const pulse = Math.sin(Date.now() * 0.0028);
        waveScreenMesh.material[0].emissiveIntensity = 0.65 + pulse * 0.15;
    }
    }

    // Праздничная анимация сияния верхушки
    const starObj = scene.getObjectByName('treeTopStar');
    if (starObj) {
        starObj.rotation.y += 0.008;
    }
    const starLight = scene.getObjectByName('treeTopLight');
    if (starLight) {
        starLight.intensity = 1.6 + Math.sin(Date.now() * 0.0035) * 0.45;
    }

    updateSnow();
    updateCalloutsPosition();

    controls.update();
    renderer.render(scene, camera);
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ==========================================================================
// 17. СТАРТ
// ==========================================================================
init();
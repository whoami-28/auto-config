/**
 * Porsche Configurator Data Store
 * Complete data model for models, trims, exterior, interior, packages, options, and compatibility rules.
 */

export const CONFIG_DATA = {
    currencies: {
        USD: { symbol: '$', rate: 1, label: 'USD ($)' },
        RUB: { symbol: '₽', rate: 95, label: 'RUB (₽)' },
        EUR: { symbol: '€', rate: 0.92, label: 'EUR (€)' }
    },

    deliveryFee: 2350, // Delivery, processing and handling fee ($)

    // Models catalog
    models: [
        {
            id: '911',
            name: 'Porsche 911',
            tagline: 'The timeless sports car icon',
            series: 'Iconic Sports Car',
            basePrice: 135500,
            image: 'assets/images/porsche_front_red.jpg',
            specs: {
                power: '394 л.с.',
                acceleration: '3.9 с',
                topSpeed: '294 км/ч',
                drivetrain: 'Задний (RWD)',
                bodyType: 'Coupe'
            },
            trims: [
                {
                    id: '911_carrera',
                    name: '911 Carrera',
                    price: 135500,
                    power: '394 л.с. (290 кВт)',
                    acceleration: '3.9 с',
                    topSpeed: '294 км/ч',
                    engine: '3.0L Boxer Twin-Turbo, 6 цилиндров',
                    transmission: '8-ступенчатая PDK',
                    description: 'Классическая икона спортивного автомобиля с задним приводом и турбированным оппозитным двигателем.'
                },
                {
                    id: '911_carrera_s',
                    name: '911 Carrera S',
                    price: 152000,
                    power: '450 л.с. (331 кВт)',
                    acceleration: '3.5 с',
                    topSpeed: '308 км/ч',
                    engine: '3.0L Boxer Twin-Turbo повышенной мощности',
                    transmission: '8-ступенчатая PDK или 7-ступенчатая МКПП',
                    description: 'Увеличенная мощность, адаптивная подвеска PASM и увеличенные тормозные диски в стандарте.'
                },
                {
                    id: '911_carrera_gts',
                    name: '911 Carrera GTS T-Hybrid',
                    price: 178000,
                    power: '541 л.с. (398 кВт)',
                    acceleration: '3.0 с',
                    topSpeed: '312 км/ч',
                    engine: '3.6L T-Hybrid Boxer с электрическим турбонагнетателем',
                    transmission: '8-ступенчатая PDK',
                    description: 'Революционная гибридная система T-Hybrid, спортивное шасси PASM (-10 мм) и спортивный выхлоп.'
                },
                {
                    id: '911_turbo_s',
                    name: '911 Turbo S',
                    price: 230000,
                    power: '650 л.с. (478 кВт)',
                    acceleration: '2.7 с',
                    topSpeed: '330 км/ч',
                    engine: '3.8L Boxer Twin-Turbo с системой VTG',
                    transmission: '8-ступенчатая PDK (AWD)',
                    description: 'Вершина инженерной мысли: полный привод, карбоново-керамические тормоза PCCB и активная аэродинамика.'
                },
                {
                    id: '911_gt3_rs',
                    name: '911 GT3 RS',
                    price: 241300,
                    power: '525 л.с. (386 кВт)',
                    acceleration: '3.2 с',
                    topSpeed: '296 км/ч',
                    engine: '4.0L высокооборотистый атмосферный Boxer (9000 об/мин)',
                    transmission: '7-ступенчатая спортивная PDK',
                    description: 'Бескомпромиссный болид для трека с системой DRS, регулируемой аэродинамикой и магниевыми элементами.'
                }
            ]
        },
        {
            id: 'taycan',
            name: 'Porsche Taycan',
            tagline: 'Soul, electrified',
            series: 'Electric Performance',
            basePrice: 99400,
            image: 'assets/images/porsche_taycan_front.jpg',
            specs: {
                power: '408 л.с.',
                acceleration: '4.5 с',
                topSpeed: '230 км/ч',
                drivetrain: 'Задний (RWD)',
                bodyType: 'Sport Saloon'
            },
            trims: [
                {
                    id: 'taycan_base',
                    name: 'Taycan',
                    price: 99400,
                    power: '408 л.с. (300 кВт)',
                    acceleration: '4.5 с',
                    topSpeed: '230 км/ч',
                    engine: 'Электропривод на задней оси (89 кВт⋅ч батарея)',
                    transmission: '2-ступенчатая автоматическая',
                    description: 'Чистокровный спортивный электрокар с динамикой разгона и сверхбыстрой зарядкой 800V.'
                },
                {
                    id: 'taycan_4s',
                    name: 'Taycan 4S',
                    price: 118500,
                    power: '544 л.с. (400 кВт)',
                    acceleration: '3.7 с',
                    topSpeed: '250 км/ч',
                    engine: 'Два электромотора (AWD, Performance Battery Plus)',
                    transmission: '2-ступенчатая автоматическая',
                    description: 'Полный привод, двухкамерная пневмоподвеска и увеличенный запас хода до 600 км.'
                },
                {
                    id: 'taycan_turbo_gt',
                    name: 'Taycan Turbo GT',
                    price: 230000,
                    power: '1034 л.с. (760 кВт)',
                    acceleration: '2.2 с',
                    topSpeed: '305 км/ч',
                    engine: 'Двухмоторная силовая установка экстремальной мощности',
                    transmission: '2-ступенчатая автоматическая',
                    description: 'Рекордсмен Нюрбургринга с карбоновым антикрылом и пакетом облегчения Weissach.'
                }
            ]
        },
        {
            id: 'panamera',
            name: 'Porsche Panamera',
            tagline: 'The sports car for four',
            series: 'Luxury Sports Sedan',
            basePrice: 102800,
            image: 'assets/images/porsche_panamera_front.jpg',
            specs: {
                power: '353 л.с.',
                acceleration: '5.1 с',
                topSpeed: '272 км/ч',
                drivetrain: 'Задний (RWD)',
                bodyType: 'Gran Turismo'
            },
            trims: [
                {
                    id: 'panamera_base',
                    name: 'Panamera',
                    price: 102800,
                    power: '353 л.с. (260 кВт)',
                    acceleration: '5.1 с',
                    topSpeed: '272 км/ч',
                    engine: '2.9L V6 Twin-Turbo',
                    transmission: '8-ступенчатая PDK',
                    description: 'Идеальный баланс между спортивной динамикой и комфортом представительского седана.'
                },
                {
                    id: 'panamera_4_e_hybrid',
                    name: 'Panamera 4 E-Hybrid',
                    price: 115500,
                    power: '470 л.с. (346 кВт)',
                    acceleration: '4.1 с',
                    topSpeed: '280 км/ч',
                    engine: '2.9L V6 Twin-Turbo + Электромотор (E-Hybrid)',
                    transmission: '8-ступенчатая PDK',
                    description: 'Интеллектуальный подключаемый гибрид с активной подвеской Porsche Active Ride.'
                },
                {
                    id: 'panamera_turbo_e_hybrid',
                    name: 'Panamera Turbo E-Hybrid',
                    price: 191000,
                    power: '680 л.с. (500 кВт)',
                    acceleration: '3.2 с',
                    topSpeed: '315 км/ч',
                    engine: '4.0L V8 Twin-Turbo + Электромотор E-Hybrid',
                    transmission: '8-ступенчатая PDK',
                    description: 'Флагманская динамика V8 Biturbo в сочетании с эксклюзивным цветом акцентов Turbonite.'
                }
            ]
        },
        {
            id: 'cayman',
            name: 'Porsche 718 Cayman',
            tagline: 'Pure mid-engine thrills',
            series: 'Mid-engine Sports Coupe',
            basePrice: 68300,
            image: 'assets/images/porsche_cayman_front.jpg',
            specs: {
                power: '300 л.с.',
                acceleration: '4.9 с',
                topSpeed: '275 км/ч',
                drivetrain: 'Задний (RWD)',
                bodyType: 'Mid-engine Coupe'
            },
            trims: [
                {
                    id: 'cayman_base',
                    name: '718 Cayman',
                    price: 68300,
                    power: '300 л.с. (221 кВт)',
                    acceleration: '4.9 с',
                    topSpeed: '275 км/ч',
                    engine: '2.0L Boxer Turbo, 4 цилиндра',
                    transmission: '6-ступенчатая МКПП или 7-ступенчатая PDK',
                    description: 'Центральномоторная компоновка с идеальной развесовкой по осям для максимального драйва.'
                },
                {
                    id: 'cayman_gts',
                    name: '718 Cayman GTS 4.0',
                    price: 95200,
                    power: '400 л.с. (294 кВт)',
                    acceleration: '4.0 с',
                    topSpeed: '288 км/ч',
                    engine: '4.0L высокооборотистый атмосферный 6-цилиндровый оппозит',
                    transmission: '6-ступенчатая МКПП / 7-ступенчатая PDK',
                    description: 'Культовый 4-литровый атмосферный двигатель с чарующим звуком выхлопа и пакетом Sport Chrono.'
                },
                {
                    id: 'cayman_gt4_rs',
                    name: '718 Cayman GT4 RS',
                    price: 160700,
                    power: '500 л.с. (368 кВт)',
                    acceleration: '3.4 с',
                    topSpeed: '315 км/ч',
                    engine: '4.0L двигатель от 911 GT3 с верхними воздухозаборниками',
                    transmission: '7-ступенчатая спортивная PDK',
                    description: 'Экстремальный трековый снаряд с воздухозаборниками вместо задних форточек.'
                }
            ]
        }
    ],

    // Exterior Colors (Porsche Categories: Contrasts, Shades, Dreams, Legends, Paint to Sample)
    colors: [
        {
            id: 'paint_white',
            code: '0Q',
            name: 'White',
            nameRu: 'Белый (White)',
            category: 'Contrasts',
            price: 0,
            hex: '#f5f5f7',
            metallic: false,
            description: 'Базовый классический глянцевый белый цвет'
        },
        {
            id: 'paint_black',
            code: 'A1',
            name: 'Black',
            nameRu: 'Черный (Black)',
            category: 'Contrasts',
            price: 0,
            hex: '#111113',
            metallic: false,
            description: 'Базовый глубокий черный глянец'
        },
        {
            id: 'paint_guards_red',
            code: 'G1',
            name: 'Guards Red',
            nameRu: 'Красный индиго (Guards Red)',
            category: 'Contrasts',
            price: 0,
            hex: '#c9121d',
            metallic: false,
            description: 'Исторический культовый спортивный красный цвет Porsche'
        },
        {
            id: 'paint_racing_yellow',
            code: 'P3',
            name: 'Racing Yellow',
            nameRu: 'Гоночный желтый (Racing Yellow)',
            category: 'Contrasts',
            price: 0,
            hex: '#ffd200',
            metallic: false,
            description: 'Яркий и бескомпромиссный гоночный цвет'
        },
        {
            id: 'paint_gt_silver',
            code: 'U2',
            name: 'GT Silver Metallic',
            nameRu: 'GT Серебристый металлик (GT Silver)',
            category: 'Shades',
            price: 880,
            hex: '#8d9296',
            metallic: true,
            description: 'Легендарный серебристый металлик из автоспорта Carrera GT'
        },
        {
            id: 'paint_gentian_blue',
            code: '1A',
            name: 'Gentian Blue Metallic',
            nameRu: 'Синий металлик (Gentian Blue)',
            category: 'Shades',
            price: 880,
            hex: '#142a54',
            metallic: true,
            description: 'Благородный темно-синий металлик с глубоким сапфировым отливом'
        },
        {
            id: 'paint_jet_black',
            code: '2T',
            name: 'Jet Black Metallic',
            nameRu: 'Черный металлик (Jet Black Metallic)',
            category: 'Shades',
            price: 880,
            hex: '#1a1c1e',
            metallic: true,
            description: 'Глубокий черный с переливающимися искрами металлика'
        },
        {
            id: 'paint_aventurine_green',
            code: 'U4',
            name: 'Aventurine Green Metallic',
            nameRu: 'Авантюриновый зеленый (Aventurine Green)',
            category: 'Shades',
            price: 880,
            hex: '#3e4a42',
            metallic: true,
            description: 'Элегантный сложный оттенок лесной хвои и авантюрина'
        },
        {
            id: 'paint_shark_blue',
            code: 'D5',
            name: 'Shark Blue',
            nameRu: 'Синий Акула (Shark Blue)',
            category: 'Dreams',
            price: 1580,
            hex: '#005bb7',
            metallic: false,
            description: 'Ультра-насыщенный динамичный цвет, разработанный для 911 GT3'
        },
        {
            id: 'paint_carmine_red',
            code: '0L',
            name: 'Carmine Red',
            nameRu: 'Карминовый красный (Carmine Red)',
            category: 'Dreams',
            price: 3160,
            hex: '#8e0c1a',
            metallic: false,
            description: 'Глубокий рубиновый спортивный оттенок, визитная карточка моделей GTS'
        },
        {
            id: 'paint_crayon',
            code: '3H',
            name: 'Crayon / Chalk',
            nameRu: 'Мел (Crayon / Chalk)',
            category: 'Dreams',
            price: 3160,
            hex: '#b3b3af',
            metallic: false,
            description: 'Премиальный пастельный светло-серый оттенок со сложным мягким блеском'
        },
        {
            id: 'paint_python_green',
            code: '3I',
            name: 'Python Green',
            nameRu: 'Зеленый Питон (Python Green)',
            category: 'Dreams',
            price: 3160,
            hex: '#2fa839',
            metallic: false,
            description: 'Экстравагантный сочный зеленый цвет из палитры спорткаров'
        },
        {
            id: 'paint_pts_rubystar',
            code: 'PTS_01',
            name: 'Paint to Sample: Ruby Star Neo',
            nameRu: 'Paint to Sample: Рубиновая Звезда (Ruby Star)',
            category: 'Paint to Sample',
            price: 15050,
            hex: '#b8246a',
            metallic: false,
            description: 'Культовый цвет эпохи 964 Carrera RS — смелое историческое заявление'
        },
        {
            id: 'paint_pts_viola',
            code: 'PTS_02',
            name: 'Paint to Sample: Viola Metallic',
            nameRu: 'Paint to Sample: Фиолетовый металлик (Viola)',
            category: 'Paint to Sample',
            price: 15050,
            hex: '#3c184e',
            metallic: true,
            description: 'Глубокий пурпурно-фиолетовый металлик с богатым переливом на солнце'
        },
        {
            id: 'paint_pts_gulf_blue',
            code: 'PTS_03',
            name: 'Paint to Sample: Gulf Blue',
            nameRu: 'Paint to Sample: Легендарный Gulf Blue',
            category: 'Paint to Sample',
            price: 15050,
            hex: '#78a6c8',
            metallic: false,
            description: 'Легендарный гоночный оттенок команды Gulf Racing 24 часов Ле-Мана'
        }
    ],

    // Wheels
    wheels: [
        {
            id: 'wheel_19_20_carrera',
            code: '1PE',
            name: '19/20-inch Carrera Wheels',
            nameRu: '19/20-дюймовые диски Carrera (Базовые)',
            size: '19/20',
            price: 0,
            preview: '5-double-spoke',
            description: 'Легкосплавные диски 8.5J x 19 спереди и 11.5J x 20 сзади, дизайн с 5 двойными спицами.'
        },
        {
            id: 'wheel_20_21_carrera_s',
            code: '46I',
            name: '20/21-inch Carrera S Wheels',
            nameRu: '20/21-дюймовые диски Carrera S',
            size: '20/21',
            price: 2460,
            preview: '10-spoke-silver',
            description: 'Классический спортивный 10-спицевый дизайн в серебристом исполнении Brilliant Silver.'
        },
        {
            id: 'wheel_20_21_rs_spyder',
            code: '46J',
            name: '20/21-inch RS Spyder Design Wheels',
            nameRu: '20/21-дюймовые диски RS Spyder Design',
            size: '20/21',
            price: 3680,
            preview: 'multi-spoke-mesh',
            description: 'Легендарный многоспицевый дизайн, навеянный гоночным прототипом Porsche RS Spyder.'
        },
        {
            id: 'wheel_20_21_turbo_exclusive',
            code: 'F45',
            name: '20/21-inch Turbo Exclusive Design Wheels',
            nameRu: '20/21-дюймовые диски Turbo Exclusive с карбоновыми лезвиями',
            size: '20/21',
            price: 4980,
            preview: 'turbo-aeroblades',
            description: 'Аэродинамический дизайн с фрезерованными гранями и карбоновыми вставками Aeroblades.'
        },
        {
            id: 'wheel_20_21_gt3_centerlock',
            code: 'C2Q',
            name: '20/21-inch GT3 Lightweight Center-Lock Wheels',
            nameRu: '20/21-дюймовые кованые диски с центральной гайкой (Center-Lock)',
            size: '20/21',
            price: 5800,
            preview: 'centerlock-racing',
            description: 'Кованые диски из легкого сплава с гоночным центральным креплением (Center-Lock).'
        }
    ],

    // Wheel Paint Finish
    wheelFinishes: [
        { id: 'wf_standard', code: 'WF1', name: 'Brilliant Silver (Стандарт)', price: 0, hex: '#c5c7cb' },
        { id: 'wf_satin_black', code: '1G8', name: 'Satin Black (Матовый черный)', price: 1200, hex: '#222325' },
        { id: 'wf_neodyme', code: '1NX', name: 'Neodyme (Шелковистое золото Neodyme)', price: 1200, hex: '#b89f72' },
        { id: 'wf_darksilver', code: '1NV', name: 'Darksilver (Темный титан)', price: 1200, hex: '#5b5d61' }
    ],

    // Brake Calipers
    calipers: [
        { id: 'caliper_standard', code: 'KB0', name: 'Черные тормозные суппорты (Стандарт)', price: 0, hex: '#222222', requiresPCCB: false },
        { id: 'caliper_red', code: 'KB1', name: 'Красные тормозные суппорты (Porsche Red)', price: 540, hex: '#d5001c', requiresPCCB: false },
        { id: 'caliper_yellow_pccb', code: 'KB2', name: 'Желтые суппорты PCCB Ceramic (Входят в PCCB)', price: 0, hex: '#ffd000', requiresPCCB: true }
    ],

    // Interior Materials & Trims
    interiors: [
        {
            id: 'int_standard_black',
            code: 'AP',
            name: 'Standard Interior in Black',
            nameRu: 'Стандартный салон: Черная кожа / Текстиль',
            price: 0,
            hex: '#1f1f21',
            type: 'standard',
            description: 'Проверенная износостойкая черная отделка со спортивной перфорацией.'
        },
        {
            id: 'int_leather_black',
            code: 'AU',
            name: 'Leather Interior in Black',
            nameRu: 'Кожаный салон: Гладкая натуральная кожа Black',
            price: 2840,
            hex: '#262628',
            type: 'leather',
            description: 'Натуральная кожа на передней панели, центральной консоли и дверных картах.'
        },
        {
            id: 'int_leather_bordeaux',
            code: 'BN',
            name: 'Two-Tone Leather: Black & Bordeaux Red',
            nameRu: 'Двухцветный салон: Черный и Бордо (Bordeaux Red)',
            price: 4960,
            hex: '#5c1724',
            accentHex: '#1a1a1a',
            type: 'two-tone-leather',
            description: 'Премиальная комбинация глубокого винного Bordeaux Red и контрастной черной кожи.'
        },
        {
            id: 'int_club_truffle',
            code: 'HB',
            name: 'Club Leather Olea in Truffle Brown',
            nameRu: 'Клубная кожа Olea: Трюфельный коричневый (Truffle Brown)',
            price: 5930,
            hex: '#473229',
            type: 'club-leather',
            description: 'Эксклюзивная растительного дубления кожа Olea с уникальной естественной фактурой.'
        },
        {
            id: 'int_racetex_gt',
            code: 'GR',
            name: 'Race-Tex Interior with Deviated Stitching',
            nameRu: 'Интерьер Race-Tex (Алькантара) с контрастной строчкой',
            price: 4490,
            hex: '#2b2c2e',
            accentHex: '#d5001c',
            type: 'racetex',
            description: 'Гоночный дышащий микрофибровый материал Race-Tex со строчкой Guards Red.'
        }
    ],

    // Seats selection
    seats: [
        {
            id: 'seat_sport_4way',
            code: 'Q1J',
            name: 'Sport Seats (4-way electric)',
            nameRu: 'Спортивные сиденья (4-позиционные электрические)',
            price: 0,
            isBucket: false,
            description: 'Стандартные спортивные сиденья с электрической регулировкой спинки и высоты.'
        },
        {
            id: 'seat_power_14way',
            code: 'Q2J',
            name: 'Power Sport Seats (14-way) with Memory',
            nameRu: 'Спортивные сиденья с памятью (14-позиционные электрорегулировки)',
            price: 2460,
            isBucket: false,
            description: 'Полная электрическая регулировка, память положений для водителя и регулировка длины подушки.'
        },
        {
            id: 'seat_adaptive_18way',
            code: 'Q1K',
            name: 'Adaptive Sports Seats Plus (18-way) with Memory',
            nameRu: 'Адаптивные спортивные сиденья Plus (18-позиционные)',
            price: 3680,
            isBucket: false,
            description: 'Максимальная боковая поддержка с пневморегулировкой боковых валиков и памятью.'
        },
        {
            id: 'seat_full_bucket',
            code: 'Q1J_CF',
            name: 'Full Lightweight Carbon Bucket Seats',
            nameRu: 'Облегченные карбоновые ковши (Full Bucket Seats)',
            price: 6940,
            isBucket: true,
            description: 'Цельный карбоновый каркас (CFRP), глубокая посадка и максимальная фиксация для трека.'
        }
    ],

    // Packages and Optional Equipment
    options: [
        // PACKAGES
        {
            id: 'pkg_premium',
            code: 'P3R',
            category: 'packages',
            categoryName: 'Пакеты оснащения (Packages)',
            name: 'Premium Package',
            nameRu: 'Пакет Premium Package',
            price: 5350,
            description: 'Включает: аудиосистему BOSE Surround Sound, камеры кругового обзора 360°, матричные фары PDLS Plus, систему мониторинга слепых зон и комфортный бесключевой доступ.',
            bundledOptions: ['opt_bose', 'opt_surround_view', 'opt_matrix_led']
        },
        {
            id: 'pkg_sport_design',
            code: '2D1',
            category: 'packages',
            categoryName: 'Пакеты оснащения (Packages)',
            name: 'SportDesign Package',
            nameRu: 'Пакет SportDesign (Спортивный обвес)',
            price: 4890,
            description: 'Агрессивный передний бампер с уникальными воздуховодами, развитый задний диффузор и боковые юбки в цвет кузова.',
            bundledOptions: []
        },
        {
            id: 'pkg_weissach',
            code: '04I',
            category: 'packages',
            categoryName: 'Пакеты оснащения (Packages)',
            name: 'Weissach Lightweight Package',
            nameRu: 'Облегченный трековый пакет Weissach',
            price: 18900,
            description: 'Видимый углепластик на капоте и крыше, титановый каркас безопасности, облегченные стабилизаторы поперечной устойчивости.',
            bundledOptions: ['opt_carbon_roof']
        },

        // PERFORMANCE & DRIVETRAIN
        {
            id: 'opt_sport_chrono',
            code: '8LH',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'Sport Chrono Package',
            nameRu: 'Пакет Sport Chrono (с переключателем режимов на руле)',
            price: 2790,
            description: 'Аналоговый и цифровой секундомер Porsche Design на торпедо, переключатель режимов на руле, Launch Control и режим Sport Response.',
            highlight: true
        },
        {
            id: 'opt_sport_exhaust',
            code: '0P9',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'Sport Exhaust System with Black Tailpipes',
            nameRu: 'Спортивная выхлопная система с черными патрубками',
            price: 2950,
            description: 'Управляемые выпускные клапаны для насыщенного спортивного звука оппозитного мотора.'
        },
        {
            id: 'opt_pccb',
            code: '1LQ',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'Porsche Ceramic Composite Brakes (PCCB)',
            nameRu: 'Керамические композитные тормоза (PCCB) с желтыми суппортами',
            price: 9280,
            description: 'Вентилируемые керамические диски 410 мм спереди и 390 мм сзади. Непревзойденная стойкость к перегреву и сниженная неподрессоренная масса.',
            highlight: true
        },
        {
            id: 'opt_front_axle_lift',
            code: '2UH',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'Front Axle Lift System',
            nameRu: 'Система подъема передней оси (Front Axle Lift)',
            price: 2770,
            description: 'Гидравлический подъем носовой части на 40 мм на скорости до 35 км/ч с памятью GPS точек неровностей.'
        },
        {
            id: 'opt_rear_axle_steering',
            code: '0N5',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'Rear Axle Steering',
            nameRu: 'Подруливающая задняя ось (Rear Axle Steering)',
            price: 2090,
            description: 'Поворот задних колес в противофазе на малых скоростях для маневренности и синфазно на высоких для устойчивости.'
        },
        {
            id: 'opt_pasm_sport',
            code: '1BV',
            category: 'performance',
            categoryName: 'Динамика и ходовая часть (Performance)',
            name: 'PASM Sport Suspension (-10 mm)',
            nameRu: 'Спортивная подвеска PASM с занижением на 10 мм',
            price: 1020,
            description: 'Более жесткие пружины, перенастроенные амортизаторы и аэродинамический передний спойлер.'
        },

        // LIGHTS & EXTERIOR DETAILS
        {
            id: 'opt_matrix_led',
            code: '8IU',
            category: 'exterior_options',
            categoryName: 'Экстерьер и оптика (Lights & Exterior)',
            name: 'LED Matrix Main Headlights with PDLS Plus',
            nameRu: 'Матричные светодиодные фары с системой PDLS Plus',
            price: 2020,
            description: '84 индивидуально управляемых светодиода с динамическим вырезанием встречного потока и фирменным 4-точечным рисунком ходовых огней.'
        },
        {
            id: 'opt_carbon_roof',
            code: '3FF',
            category: 'exterior_options',
            categoryName: 'Экстерьер и оптика (Lights & Exterior)',
            name: 'Lightweight Carbon Fiber Roof',
            nameRu: 'Облегченная карбоновая крыша (Carbon Fiber)',
            price: 3890,
            description: 'Крыша из формованного карбона со структурой плетения углеволокна. Снижает центр тяжести автомобиля на 1.5 см.'
        },
        {
            id: 'opt_glass_sunroof',
            code: '3FE',
            category: 'exterior_options',
            categoryName: 'Экстерьер и оптика (Lights & Exterior)',
            name: 'Electric Slide/Tilt Glass Sunroof',
            nameRu: 'Стеклянный подъемно-сдвижной панорамный люк',
            price: 2000,
            description: 'Панорамный люк из тонированного стекла с электрической солнцезащитной шторкой и ветрозащитным дефлектором.'
        },
        {
            id: 'opt_privacy_glass',
            code: '4KF',
            category: 'exterior_options',
            categoryName: 'Экстерьер и оптика (Lights & Exterior)',
            name: 'Privacy Glass (Заводская тонировка)',
            nameRu: 'Глубокая заводская тонировка задних стекол (Privacy Glass)',
            price: 560,
            description: 'Тонированные стекла задней полусферы с теплозащитным покрытием.'
        },

        // INTERIOR COMFORTS & AUDIO
        {
            id: 'opt_seat_ventilation',
            code: '4D3',
            category: 'interior_options',
            categoryName: 'Комфорт салона (Interior Comfort)',
            name: 'Ventilated Front Seats',
            nameRu: 'Вентиляция передних сидений (3 уровня интенсивности)',
            price: 840,
            description: 'Активная 3-ступенчатая вентиляция подушки и спинки сидений для поддержания оптимального микроклимата.'
        },
        {
            id: 'opt_gt_sports_wheel_heated',
            code: '2PJ',
            category: 'interior_options',
            categoryName: 'Комфорт салона (Interior Comfort)',
            name: 'Heated GT Sports Steering Wheel in Race-Tex',
            nameRu: 'Спортивное рулевое колесо GT с обогревом и отделкой Race-Tex',
            price: 680,
            description: 'Уменьшенный диаметр 360 мм, обогрев по всему периметру обода и тактильная отделка микрофиброй Race-Tex.'
        },
        {
            id: 'opt_porsche_crest_headrests',
            code: '3J7',
            category: 'interior_options',
            categoryName: 'Комфорт салона (Interior Comfort)',
            name: 'Porsche Crest on Headrests',
            nameRu: 'Тиснение герба Porsche на подголовниках передних сидений',
            price: 390,
            description: 'Тисненый герб мануфактуры Porsche Exclusive Manufaktur на передних подголовниках.'
        },
        {
            id: 'opt_belts_guards_red',
            code: 'FZ1',
            category: 'interior_options',
            categoryName: 'Комфорт салона (Interior Comfort)',
            name: 'Seat Belts in Guards Red',
            nameRu: 'Ремни безопасности контрастного цвета Guards Red',
            price: 540,
            description: 'Спортивные ярко-красные ремни безопасности для всех посадочных мест.'
        },

        // AUDIO & TECHNOLOGY
        {
            id: 'opt_bose',
            code: '9VL',
            category: 'audio_tech',
            categoryName: 'Аудио и технологии (Audio & Tech)',
            name: 'BOSE® Surround Sound System',
            nameRu: 'Премиальная аудиосистема BOSE® Surround Sound (570 Вт)',
            price: 1600,
            description: '12 динамиков, отдельный сабвуфер, технология компенсации фонового шума AudioPilot® и мощность 570 Ватт.'
        },
        {
            id: 'opt_burmester',
            code: '9VJ',
            category: 'audio_tech',
            categoryName: 'Аудио и технологии (Audio & Tech)',
            name: 'Burmester® High-End Surround Sound System',
            nameRu: 'High-End аудиосистема Burmester® 3D High-End (855 Вт)',
            price: 5560,
            description: '13 динамиков с ленточными твитерами AMT, 300-ваттный сабвуфер с цифровым усилителем класса D, общая мощность 855 Ватт.'
        },
        {
            id: 'opt_surround_view',
            code: 'KA6',
            category: 'audio_tech',
            categoryName: 'Аудио и технологии (Audio & Tech)',
            name: 'Surround View with Active Parking Support',
            nameRu: 'Система кругового обзора 360° с активным автопарковщиком',
            price: 1430,
            description: '4 камеры высокой четкости с виртуальным 3D видом автомобиля и автоматическим поиском парковочного места.'
        },
        {
            id: 'opt_innodrive',
            code: 'P60',
            category: 'audio_tech',
            categoryName: 'Аудио и технологии (Audio & Tech)',
            name: 'Porsche InnoDrive with Adaptive Cruise Control',
            nameRu: 'Интеллектуальный автопилот Porsche InnoDrive',
            price: 3020,
            description: 'Предиктивное управление скоростью на 3 км вперед по навигационным данным, распознавание дорожных знаков и удержание в полосе.'
        },
        {
            id: 'opt_night_vision',
            code: '9R1',
            category: 'audio_tech',
            categoryName: 'Аудио и технологии (Audio & Tech)',
            name: 'Night Vision Assist',
            nameRu: 'Система ночного видения Night Vision Assist',
            price: 2540,
            description: 'Инфракрасная тепловизионная камера с выводом людей и животных на цифровую приборную панель с предупреждением водителя.'
        }
    ],

    // Compatibility & Dependency Rules Engine
    rules: [
        {
            id: 'rule_buckets_vs_ventilation',
            type: 'incompatible',
            triggerOptionId: 'opt_seat_ventilation',
            conflictOptionId: 'seat_full_bucket',
            title: 'Конфликт оснащения: Вентиляция и Карбоновые ковши',
            reason: 'Опция «Вентиляция передних сидений» технически несовместима с облегченными карбоновыми ковшеобразными сиденьями (Full Bucket Seats), так как каркас ковшей не имеет встроенных вентиляционных каналов.',
            resolutionDescription: 'Для активации вентиляции сидений необходимо заменить карбоновые ковши на Спортивные сиденья с электрорегулировками (14 или 18 позиций).',
            autoReplace: {
                remove: ['seat_full_bucket'],
                add: ['seat_power_14way']
            }
        },
        {
            id: 'rule_reverse_buckets_vs_ventilation',
            type: 'incompatible',
            triggerOptionId: 'seat_full_bucket',
            conflictOptionId: 'opt_seat_ventilation',
            title: 'Конфликт оснащения: Карбоновые ковши и Вентиляция',
            reason: 'Облегченные карбоновые ковши (Full Bucket Seats) имеют цельный спортивный каркас CFRP и не поддерживают систему активной вентиляции.',
            resolutionDescription: 'При выборе карбоновых ковшей опция «Вентиляция передних сидений» будет отключена.',
            autoReplace: {
                remove: ['opt_seat_ventilation'],
                add: []
            }
        },
        {
            id: 'rule_pccb_requires_wheels',
            type: 'prerequisite',
            triggerOptionId: 'opt_pccb',
            requiredCondition: (config) => config.wheelId !== 'wheel_19_20_carrera',
            title: 'Требование к диаметру дисков: Тормоза PCCB',
            reason: 'Керамические тормозные диски PCCB имеют увеличенный диаметр 410 мм с массивными 6-поршневыми суппортами, которые физически не помещаются в базовые 19/20-дюймовые диски Carrera.',
            resolutionDescription: 'Для установки тормозов PCCB диски будут автоматически обновлены до 20/21-дюймовых Carrera S (+$2,460).',
            autoReplace: {
                setWheel: 'wheel_20_21_carrera_s',
                setCaliper: 'caliper_yellow_pccb'
            }
        },
        {
            id: 'rule_carbon_roof_vs_sunroof',
            type: 'incompatible',
            triggerOptionId: 'opt_carbon_roof',
            conflictOptionId: 'opt_glass_sunroof',
            title: 'Взаимоисключающие опции: Карбоновая крыша и Панорамный люк',
            reason: 'Автомобиль не может одновременно иметь облегченную карбоновую цельную крышу и стеклянный сдвижной люк.',
            resolutionDescription: 'Выбор облегченной карбоновой крыши приведет к отмене опции «Стеклянный подъемно-сдвижной панорамный люк».',
            autoReplace: {
                remove: ['opt_glass_sunroof'],
                add: []
            }
        },
        {
            id: 'rule_sunroof_vs_carbon_roof',
            type: 'incompatible',
            triggerOptionId: 'opt_glass_sunroof',
            conflictOptionId: 'opt_carbon_roof',
            title: 'Взаимоисключающие опции: Панорамный люк и Карбоновая крыша',
            reason: 'Установка стеклянного панорамного люка невозможна при наличии цельной облегченной карбоновой крыши.',
            resolutionDescription: 'Опция «Облегченная карбоновая крыша» будет удалена из комплектации.',
            autoReplace: {
                remove: ['opt_carbon_roof'],
                add: []
            }
        },
        {
            id: 'rule_burmester_vs_bose',
            type: 'incompatible',
            triggerOptionId: 'opt_burmester',
            conflictOptionId: 'opt_bose',
            title: 'Взаимоисключающие аудиосистемы: Burmester® и BOSE®',
            reason: 'Автомобиль оснащается только одной премиальной аудиосистемой.',
            resolutionDescription: 'Аудиосистема BOSE® Surround Sound будет заменена на флагманскую Burmester® High-End Surround Sound.',
            autoReplace: {
                remove: ['opt_bose'],
                add: []
            }
        },
        {
            id: 'rule_bose_vs_burmester',
            type: 'incompatible',
            triggerOptionId: 'opt_bose',
            conflictOptionId: 'opt_burmester',
            title: 'Взаимоисключающие аудиосистемы: BOSE® и Burmester®',
            reason: 'Автомобиль оснащается только одной премиальной аудиосистемой.',
            resolutionDescription: 'Аудиосистема Burmester® будет заменена на BOSE® Surround Sound.',
            autoReplace: {
                remove: ['opt_burmester'],
                add: []
            }
        },
        {
            id: 'rule_lift_requires_chrono',
            type: 'prerequisite',
            triggerOptionId: 'opt_front_axle_lift',
            requiredCondition: (config) => config.options.includes('opt_sport_chrono'),
            title: 'Требование системы: Подъем передней оси',
            reason: 'Система подъема передней оси (Front Axle Lift System) интегрирована с интеллектуальным контроллером подвески и режимами движения пакета Sport Chrono.',
            resolutionDescription: 'Для заказа системы подъема передней оси в комплектацию будет добавлен «Пакет Sport Chrono» (+$2,790).',
            autoReplace: {
                add: ['opt_sport_chrono']
            }
        },
        {
            id: 'rule_gt3_wheels_require_performance',
            type: 'prerequisite',
            triggerOptionId: 'wheel_20_21_gt3_centerlock',
            requiredCondition: (config) => ['911_carrera_gts', '911_turbo_s', '911_gt3_rs'].includes(config.trimId),
            title: 'Ограничение модификации: Диски Center-Lock',
            reason: 'Кованые диски с центральной гоночной гайкой (Center-Lock) требуют специальных ступичных узлов с центральным замком, которые устанавливаются на модификации GTS, Turbo S и GT3 RS.',
            resolutionDescription: 'Для установки дисков Center-Lock модификация будет переключена на 911 Carrera GTS T-Hybrid.',
            autoReplace: {
                setTrim: '911_carrera_gts'
            }
        },
        {
            id: 'rule_weissach_requires_bucket_seats',
            type: 'prerequisite',
            triggerOptionId: 'pkg_weissach',
            requiredCondition: (config) => config.seatId === 'seat_full_bucket',
            title: 'Требование пакета Weissach: Карбоновые ковши',
            reason: 'Трековый пакет облегчения Weissach Package устанавливается исключительно в сочетании с облегченными карбоновыми ковшеобразными сиденьями (Full Bucket Seats) для соответствия гоночной омологации.',
            resolutionDescription: 'Сиденья будут автоматически заменены на облегченные карбоновые ковши (+$6,940).',
            autoReplace: {
                setSeat: 'seat_full_bucket',
                remove: ['opt_seat_ventilation']
            }
        }
    ]
};

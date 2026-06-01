const FACTIONS = {
    FIRE: 'fire',
    WATER: 'water',
    EARTH: 'earth',
    WIND: 'wind',
    ICE: 'ice',
    LIGHTNING: 'lightning',
    LIGHT: 'light',
    DARK: 'dark',
    NEUTRAL: 'neutral',
    PLAYER: 'player'
};

const COLORS = {
    [FACTIONS.FIRE]: '#ff4444',
    [FACTIONS.WATER]: '#4444ff',
    [FACTIONS.EARTH]: '#8b4513',
    [FACTIONS.WIND]: '#44ff44',
    [FACTIONS.ICE]: '#44ffff',
    [FACTIONS.LIGHTNING]: '#ffff44',
    [FACTIONS.LIGHT]: '#ffffff',
    [FACTIONS.DARK]: '#8800ff',
    [FACTIONS.NEUTRAL]: '#ffffff',
    [FACTIONS.PLAYER]: '#ffffff' // dynamically assigned
};

const WEAPON_TYPES = {
    [FACTIONS.FIRE]: 'SWORD',
    [FACTIONS.WATER]: 'TRIDENT',
    [FACTIONS.EARTH]: 'HAMMER',
    [FACTIONS.WIND]: 'BLADE',
    [FACTIONS.ICE]: 'AXE',
    [FACTIONS.LIGHTNING]: 'SPEAR',
    [FACTIONS.LIGHT]: 'SHOVEL',
    [FACTIONS.DARK]: 'SCYTHE',
    [FACTIONS.NEUTRAL]: 'SWORD',
    [FACTIONS.PLAYER]: 'CUSTOM'
};

// [이동속도, 회전속도, 데미지, 크기, 운(아이템생성), 체력] - 총합 18포인트
const FACTION_STATS = {
    [FACTIONS.FIRE]:      { move: 4, spin: 3, damage: 5, size: 2, luck: 2, health: 2 }, // 버서커
    [FACTIONS.WATER]:     { move: 3, spin: 3, damage: 3, size: 3, luck: 3, health: 3 }, // 밸런스
    [FACTIONS.EARTH]:     { move: 2, spin: 2, damage: 2, size: 4, luck: 3, health: 5 }, // 거대 탱커
    [FACTIONS.WIND]:      { move: 5, spin: 4, damage: 4, size: 1, luck: 2, health: 2 }, // 초고속 암살자
    [FACTIONS.ICE]:       { move: 2, spin: 2, damage: 3, size: 4, luck: 3, health: 4 }, // 빙하 (크기 하향, 밸런스 조정)
    [FACTIONS.LIGHTNING]: { move: 5, spin: 2, damage: 5, size: 2, luck: 2, health: 2 }, // 벼락
    [FACTIONS.LIGHT]:     { move: 3, spin: 3, damage: 3, size: 2, luck: 4, health: 3 }, // 성기사 (운 하향, 딜 상승)
    [FACTIONS.DARK]:      { move: 3, spin: 4, damage: 4, size: 3, luck: 2, health: 2 }, // 회전 낫
    [FACTIONS.NEUTRAL]:   { move: 3, spin: 3, damage: 3, size: 3, luck: 3, health: 3 }
};

const CONFIG = {
    GRID_SIZE: 30,               
    FPS: 60,
    BASE_UNIT_SPEED: 5.0,        
    BASE_SPIN_SPEED: 0.08,
    BASE_BODY_RADIUS: 36,        
    BASE_WEAPON_RADIUS: 6,       
    BASE_WEAPON_LENGTH: 90,      
    MAX_HP: 100,
    BASE_DAMAGE: 10,
    ITEM_SPAWN_RATE: 150, 
    MAX_ITEMS: 5,
};

const ITEM_TYPES = {
    HEAL: 'HEAL',             // 체력 33% 회복
    HEALTH_UP: 'HEALTH_UP',   // 체력 스탯 +1
    SPEED_UP: 'SPEED_UP',     // 이동 속도 +1
    SPIN_UP: 'SPIN_UP',       // 회전 속도 +1
    SIZE_UP: 'SIZE_UP'        // 크기 +1
};

const ITEM_COLORS = {
    [ITEM_TYPES.HEAL]: '#10b981',       // Green
    [ITEM_TYPES.HEALTH_UP]: '#ec4899',  // Pink
    [ITEM_TYPES.SPEED_UP]: '#38bdf8',   // Blue
    [ITEM_TYPES.SPIN_UP]: '#f59e0b',    // Amber
    [ITEM_TYPES.SIZE_UP]: '#d946ef'     // Fuchsia
};

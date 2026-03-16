const CONFIG = {
  // World
  MAP_WIDTH: 3000,
  MAP_HEIGHT: 3000,
  GRID_SIZE: 64,

  // Game loop
  MAX_DELTA: 0.1,

  // Player
  PLAYER_SPEED: 200,
  PLAYER_RADIUS: 16,
  PLAYER_MAX_HP: 100,
  PLAYER_IFRAMES: 0.5,       // seconds of invulnerability after hit
  PLAYER_MAGNET_RADIUS: 40,  // XP gem pickup radius

  // Game timing
  WIN_TIME: 20 * 60,

  // Enemies
  MAX_ENEMIES: 300,
  SPAWN_MARGIN: 100,          // spawn distance beyond screen edge
  WAVE_INTERVAL: 25,          // seconds between difficulty bumps
  WAVE_SCALE: 0.12,           // +12% enemies per wave
  NEW_TYPE_INTERVAL: 60,      // seconds before next enemy type unlocks
  ENEMY_AI_INTERVAL: 10,      // recalculate direction every N frames
  KNOCKBACK_DIST: 50,

  ENEMY_TYPES: {
    bug:          { hp: 20,  speed: 120, damage: 8,  radius: 10, xp: 1, color: '#f0883e', shape: 'circle'   },
    infiniteLoop: { hp: 80,  speed: 60,  damage: 15, radius: 18, xp: 5, color: '#a371f7', shape: 'square'   },
    nullPointer:  { hp: 10,  speed: 200, damage: 5,  radius: 8,  xp: 2, color: '#f85149', shape: 'triangle' },
  },

  // Skills
  SKILL_CONSOLE_LOG: {
    cooldown: 1.5,
    directions: 3,
    speed: 400,
    damage: 15,
    radius: 6,
    maxDistance: 300,
    color: '#e3b341',
    trailLength: 5,
  },
  SKILL_GIT_PUSH: {
    cooldown: 2,
    speed: 500,
    damage: 25,
    radius: 8,
    maxDistance: 500,
    color: '#3fb950',
    trailLength: 5,
  },
  SKILL_NPM_INSTALL: {
    cooldown: 4,
    damage: 20,
    radius: 100,
    color: '#f85149',
    duration: 0.3,
  },
  SKILL_STACK_TRACE: {
    cooldown: 3,
    dps: 30,
    duration: 1,
    range: 300,
    color: '#79c0ff',
    width: 4,
  },
  SKILL_HOT_RELOAD: {
    cooldown: 5,
    healAmount: 10,
    color: '#3fb950',
    shieldCooldown: 60,
  },
  SKILL_404: {
    cooldown: 4,
    damage: 10,
    range: 400,
    color: '#f0883e',
  },

  // Hero-specific skills
  SKILL_SQL_QUERY: {
    cooldown: 2.5,
    damage: 30,
    width: 60,
    length: 150,
    color: '#a371f7',
    duration: 0.3,
  },
  SKILL_DOCKER: {
    cooldown: 8,
    color: '#0db7ed',
  },
  SKILL_EXPLOIT: {
    cooldown: 2,
    damage: 20,
    color: '#da3633',
    aoeRadius: 80,
    projSpeed: 450,
    projMaxDist: 350,
    slowDuration: 2,
  },

  // Heroes
  HERO_DEFS: {
    frontend_dev: {
      name: 'Frontend Dev', emoji: '💻', startSkill: 'console_log',
      passive: null, color: '#58a6ff',
      desc: 'Balanced starter hero',
    },
    backend_dev: {
      name: 'Backend Dev', emoji: '🖥️', startSkill: 'sql_query',
      passive: { type: 'maxHpMult', value: 1.3 }, color: '#a371f7',
      desc: 'SQL Query + 30% HP',
    },
    devops: {
      name: 'DevOps', emoji: '🔧', startSkill: 'docker',
      passive: { type: 'cooldownMult', value: 0.75 }, color: '#0db7ed',
      desc: 'Docker shield + -25% cooldowns',
    },
    hacker: {
      name: 'Hacker', emoji: '🏴‍☠️', startSkill: 'exploit',
      passive: { type: 'critChance', value: 0.35 }, color: '#da3633',
      desc: 'Exploit (random) + 35% crit',
    },
  },

  // Crit
  BASE_CRIT_CHANCE: 0,

  // XP & Level Up
  XP_GEM_RADIUS: 6,
  XP_GEM_MAGNET_SPEED: 350,
  XP_GEM_BASE_COLOR: '#7ee787',
  XP_GEM_HIGH_COLOR: '#e3b341',
  XP_LEVEL_FORMULA_BASE: 5,
  XP_LEVEL_FORMULA_EXP: 1.5,

  // Upgrade pool
  UPGRADE_CHOICES: 3,
  MAX_SKILL_LEVEL: 5,

  // Elites & Boss
  ELITE_TYPES: {
    legacyCode:     { hp: 150, speed: 80,  damage: 12, radius: 15, xp: 8,  color: '#238636', shape: 'hexagon',  regen: 2 },
    virus:          { hp: 40,  speed: 150, damage: 10, radius: 12, xp: 6,  color: '#da3633', shape: 'diamond',  spawnOnDeath: 3 },
    deprecatedPkg:  { hp: 100, speed: 50,  damage: 5,  radius: 20, xp: 10, color: '#8b949e', shape: 'pentagon', slowRadius: 80, slowFactor: 0.5 },
  },
  ELITE_UNLOCK_TIME: 180,
  ELITE_SPAWN_INTERVAL: 12,

  BOSS: {
    spawnInterval: 300,
    warningTime: 5,
  },

  BOSS_TYPES: {
    windowsXP: {
      name: 'Windows XP',
      hp: 2000,
      speed: 40,
      speedEnraged: 80,
      damage: 25,
      radius: 60,
      xp: 50,
      color: '#0078d4',
      aoeInterval: 8,
      aoeRadius: 200,
      aoeDuration: 2,
      aoeWarning: 1.5,
      enrageThreshold: 0.5,
    },
    stackOverflow: {
      name: 'Stack Overflow',
      hp: 1500,
      speed: 50,
      speedEnraged: 90,
      damage: 20,
      radius: 50,
      xp: 60,
      color: '#f48024',
      cloneChance: 0.30,
      cloneHpRatio: 0.30,
      maxClones: 5,
      enrageThreshold: 0.4,
    },
    blockchain: {
      name: 'The Blockchain',
      hp: 3000,
      speed: 30,
      speedEnraged: 60,
      damage: 30,
      radius: 55,
      xp: 80,
      color: '#627eea',
      puzzleInterval: 15,
      puzzleMemorizeTime: 2,
      puzzleSymbolCount: 3,
      vulnerableDuration: 5,
      wrongPenaltyHpMult: 1.5,
      enrageThreshold: 0.3,
    },
  },

  // Boss rotation order
  BOSS_ROTATION: ['windowsXP', 'stackOverflow', 'blockchain'],

  // Passive Items
  PASSIVE_ITEMS: {
    debugger:     { name: 'Debugger',     emoji: '🔧', bonus: 'critChance',   value: 0.10, desc: '+10% crit chance' },
    ci_cd:        { name: 'CI/CD',        emoji: '⚙️', bonus: 'cooldownMult', value: 0.10, desc: '-10% skill cooldowns' },
    package_json: { name: 'package.json', emoji: '📋', bonus: 'aoeRadius',    value: 0.15, desc: '+15% AOE radius' },
    typescript:   { name: 'TypeScript',   emoji: '🔷', bonus: 'damageBonus',  value: 0.10, desc: '+10% damage' },
    dockerfile:   { name: 'Dockerfile',   emoji: '🐳', bonus: 'maxHp',       value: 15,   desc: '+15 max HP' },
  },

  // Evolutions (skillId + passiveId → evolvedSkillId)
  EVOLUTIONS: {
    breakpoint:   { skill: 'console_log', passive: 'debugger',     name: 'Breakpoint',   emoji: '🔴', color: '#ff6b6b', freezeDuration: 3 },
    auto_deploy:  { skill: 'git_push',    passive: 'ci_cd',        name: 'Auto Deploy',  emoji: '🤖', color: '#58a6ff' },
    node_modules: { skill: 'npm_install',  passive: 'package_json', name: 'node_modules', emoji: '📁', color: '#f0883e', radiusMult: 3, freezeTime: 0.5 },
    strict_mode:  { skill: 'stack_trace',  passive: 'typescript',   name: 'Strict Mode',  emoji: '🔒', color: '#3178c6', eliteDmgMult: 2 },
    container:    { skill: 'hot_reload',   passive: 'dockerfile',   name: 'Container',    emoji: '📦', color: '#0db7ed', immuneDuration: 5, immuneCooldown: 60 },
  },

  // Spawner
  SPAWN_BASE_RATE: 1.5,         // seconds between spawns
  SPAWN_PER_WAVE: 2,            // enemies per spawn event

  // Skill level scaling (per level above 1)
  SKILL_SCALING: {
    console_log:  { dmgPerLvl: 5,  cdPerLvl: 0.1,  distPerLvl: 20 },
    git_push:     { dmgPerLvl: 10, cdPerLvl: 0.15 },
    npm_install:  { dmgPerLvl: 10, cdPerLvl: 0.3,  radiusMultLv3: 1.3 },
    stack_trace:  { dpsPerLvl: 15, cdPerLvl: 0.2,  durPerLvl: 0.1, dpsMultLv5: 2, targetsLv3: 2 },
    hot_reload:   { healPerLvl: 5, cdMultLv3: 0.7 },
    '404':        { dmgPerLvl: 5,  cdPerLvl: 0.4,  targetsLv3: 3 },
    sql_query:    { dmgPerLvl: 8,  cdPerLvl: 0.15, widthPerLvl: 10, lenPerLvl: 20 },
    exploit:      { dmgPerLvl: 8,  cdPerLvl: 0.1 },
  },

  // Upgrade passives
  PASSIVE_HP_PER_LEVEL: 20,
  PASSIVE_SPEED_PER_LEVEL: 0.1,   // +10% per level
  PASSIVE_MAGNET_PER_LEVEL: 0.25, // +25% per level

  // Meta progression
  COMMITS_PER_BOSS: 5,
  UNLOCK_COSTS: {
    heroes:     { backend_dev: 50, devops: 100, hacker: 200 },
    locations:  { staging: 30, legacy_codebase: 30, dark_mode: 50, cloud: 50, incident: 80, hackathon: 80, infinite_loop: 100, production_server: 150 },
    evolutions: { breakpoint: 40, auto_deploy: 40, node_modules: 40, strict_mode: 40, container: 40 },
  },

  // Collision spatial grid
  SPATIAL_CELL: 128,

  // Damage numbers
  DMG_NUM_SPEED: 60,
  DMG_NUM_LIFE: 0.8,

  // Colors
  BG: '#0d1117',
  GRID: '#161b22',
  BORDER: '#30363d',
  PLAYER: '#58a6ff',
  PLAYER_DIR: '#79c0ff',
  PLAYER_HIT: '#f85149',
  HP_BG: '#21262d',
  HP_HIGH: '#3fb950',
  HP_LOW: '#f85149',
  HP_BORDER: '#30363d',
  ENEMY_HP_BG: '#21262d',
  ENEMY_HIT: '#ffffff',
  TEXT: '#e6edf3',
  FPS: '#7ee787',
  DMG_TEXT: '#f0883e',
  KILL_TEXT: '#8b949e',
  XP_BAR_BG: '#21262d',
  XP_BAR_FILL: '#7ee787',
  XP_BAR_BORDER: '#30363d',
  LEVEL_TEXT: '#7ee787',
};

// ============================================================
// Bug.io — Sprite Loader & Animation System
// ============================================================

const SPRITE_FRAME_COUNT = 8;
const SPRITE_FPS = 10; // animation frames per second

// --- Sprite definitions ---
const SPRITE_MAP = {
  // key: { idle, walk, attack, frameW, frameH }
  player:       { prefix: 'player',       frameW: 69, frameH: 72 },
  bug:          { prefix: 'bug',          frameW: 69, frameH: 72 },
  infiniteLoop: { prefix: 'inf_loop',     frameW: 69, frameH: 72 },
  nullPointer:  { prefix: 'null_ptr',     frameW: 69, frameH: 72 },
  legacyCode:   { prefix: 'legacy',       frameW: 69, frameH: 72 },
  virus:        { prefix: 'virus',        frameW: 69, frameH: 72 },
  deprecatedPkg:{ prefix: 'depr_pkg',     frameW: 69, frameH: 72 },
  windowsXP:    { prefix: 'boss_xp',      frameW: 133, frameH: 136 },
  stackOverflow:{ prefix: 'boss_so',      frameW: 133, frameH: 136 },
  blockchain:   { prefix: 'boss_bc',      frameW: 133, frameH: 136 },
};

// --- Image cache ---
const spriteImages = {};
let spritesLoaded = false;
let spritesTotal = 0;
let spritesLoadedCount = 0;

function loadSprite(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      spriteImages[key] = img;
      spritesLoadedCount++;
      resolve();
    };
    img.onerror = () => {
      console.warn('Failed to load sprite:', src);
      spritesLoadedCount++;
      resolve();
    };
    img.src = src;
  });
}

async function loadAllSprites() {
  const promises = [];
  const basePath = 'assets/sprites/';

  for (const [type, def] of Object.entries(SPRITE_MAP)) {
    const anims = ['idle', 'walk', 'attack'];
    for (const anim of anims) {
      const key = type + '_' + anim;
      const src = basePath + def.prefix + '_' + anim + '.png';
      spritesTotal++;
      promises.push(loadSprite(key, src));
    }
  }

  await Promise.all(promises);
  spritesLoaded = true;
}

// --- Location background textures ---
const LOCATION_BG_MAP = {
  localhost:          'bg_localhost',
  staging:            'bg_staging',
  legacy_codebase:    'bg_legacy',
  dark_mode:          'bg_darkmode',
  cloud:              'bg_cloud',
  incident:           'bg_incident',
  hackathon:          'bg_hackathon',
  infinite_loop:      'bg_infinite_loop',
  production_server:  'bg_production',
};

const LOCATION_PROPS_MAP = {
  localhost:          'props_localhost',
  staging:            'props_staging',
  legacy_codebase:    'props_legacy',
  dark_mode:          'props_darkmode',
  cloud:              'props_cloud',
  incident:           'props_incident',
  hackathon:          'props_hackathon',
  infinite_loop:      'props_loop',
  production_server:  'props_production',
};

// Projectile sprite map: skillId -> file
const PROJECTILE_SPRITE_MAP = {
  console_log: 'proj_console',
  git_push:    'proj_gitpush',
  exploit:     'proj_exploit',
};

// Background pattern caches (created from loaded images)
const bgPatterns = {};
// Props: array of {x, y, propIdx} per location
let scatteredProps = [];
let propsLocationId = null;

async function loadAllSprites() {
  const promises = [];
  const basePath = 'assets/sprites/';

  // Character sprites
  for (const [type, def] of Object.entries(SPRITE_MAP)) {
    const anims = ['idle', 'walk', 'attack'];
    for (const anim of anims) {
      const key = type + '_' + anim;
      const src = basePath + def.prefix + '_' + anim + '.png';
      spritesTotal++;
      promises.push(loadSprite(key, src));
    }
  }

  // Location backgrounds
  for (const [locId, file] of Object.entries(LOCATION_BG_MAP)) {
    spritesTotal++;
    promises.push(loadSprite('bg_' + locId, basePath + file + '.png'));
  }

  // Location props
  for (const [locId, file] of Object.entries(LOCATION_PROPS_MAP)) {
    spritesTotal++;
    promises.push(loadSprite('props_' + locId, basePath + file + '.png'));
  }

  // Projectile sprites
  for (const [skillId, file] of Object.entries(PROJECTILE_SPRITE_MAP)) {
    spritesTotal++;
    promises.push(loadSprite('proj_' + skillId, basePath + file + '.png'));
  }

  await Promise.all(promises);
  spritesLoaded = true;
}

// Create tileable pattern from a loaded background image
function getLocationBgPattern(locationId) {
  if (bgPatterns[locationId]) return bgPatterns[locationId];
  const img = spriteImages['bg_' + locationId];
  if (!img) return null;
  const pat = ctx.createPattern(img, 'repeat');
  if (pat) bgPatterns[locationId] = pat;
  return pat;
}

// Generate scattered props for the current location
function generateScatteredProps(locationId) {
  if (propsLocationId === locationId) return;
  propsLocationId = locationId;
  scatteredProps = [];

  const img = spriteImages['props_' + locationId];
  if (!img) return;

  // Scatter ~60 props across the map
  const count = 60;
  const margin = 100;
  for (let i = 0; i < count; i++) {
    scatteredProps.push({
      x: margin + Math.random() * (CONFIG.MAP_WIDTH - margin * 2),
      y: margin + Math.random() * (CONFIG.MAP_HEIGHT - margin * 2),
      propIdx: Math.floor(Math.random() * 4), // 4 props per spritesheet
      scale: 0.6 + Math.random() * 0.4,
    });
  }
}

// Draw a single prop from the props spritesheet
function drawProp(locationId, x, y, propIdx, scale) {
  const img = spriteImages['props_' + locationId];
  if (!img) return;

  const propW = 64;
  const propH = 64;
  const sx = propIdx * propW;
  const drawSize = propW * (scale || 1);

  ctx.drawImage(
    img,
    sx, 0, propW, propH,
    x - drawSize / 2, y - drawSize / 2, drawSize, drawSize
  );
}

// Draw a projectile sprite (returns true if drawn)
function drawProjectileSprite(skillId, x, y, radius, angle) {
  const img = spriteImages['proj_' + skillId];
  if (!img) return false;

  const drawSize = radius * 3;
  ctx.save();
  ctx.translate(x, y);
  if (angle !== undefined) ctx.rotate(angle);
  ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  ctx.restore();
  return true;
}

// Start loading immediately
loadAllSprites();

// --- Animation state per entity ---
// Entities need: _animTimer (float), _animState ('idle'|'walk'|'attack')

function getAnimFrame(timer) {
  return Math.floor(timer * SPRITE_FPS) % SPRITE_FRAME_COUNT;
}

// --- Draw sprite ---
function drawAnimatedSprite(type, x, y, radius, animState, animTimer, flipX) {
  const def = SPRITE_MAP[type];
  if (!def) return false;

  const key = type + '_' + (animState || 'idle');
  const img = spriteImages[key];
  if (!img) return false;

  const frame = getAnimFrame(animTimer || 0);
  const sx = frame * def.frameW;
  const sy = 0;

  // Scale sprite to match entity radius
  const scale = (radius * 2.4) / def.frameH;
  const drawW = def.frameW * scale;
  const drawH = def.frameH * scale;

  ctx.save();
  ctx.translate(x, y);
  if (flipX) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    img,
    sx, sy, def.frameW, def.frameH,
    -drawW / 2, -drawH / 2, drawW, drawH
  );
  ctx.restore();

  return true;
}

// Determine animation state for an enemy
function getEnemyAnimState(e) {
  const moving = Math.abs(e.dirX) > 0.01 || Math.abs(e.dirY) > 0.01;
  if (e.hitFlash > 0) return 'attack';
  return moving ? 'walk' : 'idle';
}

// Determine animation state for player
function getPlayerAnimState() {
  const moving = keys.has('KeyW') || keys.has('KeyS') || keys.has('KeyA') || keys.has('KeyD')
    || keys.has('ArrowUp') || keys.has('ArrowDown') || keys.has('ArrowLeft') || keys.has('ArrowRight');
  if (playerHitFlash > 0) return 'attack';
  return moving ? 'walk' : 'idle';
}

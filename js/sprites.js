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

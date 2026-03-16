// ============================================================
// Bug.io — Game Loop & Core (TASK-01, TASK-02)
// ============================================================

// --- Game States ---
const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
  VICTORY: 'VICTORY',
};

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const pauseOverlay = document.getElementById('pause-overlay');
const fpsCounter = document.getElementById('fps-counter');

let canvasWidth = 0;
let canvasHeight = 0;
let dpr = 1;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Debug Mode ---
const debug = {
  enabled: false,
  godMode: false,
};

// --- Input ---
const keys = new Set();

window.addEventListener('keydown', (e) => {
  keys.add(e.code);

  // Alt+D toggles debug mode
  if (e.altKey && e.code === 'KeyD') {
    debug.enabled = !debug.enabled;
    e.preventDefault();
    return;
  }

  // Debug: G = god mode, K = kill all enemies, L = level up, T = add 10s
  if (debug.enabled && game.state === GameState.PLAYING) {
    if (e.code === 'KeyG') {
      debug.godMode = !debug.godMode;
      if (debug.godMode) { player.hp = player.maxHp; }
      return;
    }
    if (e.code === 'KeyK') {
      for (const en of enemies) en.hp = 0;
      return;
    }
    if (e.code === 'KeyL') {
      addXp(player.xpToNext - player.xp);
      return;
    }
    if (e.code === 'KeyT') {
      game.elapsed += 10;
      return;
    }
  }

  if (e.code === 'Escape') {
    if (typeof levelUpActive !== 'undefined' && levelUpActive) return;
    if (game.state === GameState.PLAYING) {
      game.state = GameState.PAUSED;
      pauseOverlay.classList.add('visible');
    } else if (game.state === GameState.PAUSED) {
      game.state = GameState.PLAYING;
      pauseOverlay.classList.remove('visible');
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

// --- Player ---
const player = {
  x: CONFIG.MAP_WIDTH / 2,
  y: CONFIG.MAP_HEIGHT / 2,
  radius: CONFIG.PLAYER_RADIUS,
  speed: CONFIG.PLAYER_SPEED,
  hp: CONFIG.PLAYER_MAX_HP,
  maxHp: CONFIG.PLAYER_MAX_HP,
  level: 1,
  xp: 0,
  xpToNext: Math.round(5 * Math.pow(1, 1.5)),
  dirX: 0,
  dirY: 1,
  _bsodSlowTimer: 0,
  _slowedByField: false,
  _containerImmune: false,
  // Passive item bonuses
  critChance: 0,
  cooldownMult: 1,
  aoeRadiusMult: 1,
  damageMult: 1,
};

// --- Camera ---
const camera = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
};

function updateCamera(dt) {
  camera.targetX = player.x - canvasWidth / 2;
  camera.targetY = player.y - canvasHeight / 2;
  const lerp = 1 - Math.pow(0.001, dt);
  camera.x += (camera.targetX - camera.x) * lerp;
  camera.y += (camera.targetY - camera.y) * lerp;
}

// --- Player update ---
function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;

  if (dx !== 0 && dy !== 0) {
    const inv = 1 / Math.SQRT2;
    dx *= inv;
    dy *= inv;
  }

  if (dx !== 0 || dy !== 0) {
    player.dirX = dx;
    player.dirY = dy;
  }

  // Apply speed modifiers
  let speedMult = 1;
  if (player._bsodSlowTimer > 0) speedMult *= 0.2;
  if (player._slowedByField) speedMult *= 0.5;
  // Incident/Outage speed bonus
  if (typeof getIncidentSpeedMult === 'function') speedMult *= getIncidentSpeedMult();

  player.x += dx * player.speed * speedMult * dt;
  player.y += dy * player.speed * speedMult * dt;

  player.x = Math.max(player.radius, Math.min(CONFIG.MAP_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(CONFIG.MAP_HEIGHT - player.radius, player.y));
}

// --- Render ---
function renderBackground() {
  ctx.fillStyle = CONFIG.BG;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  ctx.strokeStyle = CONFIG.GRID;
  ctx.lineWidth = 1;

  const gridSize = CONFIG.GRID_SIZE;
  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;

  for (let x = startX; x < camera.x + canvasWidth + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, camera.y);
    ctx.lineTo(x, camera.y + canvasHeight);
    ctx.stroke();
  }

  for (let y = startY; y < camera.y + canvasHeight + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(camera.x, y);
    ctx.lineTo(camera.x + canvasWidth, y);
    ctx.stroke();
  }

  ctx.strokeStyle = CONFIG.BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);

  ctx.restore();
}

function renderPlayer() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  const px = player.x;
  const py = player.y;

  ctx.fillStyle = playerHitFlash > 0 ? CONFIG.PLAYER_HIT : CONFIG.PLAYER;

  if (playerIframeTimer > 0 && Math.floor(playerIframeTimer * 10) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  ctx.beginPath();
  ctx.arc(px, py, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // Direction arrow
  const arrowLen = player.radius + 8;
  const ax = px + player.dirX * arrowLen;
  const ay = py + player.dirY * arrowLen;
  ctx.strokeStyle = CONFIG.PLAYER_DIR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  ctx.restore();
}

// --- Debug Rendering ---
function renderDebug() {
  if (!debug.enabled) return;

  // Collision circles (world space)
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.lineWidth = 1;

  // Player collision circle
  ctx.strokeStyle = '#00ff00';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Magnet radius
  const magnetLevel = typeof getUpgradeLevel === 'function' ? getUpgradeLevel('magnet') : 0;
  const magnetR = CONFIG.PLAYER_MAGNET_RADIUS * (1 + magnetLevel * CONFIG.PASSIVE_MAGNET_PER_LEVEL);
  ctx.strokeStyle = 'rgba(126, 231, 135, 0.3)';
  ctx.beginPath();
  ctx.arc(player.x, player.y, magnetR, 0, Math.PI * 2);
  ctx.stroke();

  // Enemy collision circles
  for (const e of enemies) {
    if (e.x + e.radius < camera.x - 20 || e.x - e.radius > camera.x + canvasWidth + 20 ||
        e.y + e.radius < camera.y - 20 || e.y - e.radius > camera.y + canvasHeight + 20) continue;
    ctx.strokeStyle = e.hp > 0 ? '#ff4444' : '#444444';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Projectile collision circles
  ctx.strokeStyle = '#ffff00';
  for (const p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // Debug HUD (screen space)
  ctx.save();
  ctx.font = '11px monospace';
  ctx.fillStyle = '#00ff00';
  ctx.textAlign = 'left';
  const lines = [
    'DEBUG MODE (Alt+D to toggle)',
    `God: ${debug.godMode ? 'ON' : 'OFF'} [G]  Kill All [K]  Level Up [L]  +10s [T]`,
    `Enemies: ${enemies.length}  Projectiles: ${projectiles.length}  Particles: ${particles.length}`,
    `Player: (${Math.round(player.x)}, ${Math.round(player.y)})  HP: ${Math.round(player.hp)}/${player.maxHp}`,
    `Elapsed: ${Math.round(game.elapsed)}s  Wave: ${spawner.waveNumber}  FPS: ${game.fps}`,
    `Level: ${player.level}  XP: ${player.xp}/${player.xpToNext}  Kills: ${killCount}`,
  ];
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], 10, canvasHeight - 10 - (lines.length - 1 - i) * 14);
  }
  ctx.restore();
}

// --- Game object ---
const game = {
  state: GameState.MENU,
  elapsed: 0,
  lastTime: 0,
  frameCount: 0,
  fpsTime: 0,
  fps: 0,
};

// --- Main loop ---
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (game.lastTime === 0) {
    game.lastTime = timestamp;
  }

  let dt = (timestamp - game.lastTime) / 1000;
  game.lastTime = timestamp;

  if (dt > CONFIG.MAX_DELTA) dt = CONFIG.MAX_DELTA;

  // FPS counter
  game.frameCount++;
  game.fpsTime += dt;
  if (game.fpsTime >= 0.5) {
    game.fps = Math.round(game.frameCount / game.fpsTime);
    fpsCounter.textContent = `${game.fps} FPS`;
    game.frameCount = 0;
    game.fpsTime = 0;
  }

  // Update
  if (game.state === GameState.PLAYING) {
    game.elapsed += dt;
    updatePlayer(dt);
    updateCamera(dt);
    updateSpawner(dt);
    updateEnemies(dt);
    updateSkills(dt);
    updateProjectiles(dt);
    updateCollisions(dt);
    updateXpGems(dt);
    updateLootChests(dt);
    updateDamageNumbers(dt);
    updateParticles(dt);
    updateScreenShake(dt);
    updateMovingBg(dt);
    if (typeof updateLocationMechanics === 'function') updateLocationMechanics(dt);
    checkVictory();
  }

  // Render
  // Apply screen shake offset
  const shake = getShakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);

  renderBackground();
  renderMovingBgPattern();
  if (game.state !== GameState.MENU) {
    renderXpGems();
    renderLootChests();
    renderEnemies();
    renderProjectiles();
    renderParticles();
    renderSkills();
    renderPlayer();
    if (typeof renderLocationWorld === 'function') renderLocationWorld();
    renderDamageNumbers();
    if (typeof renderLocationPostProcess === 'function') renderLocationPostProcess();
  }

  ctx.restore(); // end shake offset

  // HUD renders without shake
  if (game.state !== GameState.MENU) {
    renderHUD();
    if (typeof renderLocationHUD === 'function') renderLocationHUD();
    renderDebug();
  }
}

// --- Start ---
requestAnimationFrame(gameLoop);

// Launch menu flow
if (typeof initMenuFlow === 'function') {
  initMenuFlow();
}

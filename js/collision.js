// ============================================================
// Bug.io — Collision Detection & Damage (TASK-04 / TASK-08)
// ============================================================

// --- Spatial grid ---
const spatialGrid = {};

function spatialKey(cx, cy) {
  return cx + ',' + cy;
}

function buildSpatialGrid() {
  for (const key in spatialGrid) delete spatialGrid[key];
  const cell = CONFIG.SPATIAL_CELL;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const cx = Math.floor(e.x / cell);
    const cy = Math.floor(e.y / cell);
    const key = spatialKey(cx, cy);
    if (!spatialGrid[key]) spatialGrid[key] = [];
    spatialGrid[key].push(e);
  }
}

function getEnemiesNear(x, y, radius) {
  const cell = CONFIG.SPATIAL_CELL;
  const minCX = Math.floor((x - radius) / cell);
  const maxCX = Math.floor((x + radius) / cell);
  const minCY = Math.floor((y - radius) / cell);
  const maxCY = Math.floor((y + radius) / cell);
  const result = [];
  for (let cx = minCX; cx <= maxCX; cx++) {
    for (let cy = minCY; cy <= maxCY; cy++) {
      const bucket = spatialGrid[spatialKey(cx, cy)];
      if (bucket) {
        for (let i = 0; i < bucket.length; i++) result.push(bucket[i]);
      }
    }
  }
  return result;
}

// --- Circle collision ---
function circleCollide(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = dx * dx + dy * dy;
  const radii = a.radius + b.radius;
  return dist < radii * radii;
}

// --- Damage numbers ---
const damageNumbers = [];

function spawnDamageNumber(x, y, value, color) {
  damageNumbers.push({
    x,
    y,
    value,
    color: color || CONFIG.DMG_TEXT,
    alpha: 1,
    vy: -CONFIG.DMG_NUM_SPEED,
    life: CONFIG.DMG_NUM_LIFE,
  });
}

function updateDamageNumbers(dt) {
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.y += d.vy * dt;
    d.life -= dt;
    d.alpha = Math.max(0, d.life / CONFIG.DMG_NUM_LIFE);
    if (d.life <= 0) damageNumbers.splice(i, 1);
  }
}

function renderDamageNumbers() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < damageNumbers.length; i++) {
    const d = damageNumbers[i];
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = d.color;
    ctx.fillText(String(d.value), d.x, d.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Player iframe tracking ---
let playerIframeTimer = 0;
let playerHitFlash = 0;

// --- Kill counter ---
let killCount = 0;
const killsByType = {};

// --- Collision checks ---
function updateCollisions(dt) {
  buildSpatialGrid();

  // Player iframes
  if (playerIframeTimer > 0) playerIframeTimer -= dt;
  if (playerHitFlash > 0) playerHitFlash -= dt;

  // Player vs enemies
  const nearPlayer = getEnemiesNear(player.x, player.y, player.radius + 50);
  for (let i = 0; i < nearPlayer.length; i++) {
    const e = nearPlayer[i];
    if (e.hp <= 0) continue;
    // Per-enemy contact cooldown to prevent jitter
    if (e._contactCd > 0) { e._contactCd -= dt; continue; }
    if (circleCollide(player, e)) {
      // Damage player (respect iframes and container immunity)
      if (playerIframeTimer <= 0 && !player._containerImmune) {
        // Knockback enemy only when dealing damage
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        e.x += (dx / dist) * CONFIG.KNOCKBACK_DIST;
        e.y += (dy / dist) * CONFIG.KNOCKBACK_DIST;
        e._contactCd = 0.4; // prevent immediate re-collision

        // Check shield first
        if (typeof checkShieldAbsorb === 'function' && checkShieldAbsorb()) {
          playerIframeTimer = CONFIG.PLAYER_IFRAMES;
          spawnDamageNumber(player.x, player.y - player.radius, 'BLOCKED', '#58a6ff');
        } else {
          player.hp -= e.damage;
          playerIframeTimer = CONFIG.PLAYER_IFRAMES;
          playerHitFlash = 0.2;
          spawnDamageNumber(player.x, player.y - player.radius, e.damage, CONFIG.HP_LOW);
          if (player.hp <= 0) {
            player.hp = 0;
            game.state = GameState.GAMEOVER;
            handleDeath();
          }
        }
      }
    }
  }

  // Projectiles vs enemies
  for (let pi = projectiles.length - 1; pi >= 0; pi--) {
    const p = projectiles[pi];
    const nearProj = getEnemiesNear(p.x, p.y, p.radius + 30);
    let hit = false;
    for (let ei = 0; ei < nearProj.length; ei++) {
      const e = nearProj[ei];
      if (e.hp <= 0) continue;
      if (circleCollide(p, e)) {
        let dmg = p.damage;
        // Apply global damage multiplier (for passives applied at fire time this is already included, but for base skills it's not)
        e.hp -= dmg;
        e.hitFlash = 0.1;
        e.damaged = true;
        spawnDamageNumber(e.x, e.y - e.radius, Math.round(dmg));
        if (e.hp <= 0) {
          killCount++;
        }
        // Breakpoint evolution: freeze enemy on hit
        if (p.onHit === 'freeze' && e.hp > 0) {
          e.frozen = true;
          e.frozenTimer = p.freezeDuration || 3;
        }
        if (!p.piercing) {
          hit = true;
          break;
        }
      }
    }
    if (hit) projectiles.splice(pi, 1);
  }

  // Remove dead enemies
  removeDeadEnemies();
}

function removeDeadEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      const e = enemies[i];
      // Track kills by type
      killsByType[e.type] = (killsByType[e.type] || 0) + 1;
      // Emit event for quest system
      if (typeof gameEvents !== 'undefined') gameEvents.emit('enemyKill', e);
      spawnXpGem(e.x, e.y, e.xp);
      // Handle Virus death spawns
      if (typeof handleEnemyDeath === 'function') {
        handleEnemyDeath(e);
      }
      // Clear boss reference
      if (e.isBoss && bossState.active === e) {
        bossState.active = null;
        bossState.warningShown = false;
        if (typeof bossesKilledThisRun !== 'undefined') bossesKilledThisRun++;
        if (typeof gameEvents !== 'undefined') gameEvents.emit('bossKill', e);
        const bossBar = document.getElementById('boss-hp-bar');
        if (bossBar) bossBar.classList.remove('visible');
      }
      enemies.splice(i, 1);
    }
  }
}

// ============================================================
// Bug.io — Enemies, Elites & Boss (TASK-03 / TASK-09)
// ============================================================

const enemies = [];
const enemyTypeKeys = ['bug', 'infiniteLoop', 'nullPointer'];
const eliteTypeKeys = ['legacyCode', 'virus', 'deprecatedPkg'];

const spawner = {
  timer: 0,
  baseRate: 1.5,
  perSpawn: 2,
  waveNumber: 0,
  unlockedTypes: 1,
  eliteTimer: 0,
  eliteUnlocked: false,
};

// --- Boss state ---
const bossState = {
  active: null,       // current boss enemy reference
  nextSpawnTime: CONFIG.BOSS.spawnInterval,
  warningTimer: 0,
  warningShown: false,
  aoeTimer: 0,
  aoeWarningTimer: 0,
  aoeActive: null,    // { x, y, radius, timer }
};

function spawnEnemy(type, isElite) {
  const defs = isElite ? CONFIG.ELITE_TYPES : CONFIG.ENEMY_TYPES;
  const def = defs[type];
  if (!def) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(canvasWidth, canvasHeight) / 2 + CONFIG.SPAWN_MARGIN;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;

  if (x < 0 || x > CONFIG.MAP_WIDTH || y < 0 || y > CONFIG.MAP_HEIGHT) return;

  const e = {
    x, y,
    radius: def.radius,
    speed: def.speed,
    hp: def.hp,
    maxHp: def.hp,
    damage: def.damage,
    xp: def.xp,
    type,
    color: def.color,
    shape: def.shape,
    dirX: 0, dirY: 0,
    dirFrame: 0,
    hitFlash: 0,
    damaged: false,
    isElite: !!isElite,
    isBoss: false,
    // Slow/freeze
    slowTimer: 0,
    slowFactor: 1,
    frozen: false,
    frozenTimer: 0,
    // Elite-specific
    regenRate: def.regen || 0,
    spawnOnDeath: def.spawnOnDeath || 0,
    slowRadius: def.slowRadius || 0,
    slowFieldFactor: def.slowFactor || 1,
  };

  enemies.push(e);
  return e;
}

function spawnBoss() {
  const def = CONFIG.BOSS;
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.max(canvasWidth, canvasHeight) / 2 + CONFIG.SPAWN_MARGIN;
  const x = player.x + Math.cos(angle) * dist;
  const y = player.y + Math.sin(angle) * dist;

  const boss = {
    x: Math.max(def.radius, Math.min(CONFIG.MAP_WIDTH - def.radius, x)),
    y: Math.max(def.radius, Math.min(CONFIG.MAP_HEIGHT - def.radius, y)),
    radius: def.radius,
    speed: def.speed,
    hp: def.hp,
    maxHp: def.hp,
    damage: def.damage,
    xp: def.xp,
    type: 'windowsXP',
    color: def.color,
    shape: def.shape,
    dirX: 0, dirY: 0,
    dirFrame: 0,
    hitFlash: 0,
    damaged: false,
    isElite: false,
    isBoss: true,
    slowTimer: 0, slowFactor: 1,
    frozen: false, frozenTimer: 0,
    regenRate: 0, spawnOnDeath: 0,
    slowRadius: 0, slowFieldFactor: 1,
  };

  enemies.push(boss);
  bossState.active = boss;
  bossState.aoeTimer = def.aoeInterval;
  bossState.aoeWarningTimer = 0;
  bossState.warningShown = false;
  bossState.warningTimer = 0;

  // Show boss HP bar
  const bossBar = document.getElementById('boss-hp-bar');
  if (bossBar) bossBar.classList.add('visible');
}

function updateSpawner(dt) {
  // Stop spawning during refactoring
  if (typeof refactoring !== 'undefined' && refactoring) return;
  const elapsed = game.elapsed;

  // Unlock new types over time
  spawner.unlockedTypes = Math.min(
    enemyTypeKeys.length,
    1 + Math.floor(elapsed / CONFIG.NEW_TYPE_INTERVAL)
  );

  // Wave scaling
  spawner.waveNumber = Math.floor(elapsed / CONFIG.WAVE_INTERVAL);
  const scale = 1 + spawner.waveNumber * CONFIG.WAVE_SCALE;

  spawner.timer -= dt;
  if (spawner.timer <= 0) {
    spawner.timer = spawner.baseRate / scale;
    const count = Math.ceil(spawner.perSpawn * scale);
    for (let i = 0; i < count; i++) {
      if (enemies.length >= CONFIG.MAX_ENEMIES) break;
      const typeIdx = Math.floor(Math.random() * spawner.unlockedTypes);
      spawnEnemy(enemyTypeKeys[typeIdx], false);
    }
  }

  // Elite spawning
  if (elapsed >= CONFIG.ELITE_UNLOCK_TIME) {
    spawner.eliteTimer -= dt;
    if (spawner.eliteTimer <= 0) {
      spawner.eliteTimer = CONFIG.ELITE_SPAWN_INTERVAL;
      // Pick random elite type based on time
      const unlockedElites = Math.min(
        eliteTypeKeys.length,
        1 + Math.floor((elapsed - CONFIG.ELITE_UNLOCK_TIME) / 60)
      );
      const idx = Math.floor(Math.random() * unlockedElites);
      spawnEnemy(eliteTypeKeys[idx], true);
    }
  }

  // Boss spawning
  updateBoss(dt, elapsed);

  // Cull farthest if over max
  if (enemies.length > CONFIG.MAX_ENEMIES) {
    enemies.sort((a, b) => {
      if (a.isBoss) return -1;
      if (b.isBoss) return 1;
      const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
      const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
      return da - db;
    });
    enemies.length = CONFIG.MAX_ENEMIES;
  }
}

function updateBoss(dt, elapsed) {
  const def = CONFIG.BOSS;

  // Boss warning
  if (!bossState.active && elapsed >= bossState.nextSpawnTime - def.warningTime && !bossState.warningShown) {
    bossState.warningShown = true;
    bossState.warningTimer = def.warningTime;
  }

  if (bossState.warningTimer > 0) {
    bossState.warningTimer -= dt;
    if (bossState.warningTimer <= 0 && !bossState.active) {
      spawnBoss();
      bossState.nextSpawnTime = elapsed + def.spawnInterval;
    }
  }

  // Spawn without warning if time passed
  if (!bossState.active && !bossState.warningShown && elapsed >= bossState.nextSpawnTime) {
    bossState.warningShown = true;
    bossState.warningTimer = def.warningTime;
  }

  // Boss AI
  if (bossState.active) {
    const boss = bossState.active;
    if (boss.hp <= 0) {
      bossState.active = null;
      bossState.warningShown = false;
      bossState.aoeActive = null;
      const bossBar = document.getElementById('boss-hp-bar');
      if (bossBar) bossBar.classList.remove('visible');
      return;
    }

    // Enrage at low HP
    if (boss.hp / boss.maxHp < def.enrageThreshold) {
      boss.speed = def.speedEnraged;
    }

    // AOE attack
    bossState.aoeTimer -= dt;
    if (bossState.aoeTimer <= 0 && !bossState.aoeActive) {
      // Start warning
      bossState.aoeWarningTimer = def.aoeWarning;
      bossState.aoeTimer = def.aoeInterval;
    }

    if (bossState.aoeWarningTimer > 0) {
      bossState.aoeWarningTimer -= dt;
      if (bossState.aoeWarningTimer <= 0) {
        // Execute AOE - freeze zone
        bossState.aoeActive = {
          x: boss.x, y: boss.y,
          radius: def.aoeRadius,
          timer: def.aoeDuration,
        };
        // Freeze enemies in zone (for visual effect) and damage player if in range
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        if (dx * dx + dy * dy < def.aoeRadius * def.aoeRadius) {
          // Player freeze: slow to 20% for duration
          player._bsodSlowTimer = def.aoeDuration;
        }
      }
    }

    // Active AOE zone
    if (bossState.aoeActive) {
      bossState.aoeActive.timer -= dt;
      if (bossState.aoeActive.timer <= 0) {
        bossState.aoeActive = null;
      }
    }

    // Update boss HP bar
    updateBossHpBar(boss);
  }
}

function updateBossHpBar(boss) {
  const fill = document.getElementById('boss-hp-fill');
  const text = document.getElementById('boss-hp-text');
  if (fill) {
    fill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
    fill.style.backgroundColor = boss.hp / boss.maxHp < 0.5 ? '#f85149' : CONFIG.BOSS.color;
  }
  if (text) {
    text.textContent = `Windows XP — ${Math.ceil(boss.hp)}/${boss.maxHp}`;
  }
}

function updateEnemies(dt) {
  // Player BSOD slow
  if (player._bsodSlowTimer > 0) {
    player._bsodSlowTimer -= dt;
  }

  // Check if player is in any Deprecated Package slow field
  let playerSlowed = false;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.slowRadius > 0 && e.hp > 0) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      if (dx * dx + dy * dy < e.slowRadius * e.slowRadius) {
        playerSlowed = true;
        break;
      }
    }
  }
  player._slowedByField = playerSlowed;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];

    // Frozen check
    if (e.frozenTimer > 0) {
      e.frozenTimer -= dt;
      e.frozen = e.frozenTimer > 0;
    }
    if (e.frozen) {
      if (e.hitFlash > 0) e.hitFlash -= dt;
      continue;
    }

    // Slow timer
    if (e.slowTimer > 0) {
      e.slowTimer -= dt;
      if (e.slowTimer <= 0) e.slowFactor = 1;
    }

    // Elite: Legacy Code regen
    if (e.regenRate > 0 && e.hp < e.maxHp) {
      e.hp = Math.min(e.maxHp, e.hp + e.regenRate * dt);
    }

    // Recalculate direction periodically
    e.dirFrame++;
    if (e.dirFrame >= CONFIG.ENEMY_AI_INTERVAL) {
      e.dirFrame = 0;
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        e.dirX = dx / dist;
        e.dirY = dy / dist;
      }
    }

    const debtMult = typeof getTechDebtMultiplier === 'function' ? getTechDebtMultiplier() : 1;
    // During refactoring, enemies don't move
    const refactorFreeze = (typeof refactoring !== 'undefined' && refactoring) ? 0 : 1;
    // Incident/Outage: enemy speed boost from wrong answer
    const incidentEnemyMult = typeof getIncidentEnemySpeedMult === 'function' ? getIncidentEnemySpeedMult(e) : 1;
    const speedMult = e.slowFactor * debtMult * refactorFreeze * incidentEnemyMult;
    e.x += e.dirX * e.speed * speedMult * dt;
    e.y += e.dirY * e.speed * speedMult * dt;

    // Clamp to map
    e.x = Math.max(e.radius, Math.min(CONFIG.MAP_WIDTH - e.radius, e.x));
    e.y = Math.max(e.radius, Math.min(CONFIG.MAP_HEIGHT - e.radius, e.y));

    if (e.hitFlash > 0) e.hitFlash -= dt;
  }
}

function renderEnemies() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];

    if (e.x + e.radius < camera.x - 20 || e.x - e.radius > camera.x + canvasWidth + 20 ||
        e.y + e.radius < camera.y - 20 || e.y - e.radius > camera.y + canvasHeight + 20) continue;

    const fill = e.hitFlash > 0 ? CONFIG.ENEMY_HIT : (e.frozen ? '#88ccff' : e.color);

    // Draw based on shape
    if (e.isBoss) {
      renderBoss(e, fill);
    } else if (e.shape === 'circle') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.shape === 'square') {
      ctx.fillStyle = fill;
      ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
    } else if (e.shape === 'triangle') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.radius);
      ctx.lineTo(e.x - e.radius, e.y + e.radius);
      ctx.lineTo(e.x + e.radius, e.y + e.radius);
      ctx.closePath();
      ctx.fill();
    } else if (e.shape === 'hexagon') {
      renderPolygon(e.x, e.y, e.radius, 6, fill);
      // Regen particles
      if (e.regenRate > 0 && Math.random() < 0.1) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#3fb950';
        ctx.beginPath();
        ctx.arc(
          e.x + (Math.random() - 0.5) * e.radius * 2,
          e.y + (Math.random() - 0.5) * e.radius * 2,
          2, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else if (e.shape === 'diamond') {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.radius);
      ctx.lineTo(e.x + e.radius * 0.7, e.y);
      ctx.lineTo(e.x, e.y + e.radius);
      ctx.lineTo(e.x - e.radius * 0.7, e.y);
      ctx.closePath();
      ctx.fill();
    } else if (e.shape === 'pentagon') {
      renderPolygon(e.x, e.y, e.radius, 5, fill);
      // Slow field visual
      if (e.slowRadius > 0) {
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.slowRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
    }

    // Elite glow
    if (e.isElite && e.hitFlash <= 0) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // HP bar (only if damaged)
    if (e.damaged && e.hp > 0 && !e.isBoss) {
      const barW = e.radius * 2;
      const barH = 3;
      const barX = e.x - e.radius;
      const barY = e.y - e.radius - 6;
      ctx.fillStyle = CONFIG.ENEMY_HP_BG;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = e.color;
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
    }
  }

  // Boss AOE warning
  if (bossState.active && bossState.aoeWarningTimer > 0) {
    const boss = bossState.active;
    const flash = Math.sin(bossState.aoeWarningTimer * 10) * 0.5 + 0.5;
    ctx.globalAlpha = flash * 0.3;
    ctx.fillStyle = '#f85149';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, CONFIG.BOSS.aoeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = flash * 0.6;
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Active BSOD zone
  if (bossState.aoeActive) {
    const aoe = bossState.aoeActive;
    const alpha = aoe.timer / CONFIG.BOSS.aoeDuration;
    ctx.globalAlpha = alpha * 0.25;
    ctx.fillStyle = '#0078d4';
    ctx.beginPath();
    ctx.arc(aoe.x, aoe.y, aoe.radius, 0, Math.PI * 2);
    ctx.fill();
    // BSOD text
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BSOD', aoe.x, aoe.y - 10);
    ctx.font = '10px monospace';
    ctx.fillText(':( Your PC ran into a problem', aoe.x, aoe.y + 8);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Boss warning HUD (screen-space)
  if (bossState.warningTimer > 0 && !bossState.active) {
    const flash = Math.sin(bossState.warningTimer * 6) * 0.5 + 0.5;
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#f85149';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ BOSS INCOMING', canvasWidth / 2, canvasHeight / 2 - 60);
    ctx.globalAlpha = 1;
  }
}

function renderBoss(e, fill) {
  // Windows XP style: rounded rectangle with logo
  const r = e.radius;
  ctx.fillStyle = fill;

  // Body (rounded rect)
  ctx.beginPath();
  const rx = e.x - r;
  const ry = e.y - r;
  const w = r * 2;
  const h = r * 2;
  const cr = 10;
  ctx.moveTo(rx + cr, ry);
  ctx.lineTo(rx + w - cr, ry);
  ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + cr);
  ctx.lineTo(rx + w, ry + h - cr);
  ctx.quadraticCurveTo(rx + w, ry + h, rx + w - cr, ry + h);
  ctx.lineTo(rx + cr, ry + h);
  ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - cr);
  ctx.lineTo(rx, ry + cr);
  ctx.quadraticCurveTo(rx, ry, rx + cr, ry);
  ctx.closePath();
  ctx.fill();

  // XP text
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r * 0.5)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('XP', e.x, e.y - r * 0.15);
  ctx.font = `${Math.round(r * 0.25)}px monospace`;
  ctx.fillText('Windows', e.x, e.y + r * 0.3);
  ctx.textBaseline = 'alphabetic';

  // Enrage glow
  if (e.hp / e.maxHp < CONFIG.BOSS.enrageThreshold) {
    ctx.globalAlpha = 0.3 + Math.sin(game.elapsed * 8) * 0.2;
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function renderPolygon(x, y, radius, sides, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// Handle Virus death spawns
function handleEnemyDeath(e) {
  if (e.spawnOnDeath > 0) {
    for (let i = 0; i < e.spawnOnDeath; i++) {
      const bugDef = CONFIG.ENEMY_TYPES.bug;
      const angle = (i / e.spawnOnDeath) * Math.PI * 2;
      const ox = Math.cos(angle) * 20;
      const oy = Math.sin(angle) * 20;
      enemies.push({
        x: e.x + ox, y: e.y + oy,
        radius: bugDef.radius * 0.8,
        speed: bugDef.speed * 1.2,
        hp: bugDef.hp * 0.5,
        maxHp: bugDef.hp * 0.5,
        damage: bugDef.damage,
        xp: 1,
        type: 'bug',
        color: e.color,
        shape: 'circle',
        dirX: 0, dirY: 0,
        dirFrame: 0,
        hitFlash: 0,
        damaged: false,
        isElite: false, isBoss: false,
        slowTimer: 0, slowFactor: 1,
        frozen: false, frozenTimer: 0,
        regenRate: 0, spawnOnDeath: 0,
        slowRadius: 0, slowFieldFactor: 1,
      });
    }
  }
}

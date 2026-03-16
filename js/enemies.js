// ============================================================
// Bug.io — Enemies, Elites & Boss (TASK-03 / TASK-09)
// ============================================================

const enemies = [];
const enemyTypeKeys = ['bug', 'infiniteLoop', 'nullPointer'];
const eliteTypeKeys = ['legacyCode', 'virus', 'deprecatedPkg'];

const spawner = {
  timer: 0,
  baseRate: CONFIG.SPAWN_BASE_RATE,
  perSpawn: CONFIG.SPAWN_PER_WAVE,
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
  rotationIndex: 0,   // cycles through BOSS_ROTATION
  // Stack Overflow
  cloneCount: 0,
  // Blockchain
  puzzleTimer: 0,
  puzzleActive: false,
  immune: false,
  vulnerableTimer: 0,
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
  // Pick boss from rotation
  const rotation = CONFIG.BOSS_ROTATION;
  const bossType = rotation[bossState.rotationIndex % rotation.length];
  bossState.rotationIndex++;

  const def = CONFIG.BOSS_TYPES[bossType];
  if (!def) return;

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
    type: bossType,
    color: def.color,
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
    // Boss-type-specific
    immune: bossType === 'blockchain',
    isClone: false,
  };

  enemies.push(boss);
  bossState.active = boss;
  bossState.warningShown = false;
  bossState.warningTimer = 0;

  // Reset type-specific state
  if (bossType === 'windowsXP') {
    bossState.aoeTimer = def.aoeInterval;
    bossState.aoeWarningTimer = 0;
    bossState.aoeActive = null;
  }
  if (bossType === 'stackOverflow') {
    bossState.cloneCount = 0;
  }
  if (bossType === 'blockchain') {
    bossState.puzzleTimer = def.puzzleInterval;
    bossState.puzzleActive = false;
    bossState.immune = true;
    bossState.vulnerableTimer = 0;
  }

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
  const baseDef = CONFIG.BOSS;

  // Boss warning
  if (!bossState.active && elapsed >= bossState.nextSpawnTime - baseDef.warningTime && !bossState.warningShown) {
    bossState.warningShown = true;
    bossState.warningTimer = baseDef.warningTime;
  }

  if (bossState.warningTimer > 0) {
    bossState.warningTimer -= dt;
    if (bossState.warningTimer <= 0 && !bossState.active) {
      spawnBoss();
      bossState.nextSpawnTime = elapsed + baseDef.spawnInterval;
    }
  }

  // Spawn without warning if time passed
  if (!bossState.active && !bossState.warningShown && elapsed >= bossState.nextSpawnTime) {
    bossState.warningShown = true;
    bossState.warningTimer = baseDef.warningTime;
  }

  // Boss AI
  if (bossState.active) {
    const boss = bossState.active;
    const def = CONFIG.BOSS_TYPES[boss.type];
    if (!def) return;

    if (boss.hp <= 0) {
      bossState.active = null;
      bossState.warningShown = false;
      bossState.aoeActive = null;
      bossState.immune = false;
      // Hide puzzle if blockchain dies during puzzle
      if (bossState.puzzleActive) {
        bossState.puzzleActive = false;
        document.getElementById('puzzle-overlay').classList.remove('visible');
        game.state = GameState.PLAYING;
      }
      const bossBar = document.getElementById('boss-hp-bar');
      if (bossBar) bossBar.classList.remove('visible');
      return;
    }

    // Enrage at low HP
    if (def.enrageThreshold && boss.hp / boss.maxHp < def.enrageThreshold) {
      boss.speed = def.speedEnraged || def.speed;
    }

    // --- Windows XP: AOE BSOD attack ---
    if (boss.type === 'windowsXP') {
      bossState.aoeTimer -= dt;
      if (bossState.aoeTimer <= 0 && !bossState.aoeActive) {
        bossState.aoeWarningTimer = def.aoeWarning;
        bossState.aoeTimer = def.aoeInterval;
      }

      if (bossState.aoeWarningTimer > 0) {
        bossState.aoeWarningTimer -= dt;
        if (bossState.aoeWarningTimer <= 0) {
          bossState.aoeActive = {
            x: boss.x, y: boss.y,
            radius: def.aoeRadius,
            timer: def.aoeDuration,
          };
          const dx = player.x - boss.x;
          const dy = player.y - boss.y;
          if (dx * dx + dy * dy < def.aoeRadius * def.aoeRadius) {
            player._bsodSlowTimer = def.aoeDuration;
          }
        }
      }

      if (bossState.aoeActive) {
        bossState.aoeActive.timer -= dt;
        if (bossState.aoeActive.timer <= 0) {
          bossState.aoeActive = null;
        }
      }
    }

    // --- The Blockchain: puzzle + immunity ---
    if (boss.type === 'blockchain') {
      // Vulnerable timer countdown
      if (bossState.vulnerableTimer > 0) {
        bossState.vulnerableTimer -= dt;
        boss.immune = false;
        bossState.immune = false;
        if (bossState.vulnerableTimer <= 0) {
          boss.immune = true;
          bossState.immune = true;
        }
      }

      // Puzzle timer
      if (!bossState.puzzleActive && bossState.vulnerableTimer <= 0) {
        bossState.puzzleTimer -= dt;
        if (bossState.puzzleTimer <= 0) {
          showBlockchainPuzzle(boss);
          bossState.puzzleTimer = def.puzzleInterval;
        }
      }
    }

    // Update boss HP bar
    updateBossHpBar(boss);
  }
}

function updateBossHpBar(boss) {
  const fill = document.getElementById('boss-hp-fill');
  const text = document.getElementById('boss-hp-text');
  const def = CONFIG.BOSS_TYPES[boss.type];
  if (!def) return;

  if (fill) {
    fill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
    fill.style.backgroundColor = boss.hp / boss.maxHp < 0.5 ? '#f85149' : def.color;
  }
  if (text) {
    let label = def.name;
    if (boss.immune) label += ' 🛡️ IMMUNE';
    text.textContent = `${label} — ${Math.ceil(boss.hp)}/${boss.maxHp}`;
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

  // Boss AOE warning (Windows XP only)
  if (bossState.active && bossState.active.type === 'windowsXP' && bossState.aoeWarningTimer > 0) {
    const boss = bossState.active;
    const xpDef = CONFIG.BOSS_TYPES.windowsXP;
    const flash = Math.sin(bossState.aoeWarningTimer * 10) * 0.5 + 0.5;
    ctx.globalAlpha = flash * 0.3;
    ctx.fillStyle = '#f85149';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, xpDef.aoeRadius, 0, Math.PI * 2);
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
    const alpha = aoe.timer / CONFIG.BOSS_TYPES.windowsXP.aoeDuration;
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
    const nextType = CONFIG.BOSS_ROTATION[bossState.rotationIndex % CONFIG.BOSS_ROTATION.length];
    const nextDef = CONFIG.BOSS_TYPES[nextType];
    const bossName = nextDef ? nextDef.name : 'BOSS';
    ctx.fillText(`⚠️ ${bossName.toUpperCase()} INCOMING`, canvasWidth / 2, canvasHeight / 2 - 60);
    ctx.globalAlpha = 1;
  }
}

function renderBoss(e, fill) {
  const r = e.radius;
  const def = CONFIG.BOSS_TYPES[e.type];
  if (!def) return;

  // Clone semi-transparency
  if (e.isClone) ctx.globalAlpha = 0.55;

  if (e.type === 'windowsXP') {
    // Windows XP style: rounded rectangle with logo
    ctx.fillStyle = fill;
    drawRoundedRect(e.x, e.y, r, fill);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r * 0.5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XP', e.x, e.y - r * 0.15);
    ctx.font = `${Math.round(r * 0.25)}px monospace`;
    ctx.fillText('Windows', e.x, e.y + r * 0.3);
    ctx.textBaseline = 'alphabetic';

  } else if (e.type === 'stackOverflow') {
    // Stack Overflow: orange rounded rect with SO logo
    ctx.fillStyle = fill;
    drawRoundedRect(e.x, e.y, r, fill);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r * 0.35)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SO', e.x, e.y - r * 0.1);
    ctx.font = `${Math.round(r * 0.2)}px monospace`;
    ctx.fillText('Stack', e.x, e.y + r * 0.25);
    ctx.textBaseline = 'alphabetic';

  } else if (e.type === 'blockchain') {
    // The Blockchain: blue hexagonal shape
    renderPolygon(e.x, e.y, r, 6, fill);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r * 0.3)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛓️', e.x, e.y - r * 0.1);
    ctx.font = `${Math.round(r * 0.18)}px monospace`;
    ctx.fillText('Blockchain', e.x, e.y + r * 0.35);
    ctx.textBaseline = 'alphabetic';

    // Immune shield visual
    if (e.immune) {
      const pulse = Math.sin(game.elapsed * 3) * 0.15 + 0.35;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#627eea';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r + 10, 0, Math.PI * 2);
      ctx.stroke();
      // Inner glow
      ctx.globalAlpha = pulse * 0.3;
      ctx.fillStyle = '#627eea';
      ctx.beginPath();
      ctx.arc(e.x, e.y, r + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  if (e.isClone) ctx.globalAlpha = 1;

  // Enrage glow (all boss types)
  if (def.enrageThreshold && e.hp / e.maxHp < def.enrageThreshold) {
    ctx.globalAlpha = 0.3 + Math.sin(game.elapsed * 8) * 0.2;
    ctx.strokeStyle = '#f85149';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawRoundedRect(cx, cy, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  const rx = cx - r;
  const ry = cy - r;
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
}

// --- Stack Overflow: clone on hit ---
function tryStackOverflowClone(boss) {
  if (boss.type !== 'stackOverflow' || boss.isClone) return;
  const def = CONFIG.BOSS_TYPES.stackOverflow;
  if (bossState.cloneCount >= def.maxClones) return;
  if (Math.random() > def.cloneChance) return;

  bossState.cloneCount++;
  const cloneHp = Math.round(boss.maxHp * def.cloneHpRatio);
  const angle = Math.random() * Math.PI * 2;
  const offset = 80;

  const clone = {
    x: boss.x + Math.cos(angle) * offset,
    y: boss.y + Math.sin(angle) * offset,
    radius: def.radius * 0.8,
    speed: def.speed * 1.1,
    hp: cloneHp,
    maxHp: cloneHp,
    damage: def.damage * 0.6,
    xp: 10,
    type: 'stackOverflow',
    color: def.color,
    dirX: 0, dirY: 0,
    dirFrame: 0,
    hitFlash: 0,
    damaged: false,
    isElite: false,
    isBoss: true,
    isClone: true,
    immune: false,
    slowTimer: 0, slowFactor: 1,
    frozen: false, frozenTimer: 0,
    regenRate: 0, spawnOnDeath: 0,
    slowRadius: 0, slowFieldFactor: 1,
  };

  clone.x = Math.max(clone.radius, Math.min(CONFIG.MAP_WIDTH - clone.radius, clone.x));
  clone.y = Math.max(clone.radius, Math.min(CONFIG.MAP_HEIGHT - clone.radius, clone.y));

  enemies.push(clone);
}

// --- Blockchain: puzzle system ---
const PUZZLE_SYMBOLS = ['🔑', '⛓️', '💎', '🪙', '📊', '🔐', '🧩', '⚡'];
let puzzleSequence = [];
let puzzlePlayerInput = [];
let puzzlePhase = 'memorize'; // 'memorize' | 'input'
let puzzleMemTimer = 0;

function showBlockchainPuzzle(boss) {
  bossState.puzzleActive = true;
  game.state = GameState.PAUSED;

  const def = CONFIG.BOSS_TYPES.blockchain;
  const count = def.puzzleSymbolCount;

  // Pick random symbols for the sequence
  const shuffled = [...PUZZLE_SYMBOLS].sort(() => Math.random() - 0.5);
  puzzleSequence = shuffled.slice(0, count);
  puzzlePlayerInput = [];
  puzzlePhase = 'memorize';
  puzzleMemTimer = def.puzzleMemorizeTime;

  const overlay = document.getElementById('puzzle-overlay');
  const display = document.getElementById('puzzle-display');
  const inputArea = document.getElementById('puzzle-input');
  const inputLabel = document.getElementById('puzzle-input-label');
  const instruction = document.getElementById('puzzle-instruction');
  const timerEl = document.getElementById('puzzle-timer');
  const resultEl = document.getElementById('puzzle-result');

  resultEl.textContent = '';
  instruction.textContent = 'Memorize the sequence!';
  inputLabel.style.display = 'none';
  inputArea.style.display = 'none';
  timerEl.textContent = String(Math.ceil(puzzleMemTimer));

  // Show symbols
  display.innerHTML = '';
  for (const sym of puzzleSequence) {
    const el = document.createElement('div');
    el.className = 'puzzle-symbol';
    el.textContent = sym;
    display.appendChild(el);
  }

  overlay.classList.add('visible');

  // Memorize countdown
  const memInterval = setInterval(() => {
    puzzleMemTimer -= 0.1;
    timerEl.textContent = String(Math.max(0, Math.ceil(puzzleMemTimer)));
    if (puzzleMemTimer <= 0) {
      clearInterval(memInterval);
      startPuzzleInput(boss);
    }
  }, 100);
}

function startPuzzleInput(boss) {
  puzzlePhase = 'input';
  puzzlePlayerInput = [];

  const display = document.getElementById('puzzle-display');
  const inputArea = document.getElementById('puzzle-input');
  const inputLabel = document.getElementById('puzzle-input-label');
  const instruction = document.getElementById('puzzle-instruction');
  const timerEl = document.getElementById('puzzle-timer');

  // Hide the shown symbols
  display.innerHTML = '';
  for (let i = 0; i < puzzleSequence.length; i++) {
    const el = document.createElement('div');
    el.className = 'puzzle-symbol hidden-symbol';
    el.textContent = '?';
    display.appendChild(el);
  }

  instruction.textContent = 'Select symbols in correct order:';
  timerEl.textContent = '';

  // Show all possible symbols to pick from (shuffled)
  const options = [...PUZZLE_SYMBOLS].sort(() => Math.random() - 0.5);
  inputLabel.style.display = 'block';
  inputArea.style.display = 'flex';
  inputArea.innerHTML = '';

  for (const sym of options) {
    const el = document.createElement('div');
    el.className = 'puzzle-symbol';
    el.textContent = sym;
    el.addEventListener('click', () => handlePuzzleSymbolClick(sym, el, boss));
    inputArea.appendChild(el);
  }
}

function handlePuzzleSymbolClick(sym, el, boss) {
  if (puzzlePhase !== 'input') return;

  puzzlePlayerInput.push(sym);
  el.classList.add('selected');
  el.style.pointerEvents = 'none';

  // Show progress in display area
  const display = document.getElementById('puzzle-display');
  const slots = display.querySelectorAll('.puzzle-symbol');
  const idx = puzzlePlayerInput.length - 1;
  if (slots[idx]) {
    slots[idx].textContent = sym;
    slots[idx].classList.remove('hidden-symbol');
  }

  if (puzzlePlayerInput.length >= puzzleSequence.length) {
    // Check answer
    const correct = puzzlePlayerInput.every((s, i) => s === puzzleSequence[i]);
    resolvePuzzle(correct, boss);
  }
}

function resolvePuzzle(correct, boss) {
  puzzlePhase = 'done';
  const resultEl = document.getElementById('puzzle-result');
  const inputArea = document.getElementById('puzzle-input');

  // Disable all buttons
  inputArea.querySelectorAll('.puzzle-symbol').forEach(el => { el.style.pointerEvents = 'none'; });

  if (correct) {
    resultEl.textContent = '✅ Decrypted! Shield down for 5s!';
    resultEl.style.color = '#3fb950';
    const def = CONFIG.BOSS_TYPES.blockchain;
    bossState.vulnerableTimer = def.vulnerableDuration;
    boss.immune = false;
    bossState.immune = false;
  } else {
    resultEl.textContent = '❌ Failed! Boss HP +50%!';
    resultEl.style.color = '#f85149';
    const def = CONFIG.BOSS_TYPES.blockchain;
    boss.hp = Math.min(boss.hp * def.wrongPenaltyHpMult, boss.maxHp * 3);
    boss.maxHp = Math.max(boss.maxHp, boss.hp);
  }

  setTimeout(() => {
    document.getElementById('puzzle-overlay').classList.remove('visible');
    bossState.puzzleActive = false;
    game.state = GameState.PLAYING;
  }, 1200);
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

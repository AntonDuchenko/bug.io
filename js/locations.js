// ============================================================
// Bug.io — Location Mechanics (TASK-13, TASK-14, TASK-16)
// ============================================================

let activeLocation = 'localhost'; // default

// ================================================================
// TASK-13 — Staging Environment: PR-based level up
// ================================================================
let stagingPrNumber = 0;
let stagingRejectsLeft = 0;
const STAGING_MAX_REJECTS = 2;

function showStagingLevelUp() {
  levelUpActive = true;
  game.state = GameState.PAUSED;
  levelUpChoices = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
  stagingPrNumber++;
  stagingRejectsLeft = STAGING_MAX_REJECTS;

  renderStagingUI();
}

function renderStagingUI() {
  const overlay = document.getElementById('levelup-overlay');
  const container = document.getElementById('levelup-cards');
  const levelText = document.getElementById('levelup-level');

  levelText.innerHTML = `<span style="color:#58a6ff;">Pull Request #${stagingPrNumber}</span> <span style="color:#8b949e;font-size:16px;">— Ready for Review</span>`;
  container.innerHTML = '';

  levelUpChoices.forEach((upgrade, idx) => {
    const lvl = getUpgradeLevel(upgrade.id);
    const nextLvl = lvl + 1;
    const isEvo = upgrade.type === 'evolution';

    const card = document.createElement('div');
    card.className = 'levelup-card staging-card' + (isEvo ? ' levelup-card-evo' : '');

    // Build diff-style content
    const fileName = getStagingFileName(upgrade);
    const diffLines = getStagingDiff(upgrade, lvl, nextLvl, isEvo);

    card.innerHTML = `
      <div class="staging-file-header">${fileName}</div>
      <pre class="staging-diff">${diffLines}</pre>
      <button class="staging-merge-btn" data-idx="${idx}">Approve &amp; Merge</button>
      <div class="levelup-key">${idx + 1}</div>
    `;

    card.querySelector('.staging-merge-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      selectUpgrade(idx);
    });
    card.addEventListener('click', () => selectUpgrade(idx));
    container.appendChild(card);
  });

  // Reject PR button
  const rejectRow = document.createElement('div');
  rejectRow.style.cssText = 'text-align:center;margin-top:8px;';
  const rejectBtn = document.createElement('button');
  rejectBtn.className = 'staging-reject-btn';
  rejectBtn.textContent = `Reject PR (${stagingRejectsLeft}/${STAGING_MAX_REJECTS} left)`;
  rejectBtn.disabled = stagingRejectsLeft <= 0;
  rejectBtn.addEventListener('click', () => {
    if (stagingRejectsLeft <= 0) return;
    stagingRejectsLeft--;
    levelUpChoices = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
    renderStagingUI();
  });
  rejectRow.appendChild(rejectBtn);
  container.appendChild(rejectRow);

  overlay.classList.add('visible');
}

function getStagingFileName(upgrade) {
  if (upgrade.type === 'skill') return `src/skills/${upgrade.id}.ts`;
  if (upgrade.type === 'evolution') return `src/evolutions/${upgrade.name.toLowerCase().replace(/\s/g, '_')}.ts`;
  if (upgrade.type === 'passive_item') return `src/items/${upgrade.id}.ts`;
  return `src/player/${upgrade.id}.ts`;
}

function getStagingDiff(upgrade, lvl, nextLvl, isEvo) {
  if (isEvo) {
    return `<span class="diff-add">+ import { ${upgrade.name} } from './evolved';</span>\n<span class="diff-del">- export const level = ${lvl};</span>\n<span class="diff-add">+ export const evolved = true;</span>\n<span class="diff-add">+ ${upgrade.getDescription()}</span>`;
  }
  if (upgrade.type === 'skill') {
    const def = SKILL_DEFS[upgrade.id];
    if (def) {
      const curr = def.getParams(Math.max(1, lvl));
      const next = def.getParams(nextLvl);
      let lines = `<span class="diff-ctx">  // ${upgrade.name} upgrade</span>\n`;
      if (curr.damage !== undefined && next.damage !== undefined) {
        lines += `<span class="diff-del">- damage: ${curr.damage},</span>\n<span class="diff-add">+ damage: ${next.damage},</span>\n`;
      }
      if (curr.cooldown !== undefined && next.cooldown !== undefined) {
        lines += `<span class="diff-del">- cooldown: ${curr.cooldown.toFixed(1)},</span>\n<span class="diff-add">+ cooldown: ${next.cooldown.toFixed(1)},</span>`;
      }
      return lines;
    }
  }
  // Generic passive
  return `<span class="diff-add">+ ${upgrade.name}: applied</span>\n<span class="diff-ctx">  // ${isEvo ? upgrade.getDescription() : upgrade.getDescription(nextLvl)}</span>`;
}

// ================================================================
// TASK-14 — Legacy Codebase: Tech Debt mechanic
// ================================================================
let techDebt = 0;
let refactoring = false;
let refactorTimer = 0;
const REFACTOR_DURATION = 30;

function getTechDebtMultiplier() {
  if (activeLocation !== 'legacy_codebase') return 1;
  return 1 + (techDebt / 100) * 0.5;
}

function updateLegacyMechanic(dt) {
  if (activeLocation !== 'legacy_codebase') return;

  if (refactoring) {
    refactorTimer -= dt;
    // Decrease debt evenly over refactor duration
    const debtPerSec = techDebt / Math.max(refactorTimer + 1, 1);
    techDebt = Math.max(0, techDebt - (100 / REFACTOR_DURATION) * dt);
    if (refactorTimer <= 0) {
      refactoring = false;
      techDebt = 0;
    }
  }
}

function showLegacyLevelUp() {
  levelUpActive = true;
  game.state = GameState.PAUSED;

  // Get normal upgrades then split into Quick Fix / Proper Solution pairs
  const baseUpgrades = getRandomUpgrades(CONFIG.UPGRADE_CHOICES);
  levelUpChoices = baseUpgrades.map(u => ({
    ...u,
    _legacyMode: 'proper', // default is Proper Solution
  }));

  renderLegacyUI();
}

function renderLegacyUI() {
  const overlay = document.getElementById('levelup-overlay');
  const container = document.getElementById('levelup-cards');
  const levelText = document.getElementById('levelup-level');

  levelText.innerHTML = `Level ${player.level} <span style="color:#8b949e;font-size:14px;">— Tech Debt: ${Math.round(techDebt)}/100</span>`;
  container.innerHTML = '';

  levelUpChoices.forEach((upgrade, idx) => {
    const lvl = getUpgradeLevel(upgrade.id);
    const nextLvl = lvl + 1;
    const isEvo = upgrade.type === 'evolution';

    const card = document.createElement('div');
    card.className = 'levelup-card';
    if (isEvo) card.classList.add('levelup-card-evo');

    let lvlText = '';
    if (upgrade.type === 'skill') lvlText = `Lv ${lvl} → ${nextLvl}`;
    else if (isEvo) lvlText = '★ EVOLUTION ★';

    // Quick Fix toggle (not for evolutions)
    let quickFixHtml = '';
    if (!isEvo) {
      const isQuick = upgrade._legacyMode === 'quick';
      quickFixHtml = `
        <div class="legacy-toggle">
          <button class="legacy-btn ${isQuick ? '' : 'active'}" data-idx="${idx}" data-mode="proper">&#10024; Proper</button>
          <button class="legacy-btn ${isQuick ? 'active' : ''}" data-idx="${idx}" data-mode="quick">&#128184; Quick Fix</button>
        </div>
        <div class="legacy-debt-info">${isQuick ? '+20 Tech Debt, x1.5 effect' : '+0 Tech Debt'}</div>
      `;
    }

    card.innerHTML = `
      <div class="levelup-emoji">${upgrade.emoji}</div>
      <div class="levelup-name">${upgrade.name}</div>
      <div class="levelup-desc">${isEvo ? upgrade.getDescription() : upgrade.getDescription(nextLvl)}</div>
      <div class="levelup-lvl">${lvlText}</div>
      ${quickFixHtml}
      <div class="levelup-key">${idx + 1}</div>
    `;

    // Toggle button listeners
    card.querySelectorAll('.legacy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.idx);
        levelUpChoices[i]._legacyMode = btn.dataset.mode;
        renderLegacyUI();
      });
    });

    card.addEventListener('click', () => selectLegacyUpgrade(idx));
    container.appendChild(card);
  });

  overlay.classList.add('visible');
}

function selectLegacyUpgrade(idx) {
  if (!levelUpActive || idx < 0 || idx >= levelUpChoices.length) return;
  const choice = levelUpChoices[idx];

  if (choice._legacyMode === 'quick') {
    techDebt = Math.min(100, techDebt + 20);
    // Apply 1.5x effect — apply upgrade then apply again at 0.5x
    // Simple approach: apply twice but second time is partial via direct stat boost
    if (choice.type === 'evolution') {
      applyEvolution(choice.evoId);
    } else {
      applyUpgrade(choice.id);
    }
    // Quick Fix bonus: extra stat boost
    applyQuickFixBonus(choice);
  } else {
    if (choice.type === 'evolution') {
      applyEvolution(choice.evoId);
    } else {
      applyUpgrade(choice.id);
    }
  }

  levelUpActive = false;
  document.getElementById('levelup-overlay').classList.remove('visible');
  game.state = GameState.PLAYING;
}

function applyQuickFixBonus(upgrade) {
  // Extra bonus for Quick Fix: +50% of the upgrade effect
  if (upgrade.type === 'skill' && SKILL_IDS.includes(upgrade.id)) {
    // Boost the skill's damage by a flat amount
    const skill = activeSkills[upgrade.id];
    if (skill) {
      // Temporary extra damage stored on player
      player.damageMult = (player.damageMult || 1) + 0.05;
    }
  } else if (upgrade.id === 'max_hp') {
    player.maxHp += 10;
    player.hp += 10;
  } else if (upgrade.id === 'move_speed') {
    player.speed += CONFIG.PLAYER_SPEED * 0.05;
  }
}

// Refactor key handler (R)
window.addEventListener('keydown', (e) => {
  if (activeLocation !== 'legacy_codebase') return;
  if (e.code === 'KeyR' && game.state === GameState.PLAYING) {
    if (refactoring) {
      // Cancel refactoring
      refactoring = false;
    } else if (techDebt > 0) {
      refactoring = true;
      refactorTimer = REFACTOR_DURATION;
    }
  }
});

// ================================================================
// TASK-16 — Dark Mode: limited visibility
// ================================================================
let darkModeBaseRadius = 150;
let darkModeLamps = []; // {x, y, radius, life}

function updateDarkMode(dt) {
  if (activeLocation !== 'dark_mode') return;

  // Update lamp lifetimes
  for (let i = darkModeLamps.length - 1; i >= 0; i--) {
    darkModeLamps[i].life -= dt;
    if (darkModeLamps[i].life <= 0) {
      darkModeLamps.splice(i, 1);
    }
  }
}

function renderDarkModeOverlay() {
  if (activeLocation !== 'dark_mode') return;

  // Create off-screen canvas for darkness mask
  const offCanvas = document.createElement('canvas');
  offCanvas.width = canvasWidth;
  offCanvas.height = canvasHeight;
  const offCtx = offCanvas.getContext('2d');

  // Fill with darkness
  offCtx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  offCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Cut out visibility circle around player
  offCtx.globalCompositeOperation = 'destination-out';

  // Player light
  const px = player.x - camera.x;
  const py = player.y - camera.y;
  const playerRadius = darkModeBaseRadius;
  const gradient = offCtx.createRadialGradient(px, py, 0, px, py, playerRadius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  offCtx.fillStyle = gradient;
  offCtx.beginPath();
  offCtx.arc(px, py, playerRadius, 0, Math.PI * 2);
  offCtx.fill();

  // Cut out lamp lights
  for (const lamp of darkModeLamps) {
    const lx = lamp.x - camera.x;
    const ly = lamp.y - camera.y;
    const fade = Math.min(1, lamp.life / 2); // fade out in last 2 seconds
    const r = lamp.radius * fade;
    const lg = offCtx.createRadialGradient(lx, ly, 0, lx, ly, r);
    lg.addColorStop(0, 'rgba(0, 0, 0, 1)');
    lg.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)');
    lg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    offCtx.fillStyle = lg;
    offCtx.beginPath();
    offCtx.arc(lx, ly, r, 0, Math.PI * 2);
    offCtx.fill();
  }

  offCtx.globalCompositeOperation = 'source-over';

  // Draw the darkness mask onto the main canvas
  ctx.drawImage(offCanvas, 0, 0);
}

// When XP gem is collected in Dark Mode, there's a chance to spawn a lamp
function onDarkModeGemCollected(gemX, gemY) {
  if (activeLocation !== 'dark_mode') return;
  if (Math.random() < 0.15) { // 15% chance
    darkModeLamps.push({
      x: gemX, y: gemY,
      radius: 120 + Math.random() * 60,
      life: 15 + Math.random() * 10, // 15-25 seconds
    });
  }
}

// ================================================================
// TASK-16 — Cloud Infrastructure: credit system
// ================================================================
let cloudCredits = 100;
const CLOUD_MAX_CREDITS = 100;
const CLOUD_SKILL_COST = 3; // credits per skill use
let cloudSkillsDisabled = false;

function updateCloudInfra(dt) {
  if (activeLocation !== 'cloud') return;

  cloudSkillsDisabled = cloudCredits <= 0;
}

function cloudUseCredits(amount) {
  if (activeLocation !== 'cloud') return true; // no restriction
  if (cloudCredits <= 0) return false; // can't fire
  cloudCredits = Math.max(0, cloudCredits - amount);
  return true;
}

function cloudAddCredits(amount) {
  if (activeLocation !== 'cloud') return;
  cloudCredits = Math.min(CLOUD_MAX_CREDITS, cloudCredits + amount);
}

// Called when XP gem is collected in Cloud
function onCloudGemCollected() {
  if (activeLocation !== 'cloud') return;
  cloudAddCredits(2); // each gem gives 2 credits
}

function renderCloudHUD() {
  const barW = 140;
  const barH = 8;
  const barX = 16;
  const barY = 36;

  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);

  let creditColor;
  const ratio = cloudCredits / CLOUD_MAX_CREDITS;
  if (ratio > 0.5) creditColor = '#58a6ff';
  else if (ratio > 0.2) creditColor = '#e3b341';
  else creditColor = '#f85149';

  ctx.fillStyle = creditColor;
  ctx.fillRect(barX, barY, barW * ratio, barH);

  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';
  ctx.fillText(`Credits: ${Math.round(cloudCredits)}/${CLOUD_MAX_CREDITS}`, barX, barY + barH + 10);

  if (cloudSkillsDisabled) {
    ctx.fillStyle = '#f85149';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ OUT OF CREDITS — Skills Disabled', canvasWidth / 2, 60);
  }
}

// ================================================================
// TASK-16 — Incident/Outage: popup quiz every 60s
// ================================================================
let incidentTimer = 60;
let incidentActive = false;
let incidentCountdown = 0;
let incidentInterval = null;

const INCIDENT_QUESTIONS = [
  {
    q: 'CPU usage at 100%. What do you do?',
    options: ['Restart the service', 'Scale horizontally', 'Check for infinite loops'],
    correct: 2,
  },
  {
    q: 'Database connections exhausted!',
    options: ['Increase pool size', 'Add connection pooling', 'Kill all queries'],
    correct: 1,
  },
  {
    q: 'Memory leak detected in production!',
    options: ['Ignore it', 'Profile heap snapshots', 'Add more RAM'],
    correct: 1,
  },
  {
    q: 'SSL certificate expired!',
    options: ['Disable HTTPS', 'Auto-renew with certbot', 'Generate self-signed cert'],
    correct: 1,
  },
  {
    q: 'DDoS attack detected on API!',
    options: ['Block all traffic', 'Enable rate limiting', 'Scale to absorb'],
    correct: 1,
  },
  {
    q: 'Disk space at 98%!',
    options: ['Delete random files', 'Clean old logs & rotate', 'Buy bigger disk'],
    correct: 1,
  },
  {
    q: 'Redis cache returning stale data!',
    options: ['Flush all cache', 'Check TTL settings', 'Switch to Memcached'],
    correct: 1,
  },
  {
    q: 'Service returns 502 Bad Gateway!',
    options: ['Restart nginx', 'Check upstream health', 'Increase timeout'],
    correct: 1,
  },
  {
    q: 'Deployment pipeline is stuck!',
    options: ['Force push to main', 'Check CI logs for errors', 'Skip all checks'],
    correct: 1,
  },
  {
    q: 'Error rate spiked to 15%!',
    options: ['Rollback last deploy', 'Wait and see', 'Increase error budget'],
    correct: 0,
  },
];

function updateIncident(dt) {
  if (activeLocation !== 'incident') return;
  if (incidentActive) return;

  incidentTimer -= dt;
  if (incidentTimer <= 0) {
    showIncidentPopup();
    incidentTimer = 60;
  }
}

function showIncidentPopup() {
  incidentActive = true;
  game.state = GameState.PAUSED;

  const q = INCIDENT_QUESTIONS[Math.floor(Math.random() * INCIDENT_QUESTIONS.length)];
  const overlay = document.getElementById('incident-overlay');
  const questionEl = document.getElementById('incident-question');
  const timerEl = document.getElementById('incident-timer');
  const optionsEl = document.getElementById('incident-options');
  const resultEl = document.getElementById('incident-result');

  questionEl.textContent = q.q;
  resultEl.textContent = '';
  resultEl.style.color = '';
  optionsEl.innerHTML = '';
  incidentCountdown = 5;
  timerEl.textContent = '5';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'incident-btn';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.addEventListener('click', () => resolveIncident(idx === q.correct));
    optionsEl.appendChild(btn);
  });

  overlay.classList.add('visible');

  // Countdown timer
  if (incidentInterval) clearInterval(incidentInterval);
  incidentInterval = setInterval(() => {
    incidentCountdown--;
    timerEl.textContent = String(Math.max(0, incidentCountdown));
    if (incidentCountdown <= 0) {
      clearInterval(incidentInterval);
      incidentInterval = null;
      resolveIncident(false); // timeout = wrong
    }
  }, 1000);
}

function resolveIncident(correct) {
  if (!incidentActive) return;
  if (incidentInterval) {
    clearInterval(incidentInterval);
    incidentInterval = null;
  }

  const resultEl = document.getElementById('incident-result');
  const optionsEl = document.getElementById('incident-options');

  // Disable buttons
  optionsEl.querySelectorAll('.incident-btn').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

  if (correct) {
    resultEl.textContent = '✅ Incident resolved! +20 HP, +10% speed for 30s';
    resultEl.style.color = '#3fb950';
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player._incidentSpeedBoost = 30; // 30 seconds
  } else {
    resultEl.textContent = '❌ Wrong response! -15 HP, enemies +20% speed for 15s';
    resultEl.style.color = '#f85149';
    player.hp = Math.max(1, player.hp - 15);
    // Temporarily boost all enemies speed
    for (const e of enemies) {
      if (!e.isBoss) {
        e._incidentSpeedMult = 1.2;
        e._incidentSpeedTimer = 15;
      }
    }
  }

  setTimeout(() => {
    document.getElementById('incident-overlay').classList.remove('visible');
    incidentActive = false;
    game.state = GameState.PLAYING;
  }, 1500);
}

function updateIncidentEffects(dt) {
  if (activeLocation !== 'incident') return;

  // Player speed boost from correct answer
  if (player._incidentSpeedBoost > 0) {
    player._incidentSpeedBoost -= dt;
  }

  // Enemy speed boost from wrong answer
  for (const e of enemies) {
    if (e._incidentSpeedTimer > 0) {
      e._incidentSpeedTimer -= dt;
      if (e._incidentSpeedTimer <= 0) {
        e._incidentSpeedMult = 1;
      }
    }
  }
}

function getIncidentSpeedMult() {
  if (activeLocation !== 'incident') return 1;
  return (player._incidentSpeedBoost > 0) ? 1.1 : 1;
}

function getIncidentEnemySpeedMult(enemy) {
  return enemy._incidentSpeedMult || 1;
}

// ================================================================
// TASK-16 — Hackathon: Junior companion AI
// ================================================================
let juniorCompanion = null;
let hackathonUltReady = false;
let hackathonUltUsed = false;

function initHackathonCompanion() {
  if (activeLocation !== 'hackathon') return;
  juniorCompanion = {
    x: player.x + 30,
    y: player.y + 30,
    hp: 60,
    maxHp: 60,
    radius: 12,
    speed: 160,
    attackCooldown: 0,
    attackRate: 2.5,
    attackRadius: 70,
    attackDamage: 12,
    derpTimer: 0,    // when > 0, junior is "derping" (standing still)
    derpChance: 0.20,
    alive: true,
    targetEnemy: null,
    attackVisual: 0, // timer for showing attack visual
  };
  hackathonUltReady = false;
  hackathonUltUsed = false;
}

function updateHackathon(dt) {
  if (activeLocation !== 'hackathon' || !juniorCompanion || !juniorCompanion.alive) return;

  const jr = juniorCompanion;

  // Check ult condition: both alive at 10 minutes
  if (!hackathonUltUsed && !hackathonUltReady && game.elapsed >= 600 && jr.alive && player.hp > 0) {
    hackathonUltReady = true;
  }

  // Derp timer
  if (jr.derpTimer > 0) {
    jr.derpTimer -= dt;
    jr.attackVisual = Math.max(0, jr.attackVisual - dt);
    return;
  }

  // 20% chance to derp for 1-3 seconds when idle
  if (!jr.targetEnemy && Math.random() < jr.derpChance * dt) {
    jr.derpTimer = 1 + Math.random() * 2;
    return;
  }

  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - jr.x;
    const dy = e.y - jr.y;
    const d = dx * dx + dy * dy;
    if (d < nearestDist) {
      nearestDist = d;
      nearestEnemy = e;
    }
  }

  jr.targetEnemy = nearestEnemy;

  if (nearestEnemy) {
    const dx = nearestEnemy.x - jr.x;
    const dy = nearestEnemy.y - jr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > jr.attackRadius * 0.8) {
      // Move toward target
      jr.x += (dx / dist) * jr.speed * dt;
      jr.y += (dy / dist) * jr.speed * dt;
    }

    // Attack
    jr.attackCooldown -= dt;
    if (jr.attackCooldown <= 0 && dist <= jr.attackRadius) {
      jr.attackCooldown = jr.attackRate;
      jr.attackVisual = 0.3;

      // AOE damage to nearby enemies
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        const ex = e.x - jr.x;
        const ey = e.y - jr.y;
        if (ex * ex + ey * ey <= jr.attackRadius * jr.attackRadius) {
          e.hp -= jr.attackDamage;
          e.hitFlash = 0.1;
          e.damaged = true;
        }
      }
    }
  } else {
    // Follow player if no enemies nearby
    const dx = player.x - jr.x;
    const dy = player.y - jr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 50) {
      jr.x += (dx / dist) * jr.speed * dt;
      jr.y += (dy / dist) * jr.speed * dt;
    }
  }

  jr.attackVisual = Math.max(0, jr.attackVisual - dt);

  // Clamp to map
  jr.x = Math.max(jr.radius, Math.min(CONFIG.MAP_WIDTH - jr.radius, jr.x));
  jr.y = Math.max(jr.radius, Math.min(CONFIG.MAP_HEIGHT - jr.radius, jr.y));
}

function damageJunior(damage) {
  if (!juniorCompanion || !juniorCompanion.alive) return;
  juniorCompanion.hp -= damage;
  if (juniorCompanion.hp <= 0) {
    juniorCompanion.alive = false;
  }
}

function fireHackathonUlt() {
  if (!hackathonUltReady || hackathonUltUsed) return;
  hackathonUltUsed = true;
  hackathonUltReady = false;

  // Ultimate: massive AOE that kills everything on screen
  for (const e of enemies) {
    if (e.isBoss) {
      e.hp -= e.maxHp * 0.3; // 30% boss HP
      e.hitFlash = 0.3;
      e.damaged = true;
    } else {
      e.hp = 0;
    }
  }

  // Visual effect
  visualEffects.push({
    type: 'hackathon_ult',
    x: player.x,
    y: player.y,
    radius: 0,
    maxRadius: Math.max(canvasWidth, canvasHeight),
    timer: 1.5,
    maxTimer: 1.5,
  });
}

// Hackathon ult key (U)
window.addEventListener('keydown', (e) => {
  if (activeLocation !== 'hackathon') return;
  if (e.code === 'KeyU' && game.state === GameState.PLAYING) {
    fireHackathonUlt();
  }
});

function renderHackathonCompanion() {
  if (activeLocation !== 'hackathon' || !juniorCompanion) return;
  const jr = juniorCompanion;

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  if (jr.alive) {
    // Attack visual (AOE circle)
    if (jr.attackVisual > 0) {
      ctx.globalAlpha = jr.attackVisual / 0.3 * 0.3;
      ctx.fillStyle = '#7ee787';
      ctx.beginPath();
      ctx.arc(jr.x, jr.y, jr.attackRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Body
    ctx.fillStyle = jr.derpTimer > 0 ? '#e3b341' : '#7ee787';
    ctx.beginPath();
    ctx.arc(jr.x, jr.y, jr.radius, 0, Math.PI * 2);
    ctx.fill();

    // "Jr" label
    ctx.fillStyle = '#0d1117';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jr', jr.x, jr.y);
    ctx.textBaseline = 'alphabetic';

    // HP bar
    const barW = jr.radius * 2;
    const barH = 3;
    ctx.fillStyle = '#21262d';
    ctx.fillRect(jr.x - jr.radius, jr.y - jr.radius - 6, barW, barH);
    ctx.fillStyle = jr.hp / jr.maxHp > 0.3 ? '#3fb950' : '#f85149';
    ctx.fillRect(jr.x - jr.radius, jr.y - jr.radius - 6, barW * (jr.hp / jr.maxHp), barH);

    // Derp indicator
    if (jr.derpTimer > 0) {
      ctx.fillStyle = '#e3b341';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💤', jr.x, jr.y - jr.radius - 12);
    }
  } else {
    // Dead marker
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#f85149';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💀', jr.x, jr.y);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function renderHackathonHUD() {
  const jr = juniorCompanion;
  if (!jr) return;

  ctx.textAlign = 'right';
  ctx.font = '12px monospace';

  if (jr.alive) {
    ctx.fillStyle = '#7ee787';
    ctx.fillText(`Junior: ${Math.ceil(jr.hp)}/${jr.maxHp} HP`, canvasWidth - 16, 64);
    if (jr.derpTimer > 0) {
      ctx.fillStyle = '#e3b341';
      ctx.fillText('(zoning out...)', canvasWidth - 16, 78);
    }
  } else {
    ctx.fillStyle = '#f85149';
    ctx.fillText('Junior: KIA', canvasWidth - 16, 64);
  }

  if (hackathonUltReady && !hackathonUltUsed) {
    const flash = Math.sin(game.elapsed * 4) * 0.3 + 0.7;
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#7ee787';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ PAIR PROGRAMMING ULT READY — Press U', canvasWidth / 2, 80);
    ctx.globalAlpha = 1;
  }
}

// ================================================================
// TASK-16 — Infinite Loop: reset enemies every 3 minutes
// ================================================================
let loopCycleTimer = 0;
let loopCycleCount = 0;
const LOOP_CYCLE_DURATION = 180; // 3 minutes

function updateInfiniteLoop(dt) {
  if (activeLocation !== 'infinite_loop') return;

  loopCycleTimer += dt;
  if (loopCycleTimer >= LOOP_CYCLE_DURATION) {
    loopCycleTimer = 0;
    loopCycleCount++;

    // Reset all enemies (but keep player stats/skills)
    enemies.length = 0;

    // Reset boss state
    bossState.active = null;
    bossState.warningShown = false;
    bossState.warningTimer = 0;
    bossState.aoeActive = null;
    const bossBar = document.getElementById('boss-hp-bar');
    if (bossBar) bossBar.classList.remove('visible');

    // Reset spawner for fresh wave
    spawner.timer = 0;
    spawner.waveNumber = 0;
    spawner.unlockedTypes = 1;
    spawner.eliteTimer = 0;

    // Visual feedback
    visualEffects.push({
      type: 'loop_reset',
      timer: 2,
      maxTimer: 2,
    });
  }
}

function renderInfiniteLoopHUD() {
  const barX = 16;
  const barY = 36;

  // Cycle counter
  ctx.textAlign = 'left';
  ctx.fillStyle = '#a371f7';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`Loop #${loopCycleCount + 1}`, barX, barY + 6);

  // Progress to next reset
  const barW = 100;
  const barH = 6;
  const progress = loopCycleTimer / LOOP_CYCLE_DURATION;
  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX + 80, barY, barW, barH);
  ctx.fillStyle = '#a371f7';
  ctx.fillRect(barX + 80, barY, barW * progress, barH);
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 80, barY, barW, barH);

  const remaining = Math.ceil(LOOP_CYCLE_DURATION - loopCycleTimer);
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';
  ctx.fillText(`Reset in ${remaining}s`, barX, barY + barH + 12);

  // Loop reset visual effect
  for (const vfx of visualEffects) {
    if (vfx.type === 'loop_reset') {
      const alpha = vfx.timer / vfx.maxTimer;
      ctx.fillStyle = `rgba(163, 113, 247, ${alpha * 0.15})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#a371f7';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`♻ LOOP ${loopCycleCount + 1} — ENEMIES RESET`, canvasWidth / 2, canvasHeight / 2 - 40);
      ctx.globalAlpha = 1;
    }
  }
}

// ================================================================
// TASK-16 — Production Server: no idle allowed
// ================================================================
let playerIdleTime = 0;
let serverTemperature = 50; // 0-100
let prodLastPlayerX = 0;
let prodLastPlayerY = 0;
let prodIdleWarning = false;
let prodIdleDamaging = false;

function updateProductionServer(dt) {
  if (activeLocation !== 'production_server') return;

  // Check if player moved
  const moved = (Math.abs(player.x - prodLastPlayerX) > 1 || Math.abs(player.y - prodLastPlayerY) > 1);
  prodLastPlayerX = player.x;
  prodLastPlayerY = player.y;

  if (moved) {
    playerIdleTime = 0;
    prodIdleWarning = false;
    prodIdleDamaging = false;
    // Cool down temperature when moving
    serverTemperature = Math.max(20, serverTemperature - 15 * dt);
  } else {
    playerIdleTime += dt;

    if (playerIdleTime > 2) {
      prodIdleWarning = true;
      // Heat up temperature
      serverTemperature = Math.min(100, serverTemperature + 25 * dt);
    }

    if (playerIdleTime > 3) {
      prodIdleDamaging = true;
      // 20 HP/sec damage
      player.hp -= 20 * dt;
      serverTemperature = Math.min(100, serverTemperature + 35 * dt);
      if (player.hp <= 0) {
        player.hp = 0;
        game.state = GameState.GAMEOVER;
        if (typeof handleDeath === 'function') handleDeath();
      }
    }
  }

  // Passive temperature from combat (enemies nearby = hotter)
  const nearbyEnemies = enemies.filter(e => {
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    return dx * dx + dy * dy < 300 * 300;
  }).length;
  serverTemperature = Math.min(100, serverTemperature + nearbyEnemies * 0.5 * dt);
  serverTemperature = Math.max(20, serverTemperature - 2 * dt); // passive cooling
}

function renderProductionServerHUD() {
  const barX = 16;
  const barY = 36;

  // Server temperature gauge
  const barW = 140;
  const barH = 8;

  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);

  let tempColor;
  if (serverTemperature < 50) tempColor = '#3fb950';
  else if (serverTemperature < 75) tempColor = '#e3b341';
  else tempColor = '#f85149';

  ctx.fillStyle = tempColor;
  ctx.fillRect(barX, barY, barW * (serverTemperature / 100), barH);
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';
  ctx.fillText(`🌡️ Server: ${Math.round(serverTemperature)}°C`, barX, barY + barH + 10);

  // Idle warning
  if (prodIdleWarning) {
    const flash = Math.sin(game.elapsed * 6) * 0.3 + 0.7;
    ctx.globalAlpha = flash;
    ctx.textAlign = 'center';

    if (prodIdleDamaging) {
      ctx.fillStyle = '#f85149';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('🔥 SERVER OVERHEATING — MOVE NOW!', canvasWidth / 2, 60);
      ctx.font = '12px monospace';
      ctx.fillText('-20 HP/sec', canvasWidth / 2, 80);
    } else {
      ctx.fillStyle = '#e3b341';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('⚠️ IDLE DETECTED — Keep moving!', canvasWidth / 2, 60);
    }
    ctx.globalAlpha = 1;
  }
}

// ================================================================
// Render location-specific HUD elements
// ================================================================
function renderLocationHUD() {
  if (activeLocation === 'legacy_codebase') {
    renderTechDebtBar();
    if (refactoring) renderRefactorOverlay();
  } else if (activeLocation === 'cloud') {
    renderCloudHUD();
  } else if (activeLocation === 'infinite_loop') {
    renderInfiniteLoopHUD();
  } else if (activeLocation === 'production_server') {
    renderProductionServerHUD();
  } else if (activeLocation === 'hackathon') {
    renderHackathonHUD();
  }
}

// Render location world elements (called in world-space rendering)
function renderLocationWorld() {
  if (activeLocation === 'hackathon') {
    renderHackathonCompanion();
  }
}

// Render location post-processing (called after all rendering, before HUD)
function renderLocationPostProcess() {
  if (activeLocation === 'dark_mode') {
    renderDarkModeOverlay();
  }

  // Hackathon ult visual effect
  for (const vfx of visualEffects) {
    if (vfx.type === 'hackathon_ult') {
      const progress = 1 - vfx.timer / vfx.maxTimer;
      const radius = vfx.maxRadius * progress;
      const alpha = (1 - progress) * 0.4;

      ctx.save();
      ctx.translate(-camera.x, -camera.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#7ee787';
      ctx.beginPath();
      ctx.arc(vfx.x, vfx.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

function renderTechDebtBar() {
  const barW = 140;
  const barH = 8;
  const barX = 16;
  const barY = 36; // below HP bar

  // Background
  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);

  // Fill color based on debt level
  let debtColor;
  if (techDebt < 40) debtColor = '#3fb950';
  else if (techDebt < 70) debtColor = '#e3b341';
  else debtColor = '#f85149';

  ctx.fillStyle = debtColor;
  ctx.fillRect(barX, barY, barW * (techDebt / 100), barH);

  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#8b949e';
  ctx.font = '10px monospace';
  ctx.fillText(`Debt: ${Math.round(techDebt)} [R] refactor`, barX, barY + barH + 10);
}

function renderRefactorOverlay() {
  const pct = refactorTimer / REFACTOR_DURATION;
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(35, 134, 54, 0.08)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Progress bar at center
  const barW = 200;
  const barH = 12;
  const barX = (canvasWidth - barW) / 2;
  const barY = canvasHeight / 2 + 40;

  ctx.fillStyle = '#21262d';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#3fb950';
  ctx.fillRect(barX, barY, barW * (1 - pct), barH);
  ctx.strokeStyle = '#30363d';
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#3fb950';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('REFACTORING...', canvasWidth / 2, barY - 10);
  ctx.fillStyle = '#8b949e';
  ctx.font = '12px monospace';
  ctx.fillText(`${Math.ceil(refactorTimer)}s remaining — press R to cancel`, canvasWidth / 2, barY + barH + 16);
}

// ================================================================
// Hook into showLevelUpScreen — route to location-specific UI
// ================================================================
const _originalShowLevelUp = typeof showLevelUpScreen === 'function' ? showLevelUpScreen : null;

// This will be called from addXp() instead of showLevelUpScreen
function locationAwareLevelUp() {
  if (activeLocation === 'staging') {
    showStagingLevelUp();
  } else if (activeLocation === 'legacy_codebase') {
    showLegacyLevelUp();
  } else if (_originalShowLevelUp) {
    _originalShowLevelUp();
  }
}

// ================================================================
// Master location update — called from game loop
// ================================================================
function updateLocationMechanics(dt) {
  updateLegacyMechanic(dt);
  updateDarkMode(dt);
  updateCloudInfra(dt);
  updateIncident(dt);
  updateIncidentEffects(dt);
  updateHackathon(dt);
  updateInfiniteLoop(dt);
  updateProductionServer(dt);

  // Update visual effects timers
  for (let i = visualEffects.length - 1; i >= 0; i--) {
    const vfx = visualEffects[i];
    if (vfx.type === 'loop_reset' || vfx.type === 'hackathon_ult') {
      vfx.timer -= dt;
      if (vfx.timer <= 0) {
        visualEffects.splice(i, 1);
      }
    }
  }
}

// ================================================================
// Reset location state
// ================================================================
function resetLocationState() {
  // Staging
  stagingPrNumber = 0;
  stagingRejectsLeft = STAGING_MAX_REJECTS;

  // Legacy
  techDebt = 0;
  refactoring = false;
  refactorTimer = 0;

  // Dark Mode
  darkModeBaseRadius = 150;
  darkModeLamps = [];

  // Cloud Infrastructure
  cloudCredits = 100;
  cloudSkillsDisabled = false;

  // Incident/Outage
  incidentTimer = 60;
  incidentActive = false;
  if (incidentInterval) { clearInterval(incidentInterval); incidentInterval = null; }
  document.getElementById('incident-overlay').classList.remove('visible');
  player._incidentSpeedBoost = 0;

  // Hackathon
  juniorCompanion = null;
  hackathonUltReady = false;
  hackathonUltUsed = false;

  // Infinite Loop
  loopCycleTimer = 0;
  loopCycleCount = 0;

  // Production Server
  playerIdleTime = 0;
  serverTemperature = 50;
  prodLastPlayerX = player.x;
  prodLastPlayerY = player.y;
  prodIdleWarning = false;
  prodIdleDamaging = false;
}

// ================================================================
// Initialize location on game start
// ================================================================
function initLocation(locationId) {
  activeLocation = locationId || 'localhost';
  resetLocationState();

  if (activeLocation === 'hackathon') {
    initHackathonCompanion();
  }
  if (activeLocation === 'production_server') {
    prodLastPlayerX = player.x;
    prodLastPlayerY = player.y;
  }
}
